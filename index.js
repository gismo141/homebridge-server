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


    var httpAPILib = require(hbsPath + 'api/HttpAPI.js')
    var httpAPI = new httpAPILib.HttpAPI(HomebridgeAPI, hbsPath, log);

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
                httpAPI.bridgeInfo(res);
                break;
            case '/api/installedPlatforms':
                httpAPI.installedPlatforms(res);
                break;
            case '/api/accessories':
                httpAPI.accessories(res);
                break;
            case '/api/searchPlugins':
                httpAPI.searchPlugins(req, res);
                break;
            case '/api/installedPlugins':
                httpAPI.installedPlugins(res);
                break;
            case '/api/saveBridgeConfig':
                httpAPI.saveBridgeConfig(req, res);
                break;
            case '/api/createConfigBackup':
                httpAPI.createConfigBackup(res);
                break;
            case '/api/installPlugin':
                httpAPI.installPlugin(req, res);
                break;
            case '/api/updatePlugin':
                httpAPI.updatePlugin(req, res);
                break;
            case '/api/removePlugin':
                httpAPI.removePlugin(req, res);
                break;
            case '/api/restartHomebridge':
                httpAPI.restartHomebridge(res, config);
                break;
            case '/api/addPlatformConfig':
                httpAPI.addPlatformConfig(req, res);
                break;
            case '/api/addAccessoryConfig':
                httpAPI.addAccessoryConfig(req, res);
                break;
            default:
                log("unhandled API request: " + req);
                res.statusCode = 404;
                res.write(JSON.stringify({error: "The called API doesn't exist."}));
                res.end();
        }
    }



    var AssetManagerLib = require(hbsPath + 'api/AssetManager.js');
    var Assets = new AssetManagerLib.AssetManager(hbsPath, log);

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
}

ServerPlatform.prototype.accessories = function(callback) {
    this.accessories = [];
    callback(this.accessories);
}
