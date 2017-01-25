'use strict';

module.exports = {
  API: API
}

var utils;

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

    var ConfigManagerLib = require(hbsPath + 'api/ConfigManager.js');
    confMgr = new ConfigManagerLib.ConfigManager(this.HomebridgeAPI, hbLog);

    var PluginManagerLib = require(hbsPath + 'api/PluginManager.js');
    pluginMgr = new PluginManagerLib.PluginManager(hbsPath, hbLog);

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
        var regex = /^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$/;
        if(regex.test(configChanges.bridgeUsername)) {
            changes["username"] = configChanges.bridgeUsername;
            hasChanges = true;
        } else {
          callback(false, "Invalid username! (Style: XX:XX:XX:XX)");
        }
    }

    if (configChanges.bridgePin) {
      var regex = /^(([0-9]{3})[-]([0-9]{2})[-]([0-9]{3}))$/;
      if(regex.test(configChanges.bridgePin)) {
          changes["pin"] = configChanges.bridgePin;
          hasChanges = true;
      } else {
        callback(false, "Invalid pin! (Style: XXX-XX-XXX)");
      }
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
