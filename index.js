var Service, Characteristic, LastUpdate, HomebridgeAPI;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;
    homebridge.registerPlatform("homebridge-server", "Server", ServerPlatform);
}

function ServerPlatform(log, config) {
    var fs = require('fs');
    var http = require('http');

    var hbsPath = "/usr/local/lib/node_modules/homebridge-server/";
    if (config.modulePath) {
        hbsPath = config.modulePath;
    }

    // ... contains a list of installed plugins.
    var installedPlugins = "";

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

    var header, navBar, footer, mainHTML, pluginsHTML;

    function reloadHTML() {
        loadHTML("header.html", function(data) { header = data; });
        loadHTML("navBar.html", function(data) { navBar = data; });
        loadHTML("footer.html", function(data) { footer = data; });
        loadHTML("main.html", function(data) { mainHTML = data; });
        loadHTML("plugins.html", function(data) { pluginsHTML = data; });
    }
    reloadHTML();

    function stripEscapeCodes(chunk) {
        var receivedData = chunk.toString()
            .replace(/\%7E/g, '~')
            .replace(/\%26/g, '&')
            .replace(/\%40/g, '@')
            .replace(/\%23/g, '#')
            .replace(/\%7B/g, '{')
            .replace(/\%0D/g, '')
            .replace(/\%0A/g, '')
            .replace(/\%2C/g, ',')
            .replace(/\%7D/g, '}')
            .replace(/\%3A/g, ':')
            .replace(/\%22/g, '"')
            .replace(/\+/g, ' ')
            .replace(/\+\+/g, '')
            .replace(/\%2F/g, '/')
            .replace(/\%3C/g, '<')
            .replace(/\%3E/g, '>')
            .replace(/\%5B/g, '[')
            .replace(/\%5D/g, ']');
        return receivedData;
    }

    function executeBash(cmd) {
        var exec = require('child_process').exec;
        exec(cmd, function(error, stdout, stderr) {
            log("Executing: " + cmd);
            fs.writeFile(HomebridgeAPI.user.configPath().replace("config.json","exec.out"), stdout, "utf8", function(err, result) {
                if (err) {
                    return log(err);
                }
            });
        });
    }

    function getInstalledPlugins(res) {
        executeBash("npm list -g | grep 'homebridge'");
        fs.readFile(HomebridgeAPI.user.configPath().replace("config.json","exec.out"), "utf8", function(err, result) {
            if (err) {
                return log(err);
            } else {
                installedPlugins = result;
            }
        });
    }

    function printAddPage(res, type, additionalInput) {
        res.write(header + navBar);

        if (additionalInput != null) {
            res.write(additionalInput);
        }

        res.write("<h2>Add " + type + "</h2>");

        res.write("<form enctype='application/x-www-form-urlencoded' action='/save" + type + "Settings' method='post'>")
        res.write("<textarea class='form-control' type='text' name='" + type + "ToAdd' rows='10' placeholder='{ \"" + type + "\": \"test\" }' required></textarea>");
        res.write("<br>");
        res.write("<div class='row'>");
        res.write("<div class='col-xs-offset-1 col-sm-offset-1 col-md-offset-2 col-xs-10 col-sm-9 col-md-8 text-center'>");
        res.write("<div class='btn-group' data-toggle='buttons'>");
        res.write("<input type='submit' class='btn btn-default center-block' value='Save' onClick='submit()' style='width:135px' />");
        res.write("<input type='submit' class='btn btn-default center-block' value='Cancel' onClick=\"location.href='/'\" style='width:135px' />");
        res.write("</div>");
        res.write("</div>");
        res.write("</form>");

        res.write("<br>");
        // res.write("</div>");
        res.end(footer);
    }

    function reloadConfig(res) {
        loadConfig();
        printMainPage(res);
    }

    function saveConfig(res, backup) {
        var newConfig = JSON.stringify(configJSON)
            .replace(/\[,/g, '[')
            .replace(/,null/g, '')
            .replace(/null,/g, '')
            .replace(/null/g, '')
            .replace(/,,/g, ',')
            .replace(/,\]/g, ']');
        newConfig = JSON.stringify(JSON.parse(newConfig), null, 4);
        if (backup != null) {
            fs.writeFile(HomebridgeAPI.user.configPath() + '.bak', newConfig, "utf8", function(err, data) {
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
            case '/api/bridgeInfo.json':
                serverAPI.getBridgeInfo(function (json) {
                    res.write(JSON.stringify(json));
                    res.end();
                });
                break;
            case '/api/installedPlatforms.json':
                serverAPI.getInstalledPlatforms(function (json) {
                    res.write(JSON.stringify(json));
                    res.end();
                });
                break;
            case '/api/accessories.json':
                serverAPI.getInstalledAccessories(function (json) {
                    res.write(JSON.stringify(json));
                    res.end();
                });
                break;
            case '/api/searchPlugins':
                var query = require('url').parse(req.url).query;
                serverAPI.getPluginsFromNPMS(query, function (json) {
                    res.write(JSON.stringify(json));
                    res.end();
                });
                break;
            case '/api/installedPlugins':
                serverAPI.getInstalledPlugins(function (json) {
                    res.write(JSON.stringify(json));
                    res.end();
                })
                break;
            case '/api/saveBridgeConfig':
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
                break;
            case '/api/createConfigBackup':
                serverAPI.createConfigBackup(function (result, error) {
                    res.write(JSON.stringify({'success': result, 'msg': error}));
                    res.end();
                });
                break;
            case '/api/installPlugin':
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
                break;
            case '/api/updatePlugin':
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
                break;
            case '/api/removePlugin':
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
                break;
            case '/api/restartHomebridge':
                serverAPI.restartHomebridge(config, function (json) {
                    res.write(JSON.stringify(json));
                    res.end();
                });
                break;
            default:
                log("unhandled API request: " + req);
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
                printAddPage(res, "Platform");
                break;
            case '/addAccessory':
                printAddPage(res, "Accessory");
                break;
            case '/savePlatformSettings':
                if (req.method == 'POST') {
                    req.on('data', function(chunk) {
                        var receivedData = stripEscapeCodes(chunk).replace('PlatformToAdd=', '');
                        try {
                            if(configJSON.platforms == undefined) {
                              configJSON["platforms"] = [];
                            }
                            configJSON.platforms.push(JSON.parse(receivedData));
                            if (configJSON.platforms.length == 1) {
                                configJSON.platforms = JSON.parse(JSON.stringify(configJSON.platforms).replace('[,', '['));
                            }
                            saveConfig(res);
                            log("Saved platform " + JSON.parse(receivedData).name + ".");
                        } catch (ex) {
                            res.write(header + navBar);
                            res.write("<div class='alert alert-danger alert-dismissible fade in out'><a href='/addPlatform' class='close' data-dismiss='alert'>&times;</a><strong>" + ex + "</strong></div>");
                            printAddPage(res, "Platform", "<code>" + receivedData + "</code>");
                        }
                    });
                    req.on('end', function(chunk) {});
                } else {
                    log("[405] " + req.method + " to " + req.url);
                }
                break;
            case '/saveAccessorySettings':
                if (req.method == 'POST') {
                    req.on('data', function(chunk) {
                        var receivedData = stripEscapeCodes(chunk).replace('AccessoryToAdd=', '');
                        try {
                            if(configJSON.accessories == undefined) {
                              configJSON["accessories"] = [];
                            }
                            console.log(JSON.stringify(configJSON));
                            configJSON.accessories.push(JSON.parse(receivedData));
                            if (configJSON.accessories.length == 1) {
                                configJSON.accessories = JSON.parse(JSON.stringify(configJSON.accessories).replace('[,', '['));
                            }
                            saveConfig(res);
                            log("Saved accessory " + JSON.parse(receivedData).name + ".");
                        } catch (ex) {
                            res.write(header + navBar);
                            res.write("<div class='alert alert-danger alert-dismissible fade in out'><a href='/addAccessory' class='close' data-dismiss='alert'>&times;</a><strong>" + ex + "</strong></div>");
                            printAddPage(res, "Accessory", "<code>" + receivedData + "</code>");
                        }
                    });
                    req.on('end', function(chunk) {});
                } else {
                    log("[405] " + req.method + " to " + req.url);
                }
                break;
            case '/showLog':
                if (config.log == "systemd") {
                      var exec = require('child_process').exec;
                      var cmd = "journalctl --no-pager -u homebridge --since yesterday";
                      exec(cmd, function(error, stdout, stderr) {
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
                fs.readFile(hbsPath + 'content/style.css', 'utf8', function(err, css) {
                    if (err) {
                        return log(err);
                    }
                    res.write(css);
                    res.end();
                });
                break;
            default:
                url = req.url;
                log("unhandled request: " + url);
                if (url.indexOf('/remove') !== -1) {
                    object = url.replace('/remove', '');
                    if (object.indexOf('Platform') !== -1) {
                        platform = object.replace('Platform', '');
                        delete configJSON.platforms[platform];
                        log("Removed platform " + platform + ".");
                    } else if (object.indexOf('Accessory') !== -1) {
                        accessory = object.replace('Accessory', '');
                        delete configJSON.accessories[accessory];
                        log("Removed accessory " + accessory + ".");
                    }
                    saveConfig(res);
                }
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
}

ServerPlatform.prototype.accessories = function(callback) {
    this.accessories = [];
    callback(this.accessories);
}
