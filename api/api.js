'use strict';

module.exports = {
  API: API
}

var utils;

var confMgr, pluginMgr, hbsPath;

/**
 * [API description]
 * @param {[type]} homebridge [description]
 */
function API(homebridge, libPath) {
    console.log("API init");
    this.HomebridgeAPI = homebridge;
    hbsPath = libPath;

    var ConfigManagerLib = require(hbsPath + 'api/ConfigManager.js');
    confMgr = new ConfigManagerLib.ConfigManager(this.HomebridgeAPI, hbsPath);

    var PluginManagerLib = require(hbsPath + 'api/PluginManager.js');
    pluginMgr = new PluginManagerLib.PluginManager(hbsPath);

    var utilsLib = require(hbsPath + 'api/utils.js');
    utils = new utilsLib.Utils();

}

/**
 * [getBridgeInfo description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
API.prototype.getBridgeInfo = function(callback) {
    var bridgeVersion = this.HomebridgeAPI.serverVersion !== undefined ? this.HomebridgeAPI.serverVersion : "unknown";
    var options = {
        host: 'api.npms.io',
        port: 443,
        path: '/v2/package/homebridge',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    utils.getJSON(options, function(statusCode, result) {
        var bridgeConfig = confMgr.config().bridge;
        var os = require('os');
        var osInfo = os.type() + " " + os.arch() + ", Release " + os.release();
        var resultJSON = {
            bridgePin: bridgeConfig.pin,
            bridgeName: bridgeConfig.name,
            bridgeUsername: bridgeConfig.username,
            bridgeVersion: bridgeVersion,
            latestVersion: result["collected"]["metadata"]["version"],
            bridgeMemoryUsed: process.memoryUsage().heapUsed,
            bridgeUptime: process.uptime(),
            bridgeHostOS: osInfo
        }
        callback(resultJSON);
    });
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
        // TODO: check new pin for valid pattern (031-45-154)
        changes["pin"] = configChanges.bridgePin;
        hasChanges = true;
    }

    if (!hasChanges) {
        callback(true, "nothing changed");
        return;
    }

    confMgr.save(changes, function(success, msg) {
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
