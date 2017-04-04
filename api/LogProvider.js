/* eslint-env node, es6 */

'use strict';

module.exports = {
  LogProvider: LogProvider
}

// Used for generating the subscriptionIDs
var uuid = require('uuid');

// The path to the logfile
var logFilePath;

// The process; reads the logfile and emits data
var tailProcess;

// The active subscriptionIDs are stored in this Set
var subscriptions = new Set();


function LogProvider(newLogFilePath) {
    logFilePath = newLogFilePath;

    // Setup the tail process, but don't start it.
    var Tail = require('tail').Tail;
    try {
        tailProcess = new Tail(logFilePath);
    } catch (e) {
        return;
    }
    tailProcess.unwatch();
}


//
// Paging
//
LogProvider.prototype.logFileContent = function(page, callback) {
    var linesPerPage = 100;

    var fs = require('fs');
    fs.access(logFilePath, fs.R_OK , function(err) {
        if (err) {
          switch(err.code) {
            case 'ENOENT':
            fs.writeFile(logFilePath, "Log-File created", function(err) {
              if(err) {
                return console.log(err);
              }
              console.log("The file was saved!");
            });
            break;
            default:
            callback(false, "Problem reading file: " + logFilePath + " " + err);
            return;
          }
        }

        var lineReader = require('line-reader');
        var lines = [];
        var currentLineNumber = 0;
        lineReader.eachLine(logFilePath, function(line, last) {
            currentLineNumber++;
            if ((currentLineNumber >= ((page -1)  * linesPerPage)) &&
                (currentLineNumber < (page * linesPerPage))) {
                lines.push(line);
            }
            if (last) {
                var result = {
                    "currentPage": page,
                    "totalLines": currentLineNumber,
                    "lastPage": Math.ceil(currentLineNumber / linesPerPage),
                    "lines": lines
                };
                callback(true, result);
                return false; // stop reading
            }
        });
    });
}


//
// Tailing
//

// Generates a new subscriptionID, adds it to 'subscriptions' and returns it.
LogProvider.prototype.subscribe = function(callback) {
    var fs = require('fs');
    fs.access(logFilePath, fs.R_OK , function(err) {
        if (err) {
            callback(false, "Problem reading file: " + logFilePath + " " + err);
            return;
        }

        var newID = uuid.v4();
        subscriptions.add(newID);
        tailProcess.watch();
        callback(true, newID);
    });
}

// Removes a given subscriptionID from 'subscriptions'.
// If there are no more subscriptions, the tail is stopped and emits no further data.
LogProvider.prototype.unsubscribe = function(id) {
    subscriptions.delete(id);
    if (subscriptions.size === 0) {
        tailProcess.unwatch();
    }
}


// Called by clients with a subscriptionID and a callback. The callback is called,
// if the given subscriptionID is still subscribed.
LogProvider.prototype.output = function(subscriptionID, callback) {
    // check subscriptionID
    if (!subscriptions.has(subscriptionID)) {
        callback(false, "not_subscribed");
        return;
    }

    tailProcess.on("line", function(data) {
        if (subscriptions.has(subscriptionID)) {
            callback(true, data);
        }
    });

    tailProcess.on("error", function(error) {
      callback(false, error)
    });
}
