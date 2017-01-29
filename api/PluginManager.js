/* eslint-env node */

'use strict';

module.exports = {
  PluginManager: PluginManager
}


// Internals

// _plugins holds an array with information about each installed plugin.
// It has the following properties:
// - name : The name of the plugin; e.g. 'xxx'
// - description : description
// - author : The username of the plugins publisher
// - homepage : URL of the plugins homepage
// - version : The version; derived from the plugins package.json
// - latestVersion : The latest version published on npmjs.io
// - isLatestVersion : Flag describing if the installed version is the latest available; Values: "n/a", "1" or "0".
// - homebridgeMinVersion : The minimum version of homebridge the plugin needs
// - platformUsage : Number of platforms using this plugin
// - accessoryUsage : Number of accessories using this plugin
var _plugins = {};

var hbsPath = "";
var hbLog = function() {};       // eslint-disable-line

function PluginManager(libPath, log) {
    hbsPath = libPath;
    hbLog = log;
    getInstalledPlugins();
}

PluginManager.prototype.plugins = function() {
    return _plugins;
}


PluginManager.prototype.search = function(query, callback) {
    var utilsLib = require(hbsPath + "api/utils.js");
    var utils = new utilsLib.Utils();

    var options = {
        host: 'api.npms.io',
        port: 443,
        path: '/v2/search?q=' + (!query || 0 === query.length ? '' : query + '+') + 'keywords:homebridge-plugin+not:deprecated+not:insecure&size=250',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    utils.getJSON(options, function(statusCode, result) {
        var results = result.results;

        // Check for each result if already installed
        // TODO: this is inefficient for sites with a lot of plugins...
        for (var result_id in results) {
            results[result_id].hb_IsInstalled = 0;
            for (var pluginID in _plugins) {
                var plugin = _plugins[pluginID];
                if (plugin.name.toLowerCase().replace(/ /g, '-') === results[result_id].package.name) {
                    results[result_id].hb_IsInstalled = 1;
                    // results[pf_ID].hb_installedVersion = pf.version;
                }
            }
        }
        callback(results);
    });
}

function npmOperation(options, callback) {
    var spawn = require('child_process').spawn;
    var npmProcess = spawn('npm', options);

    npmProcess.stdout.on('data', function (data) {
        callback(false, data, false);
    });

    npmProcess.stderr.on('data', function (data) {
        callback(false, data, false);
    });

    npmProcess.on('close', function (code) {
        callback(true, code, true);
    });
}

PluginManager.prototype.installPlugin = function(pluginName, callback) {
    checkAccessRights(pluginName, function(result, msg) {
        if (result === false) {
            callback(false, msg, true);
            return;
        }
        // npmOperation(['install', '-g', pluginName, '--dry-run'], callback);
        npmOperation(['install', '-g', pluginName], callback);
    });
}


PluginManager.prototype.updatePlugin = function(pluginName, callback) {
    checkAccessRights(pluginName, function(result, msg) {
        if (result === false) {
            callback(false, msg, true);
            return;
        }
        // We use 'npm install' instead of 'npm update' since 'update' ignores the version tag.
        // npmOperation(['install', '-g', pluginName, '--dry-run'], callback);
        npmOperation(['install', '-g', pluginName], callback);
    });
}


PluginManager.prototype.removePlugin = function(pluginName, callback) {
    checkAccessRights(pluginName, function(result, msg) {
        if (result === false) {
            callback(false, msg, true);
            return;
        }
        // npmOperation(['uninstall', '-g', pluginName, '--dry-run'], callback);
        npmOperation(['uninstall', '-g', pluginName], callback);
    });
}

/**
 * Scans the node-modules directory for homebridge plugins.
 * Subsequently calls enrichUsageInfo() and enrichMetadata() to gather further information.
 * _plugins gets updated by these functions.
 */
function getInstalledPlugins() {
    var fs = require('fs');
    var plugins = [];

    var globalModulePath = require('global-modules') + "/";
    var possiblePaths = [globalModulePath, hbsPath+"../"];
    possiblePaths.forEach(function(modulePath) {
        if (! fs.existsSync(modulePath)) {
            return;
        }
        var modules = fs.readdirSync(modulePath);
        for (var moduleID in modules) {
            var moduleName = modules[moduleID];
            if (moduleName.startsWith('homebridge-')) {
                var packagePath = modulePath + moduleName + "/package.json";
                var packageJSON = require(packagePath);
                var plugin = {
                    "name": moduleName,
                    "version": packageJSON.version,
                    "latestVersion": "n/a",
                    "isLatestVersion": "n/a",
                    "platformUsage": 0,
                    "accessoryUsage": 0
                }
                plugins.push(plugin);
            }
        }
    });
    _plugins = plugins;
    enrichUsageInfo();
    enrichMetadata();
}


/**
 * Set information if a plugin is used by this homebridge site.
 * Updates _plugins with this information.
 */
function enrichUsageInfo() {
    var utilsLib = require(hbsPath + 'api/utils.js');
    var utils = new utilsLib.Utils();

    var options = {
        // host: 'api.npms.io',
        port: 8765,
        path: '/api/installedPlatforms',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    utils.getJSON(options, function(statusCode, platforms) {
        for (var pluginID in _plugins) {
            for (var pf_id in platforms) {
                if (platforms[pf_id]['hbServer_pluginName'] === _plugins[pluginID]["name"]) {
                    _plugins[pluginID]['platformUsage']++;
                }
            }
        }
    });
}


/**
 * Retrieve further information from npms.io (by calling fetchPluginMetaData()) and store it in the plugin properties.
 * Updates _plugins.
 */
function enrichMetadata() {
    var semver = require('semver');

    for (var pluginID in _plugins) {
        fetchPluginMetaData(_plugins[pluginID].name, pluginID, function(metadata, cpluginID) {
            _plugins[cpluginID]["description"] = "n/a";
            _plugins[cpluginID]["author"] = "n/a";
            _plugins[cpluginID]["homepage"] = "n/a";
            _plugins[cpluginID]["homebridgeMinVersion"] = "n/a";
            _plugins[cpluginID]["latestVersion"] = "n/a";
            _plugins[cpluginID]["isLatestVersion"] = "n/a";
            if  (metadata["collected"].hasOwnProperty("metadata")) {
                _plugins[cpluginID]["description"] = metadata["collected"]["metadata"].hasOwnProperty("description") ? metadata["collected"]["metadata"]["description"] : "n/a";

                _plugins[cpluginID]["author"] = "n/a";
                if (metadata["collected"]["metadata"].hasOwnProperty("publisher")) {
                    _plugins[cpluginID]["author"] = metadata["collected"]["metadata"]["publisher"].hasOwnProperty("username") ? metadata["collected"]["metadata"]["publisher"]["username"] : "n/a";
                }

                _plugins[cpluginID]["homepage"] = "n/a";
                if (metadata["collected"]["metadata"].hasOwnProperty("links")) {
                    _plugins[cpluginID]["homepage"] = metadata["collected"]["metadata"]["links"].hasOwnProperty("homepage") ? metadata["collected"]["metadata"]["links"]["homepage"] : "n/a";
                }

                _plugins[cpluginID]["homebridgeMinVersion"] = "n/a";
                if (metadata["collected"]["metadata"].hasOwnProperty("dependencies")) {
                    _plugins[cpluginID]["homebridgeMinVersion"] = metadata["collected"]["metadata"]["dependencies"].hasOwnProperty("homebridge") ? metadata["collected"]["metadata"]["dependencies"]["homebridge"] : "n/a";
                }

                var latestVersion = metadata["collected"]["metadata"].hasOwnProperty("version") ? metadata["collected"]["metadata"]["version"] : "n/a";
                _plugins[cpluginID]["latestVersion"] = latestVersion;
                if (semver.lt(_plugins[cpluginID]["version"], latestVersion)) {
                    _plugins[cpluginID]["isLatestVersion"] = "0";
                } else {
                    _plugins[cpluginID]["isLatestVersion"] = "1";
                }
            }
        });
    }
}


/**
 * Queries npms.io for plugin metadata. Used by enrichMetadata().
 * @param  {string}   pluginName   Name of the plugin to query
 * @param  {Function} callback Called with the query result.
 */
function fetchPluginMetaData(pluginName, pluginID, callback) {
    var utilsLib = require(hbsPath + 'api/utils.js');
    var utils = new utilsLib.Utils();

    var searchname = (pluginName.toLowerCase().replace(/ /g, '-'));

    var options = {
        host: 'api.npms.io',
        port: 443,
        path: '/v2/package/' + searchname,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    utils.getJSON(options, function(statusCode, result) {
        if (statusCode === 200) {
            callback(result, pluginID);
        }
    });
}


function checkAccessRights(pluginName, callback) {
    var fs = require('fs');
    var globalModulePath = require('global-modules') + "/";
    var modulePath = globalModulePath;

    var pluginNameClean = pluginName;

    // Remove version tag if provided
    var tagIndex = pluginName.indexOf("@");
    if (tagIndex !== -1) {
        pluginNameClean = pluginName.substr(0, tagIndex);
    }

    // first, check if global node_modules directory is read/writeable
    fs.access(modulePath, fs.R_OK | fs.W_OK, function(err) {
        if (err) {
            callback(false, "EACCES: No rights to write in " + modulePath);
            return;
        }

        // second, check the plugin directory...
        modulePath = globalModulePath + pluginNameClean;
        // ... if it already exists...
        if (fs.existsSync(modulePath) === true) {
            // ... it must be writeable
            fs.access(modulePath, fs.R_OK | fs.W_OK, function(err) {
                if (err) {
                    callback(false, "EACCES: No rights to write in " + modulePath);
                    return;
                }
                callback(true, "ok");
                return;
            });
        } else {
            callback(true, "ok");
        }
    });
}
