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
    var path = require('path');

    var globalNPMDir = require('global-modules');
    var hbsPath = path.resolve(globalNPMDir, "homebridge-server");
    if (config.modulePath) {
        hbsPath = path.normalize(config.modulePath);
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


    var httpAPILib = require(path.resolve(hbsPath, 'api', 'HttpAPI.js'));
    var infoOptions = {
        "updateFrequency" : 10000,
        "updateCheckFrequency" : 3600000
    }
    var httpAPI = new httpAPILib.HttpAPI(HomebridgeAPI, hbsPath, log, infoOptions, config);

    /**
     * [handleAPIRequest description]
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     * @return {[type]}     [description]
     */
    function handleAPIRequest(req, res) {
        log("handleAPIRequest: " + req.url);
        var path = require('url').parse(req.url).pathname;
        switch (path) {
            case '/api/bridgeInfo':
                httpAPI.bridgeInfo(res);
                break;
            case '/api/bridgeConfig':
                httpAPI.bridgeConfig(res);
                break;
            case '/api/installedPlatforms':
                httpAPI.installedPlatforms(res);
                break;
            case '/api/accessories':
                httpAPI.accessories(res);
                break;
            case '/api/removePlatform':
                httpAPI.removePlatformConfig(req, res);
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
            case '/api/logFileContent':
                httpAPI.logFileContent(req, res);
                break;
            case '/api/subscribeToLogFileTail':
                httpAPI.subscribeToLogFileTail(res);
                break;
            case '/api/unsubscribeFromLogFileTail':
                httpAPI.unsubscribeFromLogFileTail(req, res);
                break;
            case '/api/logFileTail':
                httpAPI.logFileTail(req, res);
                break;
            default:
                log("unhandled API request: " + req);
                res.statusCode = 404;
                res.end();
        }
    }



    var AssetManagerLib = require(path.resolve(hbsPath, 'api', 'AssetManager.js'));
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
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.mainHTML + Assets.footerHTML);
                break;
            case '/listInstallablePlugins':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.pluginsHTML + Assets.footerHTML);
                break;
            case '/addPlatform':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.addPlatformHTML + Assets.footerHTML);
                break;
            case '/addAccessory':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.addAccessoryHTML + Assets.footerHTML);
                break;
            case '/showLog':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.showLogHTML + Assets.footerHTML);
                break;
            case '/style.css':
                log("serving style.css");
                res.setHeader("Content-Type", "text/css");
                res.end(Assets.styleCSS);
                break;
            case '/js/global.js':
                log("serving /js/global.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.globalJS);
                break;
            case '/js/main.js':
                log("serving /js/main.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.mainJS);
                break;
            case '/js/plugins.js':
                log("serving /js/plugins.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.pluginsJS);
                break;
            case '/js/showLog.js':
                log("serving /js/showLog.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.showLogJS);
                break;
            case '/js/addAccessory.js':
                log("serving /js/addAccessory.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.addAccessoryJS);
                break;
            case '/js/addPlatform.js':
                log("serving /js/addPlatform.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.addAccessoryJS);
                break;
            case '/js/footer.js':
                log("serving /js/footer.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.footerJS);
                break;
            default:
                log("unhandled request: " + req.url);
                res.statusCode = 404;
                res.end();
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
