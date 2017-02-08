/* eslint-env node */

'use strict';

module.exports = {
  API: API
}

var confMgr, pluginMgr, hbsPath;
var hbLog = function() {};

/**
 * [API description]
 * @param {[type]} homebridge [description]
 */
function API(homebridge, libPath, log) {
    this.HomebridgeAPI = homebridge;
    hbsPath = libPath;
    hbLog = log;

    var pathLib = require('path');

    var ConfigManagerLib = require(pathLib.resolve(hbsPath, 'api', 'ConfigManager.js'));
    confMgr = new ConfigManagerLib.ConfigManager(this.HomebridgeAPI, hbLog);

    var PluginManagerLib = require(pathLib.resolve(hbsPath, 'api', 'PluginManager.js'));
    pluginMgr = new PluginManagerLib.PluginManager(hbsPath, hbLog);
}

/**
 * [getBridgeInfo description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
API.prototype.getBridgeConfig = function(callback) {
    var bridgeConfig = confMgr.config().bridge;
    var resultJSON = {
        bridgePin: bridgeConfig.pin,
        bridgeName: bridgeConfig.name,
        bridgeUsername: bridgeConfig.username,
    }
    callback(resultJSON);
}

API.prototype.saveBridgeConfig = function(configChanges, callback) {
    var changes = [];
    var hasChanges = false;
    if (configChanges.bridgeName) {
        changes["name"] = configChanges.bridgeName;
        hasChanges = true;
    }

    if (configChanges.bridgeUsername) {
        changes["username"] = configChanges.bridgeUsername;
        hasChanges = true;
    }

    if (configChanges.bridgePin) {
        changes["pin"] = configChanges.bridgePin;
        hasChanges = true;
    }

    if (!hasChanges) {
        callback(true, "nothing changed");
        return;
    }

    confMgr.updateBridgeConfig(changes, function(success, msg) {
        callback(success, msg);
        return;
    });
}


API.prototype.createConfigBackup = function (callback) {
    confMgr.backupConfigFile(function(success, msg) {
        callback(success, msg);
        return;
    });
};


/**
 * [getInstalledPlatforms description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
API.prototype.getInstalledPlatforms = function(callback) {
    callback(confMgr.platformsJSON());
}


API.prototype.installPlugin = function(pluginName, callback) {
    pluginMgr.installPlugin(pluginName, function(success, msg, closed) {
        callback(success, msg, closed);
        return;
    })
}


API.prototype.updatePlugin = function(pluginName, callback) {
    pluginMgr.updatePlugin(pluginName, function(success, msg, closed) {
        callback(success, msg, closed);
        return;
    })
}


API.prototype.removePlugin = function(pluginName, callback) {
    pluginMgr.removePlugin(pluginName, function(success, msg, closed) {
        callback(success, msg, closed);
        return;
    })
}


/**
 * [getInstalledAccessories description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
API.prototype.getInstalledAccessories = function(callback) {
    callback(confMgr.accessoriesJSON());
}


/**
 * [getPluginsFromNPMS description]
 * @param  {[type]}   query    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
API.prototype.getPluginsFromNPMS = function(query, callback) {
    pluginMgr.search(query, function(results) {
            callback(results)
    });
}

API.prototype.getInstalledPlugins = function(callback) {
    callback(pluginMgr.plugins());
}

API.prototype.restartHomebridge = function(hbsConfig, callback) {
    if (!hbsConfig.hasOwnProperty("restart")) {
        callback(JSON.stringify({'success': false, 'msg': 'No restart entry in config found!'}));
        return;
    }

    var cmd = hbsConfig.restart;
    if (cmd === "") {
        callback(JSON.stringify({'success': false, 'msg': 'No restart command specified!'}));
        return;
    }

    var exec = require('child_process').exec;
    exec(cmd, function(error, stdout, stderr) {
        if (error) {
            callback({'success': false, 'msg': stderr});
            return;
        }
        callback({'success': true, 'msg': 'Restart command executed.\nPlease wait a while and reload this page.'});
    });
}


/**
 * [addPlatformConfig description]
 * @param  {object}   newConfig Object with two properties: 'plugin' and 'platformConfig'
 * @param  {Function} callback  Will be called upon completion with an result object as parameter (success: Bool, msg: String)
 */
API.prototype.addPlatformConfig = function(newConfig, callback) {
    var newConfigPartClean = newConfig.platformConfig.replace(/\\/g, "").replace(/\'/g, "\"");
    var newConfigJSON = {};
    try {
        newConfigJSON = JSON.parse(newConfigPartClean);
    } catch (e) {
        callback({success: false, msg: 'Invalid JSON.'});
        return;
    }
    newConfigJSON.platform = newConfig.plugin;
    confMgr.addPlatformConfig(newConfigJSON, function(success, msg) {
        callback({success: success, msg: msg});
    });
}


/**
 * [addAccessoryConfig description]
 * @param  {object}   newConfig Object with two properties: 'plugin' and 'accessoryConfig'
 * @param  {Function} callback  Will be called upon completion with an result object as parameter (success: Bool, msg: String)
 */
API.prototype.addAccessoryConfig = function(newConfig, callback) {
    var newConfigPartClean = newConfig.accessoryConfig.replace(/\\/g, "").replace(/\'/g, "\"");
    var newConfigJSON = {};
    try {
        newConfigJSON = JSON.parse(newConfigPartClean);
    } catch (e) {
        callback({success: false, msg: 'Invalid JSON.'});
        return;
    }
    newConfigJSON.accessory = newConfig.plugin;
    confMgr.addAccessoryConfig(newConfigJSON, function(success, msg) {
        callback({success: success, msg: msg});
    });
}
