var config = require('./config/config');
var async = require('async');
var createWordnok = require('wordnok').createWordnok;
var callNextTick = require('call-next-tick');
var probable = require('probable');
var canonicalizer = require('canonicalizer');
var iscool = require('iscool')();

var relationshipTypePriority = [
  'antonym',
  'rhyme',
  'same-context',
  'related-word',
  'cross-reference',
  // 'hypernym',
  // 'variant'
];

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey,
  logger: {
    log: function noOp() {}
  }
});

function getPhrase(done) {
  var baseWord;

  async.waterfall(
    [
      wordnok.getTopic,
      saveBase,
      getRelatedWords,
      pickRelatedWord,
      assemblePhrase
    ],
    done
  );

  function saveBase(word, done) {
    baseWord = canonicalizer.getSingularAndPluralForms(word)[0];
    callNextTick(done, null, baseWord);
  }

  function getRelatedWords(word, done) {
    var opts = {
      word: word
    };
    wordnok.getRelatedWords(opts, done);
  }

  function pickRelatedWord(wordDict, done) {
    var picked;
    if (wordDict) {
      relationshipTypePriority.some(getWordOfType);
    }

    if (picked) {
      callNextTick(done, null, picked);
    }
    else {
      callNextTick(done, new Error('Could not find related word.'));
    }

    function getWordOfType(relationshipType) {
      if (relationshipType in wordDict) {
        var words = wordDict[relationshipType];
        var validWords = words.filter(doesNotContainBase).filter(iscool);
        picked = probable.pickFromArray(validWords);
        canonicalizer.getSingularAndPluralForms(picked)[0];
        return true;
      }
      return false;
    }    
  }

  function doesNotContainBase(word) {
    return word.indexOf(baseWord) === -1;
  }

  function assemblePhrase(relatedWord, done) {
    callNextTick(
      done, null, 
      getArticleForWord(baseWord) + ' ' + baseWord +
      ' in the street but ' + getArticleForWord(relatedWord) + ' ' +
      relatedWord + ' in the sheets'
    )
  }
}

function getArticleForWord(word) {
  if (['a', 'e', 'i', 'o', 'u'].indexOf(word.charAt(0).toLowerCase()) === -1) {
    return 'a';
  }
  else {
    return 'an';
  }
}

module.exports = getPhrase;
