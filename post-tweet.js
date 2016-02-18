var config = require('./config/config');
var callNextTick = require('call-next-tick');
var Twit = require('twit');
var getPhrase = require('./get-phrase');
var probable = require('probable');

var dryRun = false;
if (process.argv.length > 2) {
  dryRun = (process.argv[2].toLowerCase() == '--dry');
}

var tryLimit = 10;
var tries = 0;

var twit = new Twit(config.twitter);

getPhrase(usePhrase);

function usePhrase(error, phrase) {
  tries += 1;

  if (error) {
    console.log(error);
    if (tries < tryLimit) {
      // Try again.
      callNextTick(getPhrase, usePhrase);
    }
  }
  else {
    postTweet(buildSentence(phrase), wrapUp);
  }
}

function buildSentence(phrase) {
  var prefix = probable.pickFromArray([
    'Aw yeah – ',
    'You know you want ',
    'Like they say, ',
    'Look out! It\'s ',
    'You know how it is – '
  ]);
  var suffix = probable.pickFromArray([
    '!',
    '.',
    '. 😉'
  ]);
  return prefix + phrase + suffix;
}

function postTweet(text, done) {
  if (dryRun) {
    console.log('Would have tweeted:', text);
    callNextTick(done);
  }
  else {
    var body = {
      status: text
    };
    twit.post('statuses/update', body, done);
  }
}

function wrapUp(error, data) {
  if (error) {
    console.log(error, error.stack);

    if (data) {
      console.log('data:', data);
    }
  }
}
