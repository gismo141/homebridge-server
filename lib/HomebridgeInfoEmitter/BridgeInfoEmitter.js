/* eslint-env node */
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

module.exports = BridgeInfoEmitter;

function BridgeInfoEmitter(options, homebridgeAPI) {
    if (! (this instanceof BridgeInfoEmitter)) return new BridgeInfoEmitter(options, homebridgeAPI);

    if (options) {
        this._config = options;
    } else {
        this._config = {};
    }
    if (!this._config.updateFrequency) {
        this._config.updateFrequency = 10000;
    }
    if (!this._config.updateCheckFrequency) {
        this._config.updateCheckFrequency = 3600000;
    }
    
    this._started = false;
    this._hbAPI = homebridgeAPI;
    this._version = "1.0.0";

    EventEmitter.call(this);
}

inherits(BridgeInfoEmitter, EventEmitter);


BridgeInfoEmitter.prototype.start = function start() {
    var self = this;
    if (self._started) return;

    this._started = true;

    emitInfo(self);
    emitUpdateCheck(self);
};

BridgeInfoEmitter.prototype.stop = function stop() {
    clearInterval(this._interval);
    this._started = false;
};

BridgeInfoEmitter.prototype.initialInfo = function initialData() {
    return gatherInfo(this._hbAPI);
}


// BridgeInfo
function emitInfo(emitter) {
    emitter.emit('bridgeInfo', gatherInfo(emitter._hbAPI));
    setTimeout(function() {
        emitInfo(emitter);
    }, emitter._config.updateFrequency);
}

function gatherInfo(hbAPI) {
    var os = require('os');
    var osInfo = os.type() + " " + os.arch() + ", Release " + os.release();

    var bridgeVersion = hbAPI.serverVersion !== undefined ? hbAPI.serverVersion : "unknown";

    var out = {
        "uptime": process.uptime(),
        "heap": process.memoryUsage().heapUsed,
        "osInfo": osInfo,
        "hbVersion": bridgeVersion
    };
    return out;
}


// Update check
function emitUpdateCheck(emitter) {
    getLatestHomebridgeVersion(function(version) {
        var semver = require('semver');
        var bridgeUpdateAvailable;
        if ((version === "unknown") || (!emitter._hbAPI.serverVersion)) {
            bridgeUpdateAvailable = {
                "state": "unknown",
                "latestVersion": "unknown"
            }
        } else {
            bridgeUpdateAvailable = {
                "updateAvailable": semver.gt(version, emitter._hbAPI.serverVersion),
                "latestVersion": version
            };
        }
        emitter.emit('bridgeUpdateAvailable', bridgeUpdateAvailable);
        setTimeout(function() {
            emitUpdateCheck(emitter);
        }, emitter._config.updateCheckFrequency);
    })
}


// Utils
function getLatestHomebridgeVersion(callback) {
    var options = {
        host: 'api.npms.io',
        port: 443,
        path: '/v2/package/homebridge',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

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
                if (obj["collected"]["metadata"]["version"]) {
                    callback(obj["collected"]["metadata"]["version"]);
                    return;
                }
                callback("unknown");
            }
        });
    });
    req.on('error', function(err) {
        console.log('error: ' + err.message);       // eslint-disable-line
        callback("unknown");
    });
    req.end();
}
