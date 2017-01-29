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

    // ... contains a list of installed plugins.
    // var installedPlugins = "";

    function loadHTML(name, callback) {
        var path = hbsPath + "content/" + name;
        fs.readFile(path, 'utf8', function(err, data) {
            if (err) {
                log(err);
                callback("");
            }
            callback(data);
        });
    }

    var header, navBar, footer, mainHTML, pluginsHTML, addPlatformHTML, addAccessoryHTML;

    function reloadHTML() {
        loadHTML("header.html", function(data) { header = data; });
        loadHTML("navbar.html", function(data) { navBar = data; });
        loadHTML("footer.html", function(data) { footer = data; });
        loadHTML("main.html", function(data) { mainHTML = data; });
        loadHTML("plugins.html", function(data) { pluginsHTML = data; });
        loadHTML("addPlatform.html", function(data) { addPlatformHTML = data; });
        loadHTML("addAccessory.html", function(data) { addAccessoryHTML = data; });
    }
    reloadHTML();

    // function stripEscapeCodes(chunk) {
    //     var receivedData = chunk.toString()
    //         .replace(/\%7E/g, '~')
    //         .replace(/\%26/g, '&')
    //         .replace(/\%40/g, '@')
    //         .replace(/\%23/g, '#')
    //         .replace(/\%7B/g, '{')
    //         .replace(/\%0D/g, '')
    //         .replace(/\%0A/g, '')
    //         .replace(/\%2C/g, ',')
    //         .replace(/\%7D/g, '}')
    //         .replace(/\%3A/g, ':')
    //         .replace(/\%22/g, '"')
    //         .replace(/\+/g, ' ')
    //         .replace(/\+\+/g, '')
    //         .replace(/\%2F/g, '/')
    //         .replace(/\%3C/g, '<')
    //         .replace(/\%3E/g, '>')
    //         .replace(/\%5B/g, '[')
    //         .replace(/\%5D/g, ']');
    //     return receivedData;
    // }

    // function executeBash(cmd) {
    //     var exec = require('child_process').exec;
    //     exec(cmd, function(error, stdout, stderr) {       // eslint-disable-line
    //         log("Executing: " + cmd);
    //         fs.writeFile(HomebridgeAPI.user.configPath().replace("config.json","exec.out"), stdout, "utf8", function(err, result) {       // eslint-disable-line
    //             if (err) {
    //                 return log(err);
    //             }
    //         });
    //     });
    // }

    // function getInstalledPlugins(res) {
    //     executeBash("npm list -g | grep 'homebridge'");
    //     fs.readFile(HomebridgeAPI.user.configPath().replace("config.json","exec.out"), "utf8", function(err, result) {
    //         if (err) {
    //             return log(err);
    //         } else {
    //             installedPlugins = result;
    //         }
    //     });
    // }

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
                res.write(header + navBar);
                res.write("<div class='alert alert-success alert-dismissible fade in out'><a href='/' class='close' data-dismiss='success'>&times;</a><strong>Succes!</strong> Configuration saved!</div>");
                res.end(footer);
            });
        } else {
            res.write(header + navBar);
            res.write("<div class='alert alert-danger alert-dismissible fade in out'><a href='/' class='close' data-dismiss='alert'>&times;</a><strong>Note!</strong> Please restart Homebridge to activate your changes.</div>");
            fs.writeFile(HomebridgeAPI.user.configPath(), newConfig, "utf8", reloadConfig(res));
        }
    }

    //We need a function which handles requests and send response
    function handleRequest(req, res) {
        reloadHTML();
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
        reloadHTML();   // uncomment when debugging to force reload without restarting the server.
        res.setHeader("Content-Type", "text/html");
        switch (req.url) {
            case '/':
                res.write(header + navBar + mainHTML + footer);
                res.end();
                break;
            case '/listInstallablePlugins':
                res.write(header + navBar + pluginsHTML + footer);
                res.end();
                break;
            case '/addPlatform':
                res.write(header + navBar + addPlatformHTML + footer);
                res.end();
                break;
            case '/addAccessory':
                res.write(header + navBar + addAccessoryHTML + footer);
                res.end();
                break;
            case '/showLog':
                if (config.log == "systemd") {
                      var exec = require('child_process').exec;
                      var cmd = "journalctl --no-pager -u homebridge --since yesterday";
                      exec(cmd, function(error, stdout, stderr) {       // eslint-disable-line
                          log("Executing: " + cmd);
                          res.write(header + navBar);
                          res.write("<div class='container'>");
                          res.write("<h2>Log</h2>");
                          res.write("<code>" + stdout.replace(/(?:\r\n|\r|\n)/g, '<br />') + "</code>");
                          res.write("</div>");
                          res.end(footer);
                      });
                } else {
                  var logFile = require('fs');
                  logFile.readFile(config.log, 'utf8', function(err, log) {
                      if (err) {
                          return log(err);
                      }
                      res.write(header + navBar);
                      res.write("<div class='container'>");
                      res.write("<h2>Log</h2>");
                      res.write("<code>" + log.replace(/(?:\r\n|\r|\n)/g, '<br />') + "</code>");
                      res.write("</div>");
                      res.end(footer);
                  });
                }
                break;
            case '/content/lib.js':
                log("serving /content/lib.js");
                res.setHeader("Content-Type", "application/javascript");
                fs.readFile(hbsPath + 'content/lib.js', 'utf8', function(err, libJS) {
                    if (err) {
                        return log(err);
                    }
                    res.write(libJS);
                    res.end();
                });
                break;
            case '/style.css':
                log("serving style.css");
                res.setHeader("Content-Type", "text/css");
                fs.readFile(hbsPath + 'content/style.css', 'utf8', function(err, css) {
                    if (err) {
                        return log(err);
                    }
                    res.write(css);
                    res.end();
                });
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
