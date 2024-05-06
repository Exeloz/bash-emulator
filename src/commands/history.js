var lineNumbers = require('../utils/lineNumber');

// Default width for number column
var numColumnWidth = 5;

function history(env, args) {
  var splicedHistoryLength = args.length === 1 ? null : args[1];

  env.system.getHistory().then(function(history) {
    var splicedHistory = history.filter(function(element, index) {
      if (!splicedHistoryLength || index >= history.length - splicedHistoryLength) {
        return true;
      }
      return false;
    });
    env.output(lineNumbers.addLineNumbers(numColumnWidth, splicedHistory).join('\n'));
    env.exit();
  });
}

module.exports = history;
