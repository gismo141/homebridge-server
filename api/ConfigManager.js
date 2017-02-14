/* eslint-env node */

'use strict';

module.exports = {
  ConfigManager: ConfigManager
}

// Internals
var homebridgeAPI;
var hbLog = function() {};       // eslint-disable-line

//
var _config = {};

/**
 * Array holding the platforms currently configured for this site.
 * @type {Object} with properties:
 *       - platform : e.g. 'Server'
 *       - pluginName : The plugin used by this platform
 *       - [other config]
 */
var _platformsJSON = [];

/**
 * Array holding the accessories currently configured for this site.
 * @type {Object}
 */
var _accessoriesJSON = [];


/**
 * [ConfigManager description]
 * @param {[type]} hbAPI [description]
 */
function ConfigManager(hbAPI, log) {
    homebridgeAPI = hbAPI;
    hbLog = log;
    loadConfig(hbAPI);
}

/**
 * [config description]
 * @return {[type]} [description]
 */
ConfigManager.prototype.config = function() {
    return _config;
}

/**
 * [platformsJSON description]
 * @return {[type]} [description]
 */
ConfigManager.prototype.platformsJSON = function() {
    return _platformsJSON;
}

/**
 * [accessoriesJSON description]
 * @return {[type]} [description]
 */
ConfigManager.prototype.accessoriesJSON = function() {
    return _accessoriesJSON;
}

ConfigManager.prototype.addPlatformConfig = function(platformConfig, callback) {
    var crypto = require('crypto');
    var hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(platformConfig));
    platformConfig["hbServer_confDigest"] = hash.digest('hex');

    platformConfig["hbServer_active_flag"] = 0;
    platformConfig["hbServer_pluginName"] = platformConfig.platform;

    _platformsJSON.push(platformConfig);
    this.save(callback);
}

ConfigManager.prototype.removePlatformConfig = function(platformConfigID, callback) {
    var posOfRemoveCandidate = -1;
    for (var pos in _platformsJSON) {
        if (_platformsJSON[pos].hbServer_confDigest === platformConfigID) {
            posOfRemoveCandidate = pos;
        }
    }
    if (posOfRemoveCandidate == -1) {
        callback(false, "Invalid configDigest: " + platformConfigID);
        return;
    }
    _platformsJSON.splice(posOfRemoveCandidate, 1);
    this.save(callback);
}

ConfigManager.prototype.addAccessoryConfig = function(accessoryConfig, callback) {
    _accessoriesJSON.push(accessoryConfig);
    this.save(callback);
}

ConfigManager.prototype.updateBridgeConfig = function(changes, callback) {

    // Apply the changes to a copy of _config
    var newConfig = JSON.parse(JSON.stringify(_config));
    for (var key in changes) {
        newConfig.bridge[key] = changes[key];
    }

    // Validate all bridge config fields
    if(/^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$/.test(newConfig.bridge.username) === false) {
        callback(false, "Invalid username! (Style: AA:BB:77:88:22:11)");
        return;
    }
    if(/^(([0-9]{3})[-]([0-9]{2})[-]([0-9]{3}))$/.test(newConfig.bridge.pin) === false) {
        callback(false, "Invalid pin! (Style: 111-22-333)");
        return;
    }

    _config = newConfig;
    this.save(callback);
}


ConfigManager.prototype.save = function(callback) {
    var fs = require('fs');
    // check if config file can be written
    fs.access(homebridgeAPI.user.configPath(), fs.R_OK | fs.W_OK, function(err) {
        if (err) {
            callback(false, "No rights to write config.json.");
            return;
        }
        // save
        var newFileName = homebridgeAPI.user.configPath().replace('config.json', 'config_new.json');
        var cleanConfig = JSON.stringify(_config, internalPropertiesReplacer, 4);
        fs.writeFile(newFileName, cleanConfig, "utf8", function() {
            callback(true, "Saved config.json. \nPlease restart Homebridge to activate your changes.");
            return;
        });
    });
}


function internalPropertiesReplacer(key, value) {
  if (key.startsWith('hbServer_')) {
    return undefined;
  }
  return value;
}

ConfigManager.prototype.backupConfigFile = function(callback) {
    var fs = require('fs');
    fs.readFile(homebridgeAPI.user.configPath(), function (err, data) {
        if (err) {
            callback(false, err + " ");
            return;
        }
        var newFileName = homebridgeAPI.user.configPath() + ".bak";
        fs.writeFile(newFileName, data, function(err) {
            if (err) {
                callback(false, err + " ");
                return;
            }
            callback(true, newFileName);
            return;
        })
    });
}

/**
 * Reads the config file of the homebridge instance.
 * @param  {[type]} HomebridgeAPI [description]
 * @return {[type]}               [description]
 */
function loadConfig() {
    // Start clean
    _platformsJSON = [];
    _accessoriesJSON = [];

    _config = require(homebridgeAPI.user.configPath());
    _platformsJSON = _config.platforms != undefined ? _config.platforms : {};

    var activePlatforms = [];
    var platformPluginMap = [];
    for (var fullName in homebridgeAPI._platforms) {
        var parts = fullName.split('.');
        var pluginName = parts[0];
        var platform = parts[1];
        activePlatforms.push(platform);
        platformPluginMap[platform] = pluginName;
    }
    for (var pf_ID in _platformsJSON) {
        var pf = _platformsJSON[pf_ID];

        var crypto = require('crypto');
        var hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(pf));
        var digest = hash.digest('hex');
        _platformsJSON[pf_ID]["hbServer_confDigest"] = digest;

        _platformsJSON[pf_ID]["hbServer_pluginName"] = platformPluginMap[pf.platform];
        if (activePlatforms.indexOf(pf.platform) === -1) {
            _platformsJSON[pf_ID]["hbServer_active_flag"] = 0;
        } else {
            _platformsJSON[pf_ID]["hbServer_active_flag"] = 1;
        }
    }

    // TODO: implement accessories like platforms...
    _accessoriesJSON = _config.accessories != undefined ? _config.accessories : {};
}
