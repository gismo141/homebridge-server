/* eslint-env node */
var Service, Characteristic, LastUpdate, HomebridgeAPI;       // eslint-disable-line

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;
    homebridge.registerPlatform("homebridge-server", "Server", ServerPlatform);
}

function ServerPlatform(log, config) {
    var fs = require('fs');
    var http = require('http');

    var globalNPMDir = require('global-modules');
    var hbsPath = globalNPMDir + "/homebridge-server/";
    if (config.modulePath) {
        hbsPath = config.modulePath;
    }
    
    var AssetManagerLib = require(hbsPath + 'api/AssetManager.js');
    var Assets = new AssetManagerLib.AssetManager(hbsPath, log);

    function reloadConfig(res) {
        loadConfig();       // eslint-disable-line
        printMainPage(res);       // eslint-disable-line
    }

    function saveConfig(res, backup) {       // eslint-disable-line
        var newConfig = JSON.stringify(configJSON)       // eslint-disable-line
            .replace(/\[,/g, '[')
            .replace(/,null/g, '')
            .replace(/null,/g, '')
            .replace(/null/g, '')
            .replace(/,,/g, ',')
            .replace(/,\]/g, ']');
        newConfig = JSON.stringify(JSON.parse(newConfig), null, 4);
        if (backup != null) {
            fs.writeFile(HomebridgeAPI.user.configPath() + '.bak', newConfig, "utf8", function(err, data) {       // eslint-disable-line
                if (err) {
                    return log(err);
                }
                res.write(Assets.headerHTML() + Assets.navBarHTML());
                res.write("<div class='alert alert-success alert-dismissible fade in out'><a href='/' class='close' data-dismiss='success'>&times;</a><strong>Succes!</strong> Configuration saved!</div>");
                res.end(Assets.footerHTML());
            });
        } else {
            res.write(Assets.headerHTML() + Assets.navBarHTML());
            res.write("<div class='alert alert-danger alert-dismissible fade in out'><a href='/' class='close' data-dismiss='alert'>&times;</a><strong>Note!</strong> Please restart Homebridge to activate your changes.</div>");
            fs.writeFile(HomebridgeAPI.user.configPath(), newConfig, "utf8", reloadConfig(res));
        }
    }

    //We need a function which handles requests and send response
    function handleRequest(req, res) {
        if (req.url.indexOf('/api/') !== -1) {
            handleAPIRequest(req, res);
            return;
        }

        handleContentRequest(req, res);
    }


    var apiLib = require(hbsPath + 'api/api.js')
    var serverAPI = new apiLib.API(HomebridgeAPI, hbsPath, log);

    /**
     * [handleAPIRequest description]
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     * @return {[type]}     [description]
     */
    function handleAPIRequest(req, res) {
        log("handleAPIRequest: " + req.url);
        res.setHeader("Content-Type", "application/json");
        var path = require('url').parse(req.url).pathname;
        switch (path) {
            case '/api/bridgeInfo':
                api_bridgeInfo(res);
                break;
            case '/api/installedPlatforms':
                api_installedPlatforms(res);
                break;
            case '/api/accessories':
                api_accessories(res);
                break;
            case '/api/searchPlugins':
                api_searchPlugins(req, res);
                break;
            case '/api/installedPlugins':
                api_installedPlugins(res);
                break;
            case '/api/saveBridgeConfig':
                api_saveBridgeConfig(req, res);
                break;
            case '/api/createConfigBackup':
                api_createConfigBackup(res);
                break;
            case '/api/installPlugin':
                api_installPlugin(req, res);
                break;
            case '/api/updatePlugin':
                api_updatePlugin(req, res);
                break;
            case '/api/removePlugin':
                api_removePlugin(req, res);
                break;
            case '/api/restartHomebridge':
                api_restartHomebridge(res);
                break;
            case '/api/addPlatformConfig':
                api_addPlatformConfig(req, res);
                break;
            case '/api/addAccessoryConfig':
                api_addAccessoryConfig(req, res);
                break;
            default:
                log("unhandled API request: " + req);
                res.statusCode = 404;
                res.write(JSON.stringify({error: "The called API doesn't exist."}));
                res.end();
        }
    }


    /**
     * [handleContentRequest description]
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     * @return {[type]}     [description]
     */
    function handleContentRequest(req, res) {
        log("handleContentRequest: " + req.url);
        // Assets.reload();   // uncomment when debugging to force reload without restarting the server.
        res.setHeader("Content-Type", "text/html");
        switch (req.url) {
            case '/':
                res.write(Assets.headerHTML() + Assets.navBarHTML() + Assets.mainHTML() + Assets.footerHTML());
                res.end();
                break;
            case '/listInstallablePlugins':
                res.write(Assets.headerHTML() + Assets.navBarHTML() + Assets.pluginsHTML() + Assets.footerHTML());
                res.end();
                break;
            case '/addPlatform':
                res.write(Assets.headerHTML() + Assets.navBarHTML() + Assets.addPlatformHTML() + Assets.footerHTML());
                res.end();
                break;
            case '/addAccessory':
                res.write(Assets.headerHTML() + Assets.navBarHTML() + Assets.addAccessoryHTML() + Assets.footerHTML());
                res.end();
                break;
            case '/showLog':
                if (config.log == "systemd") {
                      var exec = require('child_process').exec;
                      var cmd = "journalctl --no-pager -u homebridge --since yesterday";
                      exec(cmd, function(error, stdout, stderr) {       // eslint-disable-line
                          log("Executing: " + cmd);
                          res.write(Assets.headerHTML() + Assets.navBarHTML());
                          res.write("<div class='container'>");
                          res.write("<h2>Log</h2>");
                          res.write("<code>" + stdout.replace(/(?:\r\n|\r|\n)/g, '<br />') + "</code>");
                          res.write("</div>");
                          res.end(Assets.footerHTML());
                      });
                } else {
                  var logFile = require('fs');
                  logFile.readFile(config.log, 'utf8', function(err, log) {
                      if (err) {
                          return log(err);
                      }
                      res.write(Assets.headerHTML() + Assets.navBarHTML());
                      res.write("<div class='container'>");
                      res.write("<h2>Log</h2>");
                      res.write("<code>" + log.replace(/(?:\r\n|\r|\n)/g, '<br />') + "</code>");
                      res.write("</div>");
                      res.end(Assets.footerHTML());
                  });
                }
                break;
            case '/content/lib.js':
                log("serving /content/lib.js");
                res.setHeader("Content-Type", "application/javascript");
                res.write(Assets.libJS());
                res.end();
                break;
            case '/style.css':
                log("serving style.css");
                res.setHeader("Content-Type", "text/css");
                res.write(Assets.styleCSS());
                res.end();
                break;
            default:
                log("unhandled request: " + req.url);
                // var url = req.url;
                // if (url.indexOf('/remove') !== -1) {
                //     object = url.replace('/remove', '');
                //     if (object.indexOf('Platform') !== -1) {
                //         platform = object.replace('Platform', '');
                //         delete configJSON.platforms[platform];
                //         log("Removed platform " + platform + ".");
                //     } else if (object.indexOf('Accessory') !== -1) {
                //         accessory = object.replace('Accessory', '');
                //         delete configJSON.accessories[accessory];
                //         log("Removed accessory " + accessory + ".");
                //     }
                //     saveConfig(res);
                // }
        }
    }

    // Launches the webserver and transmits the website by concatenating the precreated markup
    var server = http.createServer(handleRequest);

    server.listen(config.port, function() {
      var os = require('os');
      var ifaces = os.networkInterfaces();

      Object.keys(ifaces).forEach(function (ifname) {
        ifaces[ifname].forEach(function (iface) {
          if ('IPv4' !== iface.family || iface.internal !== false) {
            return;
          }
          log("is listening on: http://%s:%s", iface.address, config.port);
        });
      });
    });



    function api_bridgeInfo(res) {
        serverAPI.getBridgeInfo(function (json) {
            res.write(JSON.stringify(json));
            res.end();
        });
    }

    function api_installedPlatforms(res) {
        serverAPI.getInstalledPlatforms(function (json) {
            res.write(JSON.stringify(json));
            res.end();
        });
    }

    function api_accessories(res) {
        serverAPI.getInstalledAccessories(function (json) {
            res.write(JSON.stringify(json));
            res.end();
        });
    }

    function api_searchPlugins(req, res) {
        var query = require('url').parse(req.url).query;
        serverAPI.getPluginsFromNPMS(query, function (json) {
            res.write(JSON.stringify(json));
            res.end();
        });
    }

    function api_installedPlugins(res) {
        serverAPI.getInstalledPlugins(function (json) {
            res.write(JSON.stringify(json));
            res.end();
        })
    }

    function api_saveBridgeConfig(req, res) {
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

    function api_createConfigBackup(res) {
        serverAPI.createConfigBackup(function (result, error) {
            res.write(JSON.stringify({'success': result, 'msg': error}));
            res.end();
        });
    }

    function api_installPlugin(req, res) {
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

    function api_updatePlugin(req, res) {
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

    function api_removePlugin(req, res) {
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

    function api_restartHomebridge(res) {
        serverAPI.restartHomebridge(config, function (json) {
            res.write(JSON.stringify(json));
            res.end();
        });
    }

    function api_addPlatformConfig(req, res) {
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

    function api_addAccessoryConfig(req, res) {
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
}

ServerPlatform.prototype.accessories = function(callback) {
    this.accessories = [];
    callback(this.accessories);
}
