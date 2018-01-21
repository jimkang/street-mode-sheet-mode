/* global process */

var config = require('./config/config');
var callNextTick = require('call-next-tick');
var Twit = require('twit');
var getPhrase = require('./get-phrase');
var probable = require('probable');

var dryRun = false;
if (process.argv.length > 2) {
  dryRun = process.argv[2].toLowerCase() == '--dry';
}

var tryLimit = 10;
var tries = 0;

var twit = new Twit(config.twitter);

var StaticWebArchiveOnGit = require('static-web-archive-on-git');
var queue = require('d3-queue').queue;
var randomId = require('idmaker').randomId;

var staticWebStream = StaticWebArchiveOnGit({
  config: config.github,
  title: config.archiveName,
  footerScript: `<script type="text/javascript">
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-49491163-1', 'jimkang.com');
  ga('send', 'pageview');
</script>`,
  maxEntriesPerPage: 50
});

getPhrase(usePhrase);

function usePhrase(error, phrase) {
  tries += 1;

  if (error) {
    console.log(error);
    if (tries < tryLimit) {
      // Try again.
      callNextTick(getPhrase, usePhrase);
    }
  } else {
    postToTargets(buildSentence(phrase), wrapUp);
  }
}

function buildSentence(phrase) {
  var prefix = probable.pickFromArray([
    'Aw yeah – ',
    'You know you want ',
    'Like they say, ',
    "Look out! It's ",
    'You know how it is – '
  ]);
  var suffix = probable.pickFromArray(['!', '.', '. 😉']);
  return prefix + phrase + suffix;
}

function postToTargets(text, done) {
  var q = queue();
  q.defer(postTweet, text);
  q.defer(postToArchive, text);
  q.await(done);
}

function postTweet(text, done) {
  if (dryRun) {
    console.log('Would have tweeted:', text);
    callNextTick(done);
  } else {
    var body = {
      status: text
    };
    twit.post('statuses/update', body, done);
  }
}

function postToArchive(text, done) {
  var id = 'modepair-' + randomId(8);
  staticWebStream.write({
    id,
    date: new Date().toISOString(),
    caption: text
  });
  staticWebStream.end(done);
}

function wrapUp(error, data) {
  if (error) {
    console.log(error, error.stack);

    if (data) {
      console.log('data:', data);
    }
  }
}
