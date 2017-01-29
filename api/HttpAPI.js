/* eslint-env node */

'use strict';

module.exports = {
  HttpAPI: HttpAPI
}

var serverAPI

function HttpAPI(HomebridgeAPI, hbsPath, log) {
    var apiLib = require(hbsPath + 'api/api.js')
    serverAPI = new apiLib.API(HomebridgeAPI, hbsPath, log);
}


HttpAPI.prototype.bridgeInfo = function(res) {
    serverAPI.getBridgeInfo(function (json) {
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.installedPlatforms = function(res) {
    serverAPI.getInstalledPlatforms(function (json) {
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.accessories = function(res) {
    serverAPI.getInstalledAccessories(function (json) {
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.searchPlugins = function(req, res) {
    var query = require('url').parse(req.url).query;
    serverAPI.getPluginsFromNPMS(query, function (json) {
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.installedPlugins = function(res) {
    serverAPI.getInstalledPlugins(function (json) {
        res.write(JSON.stringify(json));
        res.end();
    })
}

HttpAPI.prototype.saveBridgeConfig = function(req, res) {
    var body = '';
    req.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        var qs = require('querystring');
        var bodyJSON = qs.parse(body);
        serverAPI.saveBridgeConfig(bodyJSON, function (result, error) {
            res.write(JSON.stringify({'success': result, 'msg': error}));
            res.end();
        });
    });
}

HttpAPI.prototype.createConfigBackup = function(res) {
    serverAPI.createConfigBackup(function (result, error) {
        res.write(JSON.stringify({'success': result, 'msg': error}));
        res.end();
    });
}

HttpAPI.prototype.installPlugin = function(req, res) {
    var pluginName = require('url').parse(req.url).query;
    res.setHeader("Content-Type", "text/text");
    serverAPI.installPlugin(pluginName, function (success, msg, closed) {
        if (closed) {
            res.write("\n");
            res.write(JSON.stringify({'hbsAPIResult': {'success': success, 'msg': msg}}));
            res.end();
        } else {
            res.write(msg);
        }
    });
}

HttpAPI.prototype.updatePlugin = function(req, res) {
    var pluginName = require('url').parse(req.url).query;
    res.setHeader("Content-Type", "text/text");
    serverAPI.updatePlugin(pluginName, function (success, msg, closed) {
        if (closed) {
            res.write("\n");
            res.write(JSON.stringify({'hbsAPIResult': {'success': success, 'msg': msg}}));
            res.end();
        } else {
            res.write(msg);
        }
    });
}

HttpAPI.prototype.removePlugin = function(req, res) {
    var pluginName = require('url').parse(req.url).query;
    res.setHeader("Content-Type", "text/text");
    serverAPI.removePlugin(pluginName, function (success, msg, closed) {
        if (closed) {
            res.write("\n");
            res.write(JSON.stringify({'hbsAPIResult': {'success': success, 'msg': msg}}));
            res.end();
        } else {
            res.write(msg);
        }
    });
}

HttpAPI.prototype.restartHomebridge = function(res, config) {
    serverAPI.restartHomebridge(config, function (json) {
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.addPlatformConfig = function(req, res) {
    var body = '';
    req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        var qs = require('querystring');
        var parts = qs.parse(body);
        serverAPI.addPlatformConfig(parts, function (json) {
            res.write(JSON.stringify(json));
            res.end();
        });
    });
}

HttpAPI.prototype.addAccessoryConfig = function(req, res) {
    var body = '';
    req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        var qs = require('querystring');
        var parts = qs.parse(body);
        serverAPI.addAccessoryConfig(parts, function (json) {
            res.write(JSON.stringify(json));
            res.end();
        });
    });
}
