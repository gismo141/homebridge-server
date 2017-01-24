'use strict';

module.exports = {
  ConfigManager: ConfigManager
}

// Internals
var homebridgeAPI;
var hbLog = function() {};

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
    _platformsJSON.push(platformConfig);
    this.save(callback);
}

ConfigManager.prototype.addAccessoryConfig = function(accessoryConfig, callback) {
    _accessoriesJSON.push(accessoryConfig);
    this.save(callback);
}

ConfigManager.prototype.updateBridgeConfig = function(changes, callback) {
    for (var key in changes) {
        _config.bridge[key] = changes[key];
    }
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
            callback(true, "Created 'config.json.bak'.");
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
