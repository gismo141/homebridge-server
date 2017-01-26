/* eslint-env node */

'use strict';

module.exports = {
  Utils: Utils
}

function Utils() {}

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
Utils.prototype.getJSON = function (options, onResult) {
    var http = require("http");
    var https = require("https");

    var prot = options.port == 443 ? https : http;
    var req = prot.request(options, function(res) {
        var output = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            output += chunk;
        });
        res.on('end', function() {
            if (res.statusCode === 200) {
                var obj = JSON.parse(output);
                onResult(res.statusCode, obj);
            }
        });
    });
    req.on('error', function(err) {
        console.log('error: ' + err.message);
    });
    req.end();
};
