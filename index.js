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

    // Get the config.json ...
    var configJSON = require(HomebridgeAPI.user.configPath());
    // ... extract the platforms JSON-object and instantiate string value ...
    var platformsJSON = {};
    var platforms = "";
    // ... extract the accessories JSON-object and instantiate string value...
    var accessoriesJSON = {};
    var accessories = "";
    // ... contains a list of installed plugins.
    var installedPlugins = "";

    // Prepare cosmetics for the site
    // - CSS with Twitter bootstrap
    // - fontface with Apple-like Open Sans
    // - general header with responsive design
    // - JS with Twitter bootstrap
    var bootstrap = "<link rel='stylesheet' href='//maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css'>"
        //+ "<link href='//cdnjs.cloudflare.com/ajax/libs/x-editable/1.5.0/bootstrap3-editable/css/bootstrap-editable.css' rel='stylesheet'/>"
    ;
    var font = "<link href='https://fonts.googleapis.com/css?family=Open+Sans:300,600' rel='stylesheet' type='text/css'>";
    var tablestyle = "<style>" +
      ".responsive-wrapper { margin-bottom: 15px; }" +
      ".responsive-wrapper .row { display: flex; width: 100%; justify-content: space-between; padding: 1em 0.1em; margin: 0; }" +
      ".responsive-wrapper .row.content:hover { background-color: #e6e6e6; }" +
      ".row.header { border-bottom: 2px solid #ddd; }" +
      ".row.header div { font-weight: 600; font-size: 16px; }" +
      ".row.content { border: 1px solid hsla(0, 0%, 90%, 1); border-top: none; -webkit-transition: all 0.1s cubic-bezier(1, 0, 0.5, 1); transition: all 0.1s cubic-bezier(1, 0, 0.5, 1); }" +
      ".responsive-wrapper .row div { flex: none; overflow: none; }" +
      ".responsive-wrapper .row div:nth-child(1) { width: 10%; }" +
      ".responsive-wrapper .row div:nth-child(2) { width: 10%; }" +
      ".responsive-wrapper .row div:nth-child(3) { width: 60%; overflow: auto; }" +
      ".responsive-wrapper .row div:nth-child(4) { width: 10%; }" +
      ".responsive-wrapper .row.plugins { padding: 1em; }" +
      ".responsive-wrapper .row.plugins div:nth-child(1) { width: 15%; }" +
      ".responsive-wrapper .row.plugins div:nth-child(2) { width: 15%; }" +
      ".responsive-wrapper .row.plugins div:nth-child(3) { width: 50%; overflow: auto; }" +
      ".responsive-wrapper .row.plugins div:nth-child(4) { width: 20%; }" +
      ".responsive-wrapper .row div.action a.btn { font-weight: 600; font-size: 18px; margin: 0 5px; letter-spacing: 0.05em; -webkit-font-smoothing: antialiased; line-height: 1.1em !important; }" +
      "@media screen and (max-width: 720px) {" +
      "h2 { margin-top: 50px; }" +
      ".responsive-wrapper .row { display: block; padding: 30px 20px; margin-bottom: 10px; }" +
      ".responsive-wrapper .row.content { border-top: 1px solid hsla(0, 0%, 90%, 1); }" +
      ".responsive-wrapper .row.header { display: none; }" +
      ".responsive-wrapper .row div:before { margin-bottom: 0.25em; }" +
      ".responsive-wrapper .row div:nth-child(1) { margin-right: 1em; width: 100%; }" +
      ".responsive-wrapper .row div:nth-child(1):before { content: 'Type: '; display: inline-block; min-width: 15%; margin-right: 10px; font-weight: 600; }" +
      ".responsive-wrapper .row div:nth-child(2) { margin-right: 1em; width: 100%; }" +
      ".responsive-wrapper .row div:nth-child(2):before { content: 'Name: '; display: inline-block; min-width: 15%; margin-right: 10px; font-weight: 600; }" +
      ".responsive-wrapper .row div:nth-child(3) { margin-right: 1em; width: 100%; }" +
      ".responsive-wrapper .row div:nth-child(3):before { content: 'Info: '; display: inline-block; min-width: 15%; margin-right: 10px; font-weight: 600; }" +
      ".responsive-wrapper .row div:nth-child(4) { margin-right: 1em; width: 100%; }" +
      ".responsive-wrapper .row.plugins div:nth-child(1) { width: 100%; }" +
      ".responsive-wrapper .row.plugins div:nth-child(2) { width: 100%; }" +
      ".responsive-wrapper .row.plugins div:nth-child(3) { width: 100%; overflow: auto; }" +
      ".responsive-wrapper .row.plugins div:nth-child(4) { width: 100%; margin: 20px auto; }" +
      "}" +
      "</style>";
    var style = "<style>h1, h2, h3, h4, h5, h6 {font-family: 'Open Sans', sans-serif;}p, div {font-family: 'Open Sans', sans-serif;} input[type='radio'], input[type='checkbox'] {line-height: normal; margin: 0;}</style>"
    var header = "<html><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'><head><title>Homebridge - Configuration</title>" + bootstrap + font + style + tablestyle + "</head><body style='padding-top: 70px;'>";
    var footer = "</body>"
        //+ "<script src='//cdnjs.cloudflare.com/ajax/libs/x-editable/1.5.0/bootstrap3-editable/js/bootstrap-editable.min.js'></script>"
        //+ "<script> $(document).ready(function() { $.fn.editable.defaults.mode = 'popup';  $('#username').editable(); }); </script>"
        //+ "<script defer='defer' src='//code.jquery.com/jquery-ui-latest.min.js'></script>"
        + "<script defer='defer' src='//code.jquery.com/jquery-latest.min.js' type='text/javascript'></script>"
        + "<script defer='defer' src='//maxcdn.bootstrapcdn.com/bootstrap/latest/js/bootstrap.min.js' type='text/javascript'></script>" +
        "</html>";
    var navBar = (function() {/*
      <nav class="navbar navbar-default navbar-fixed-top">
      <div class="container-fluid">
      <div class="navbar-header">
      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
      <span class="sr-only">Toggle navigation</span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      </button>
      <a class="navbar-brand" href="/">Homebridge - Configuration</a>
      </div>
      <div id="navbar" class="navbar-collapse collapse">
      <ul class="nav navbar-nav navbar-right">
      <li><a href="/createBackup">Backup</a></li>
      <li><a href="/showLog">Log</a></li>
      <li><a href="/listInstallablePlugins">Plugins</a></li>
      <li><a href="/restart">Restart</a></li>
      </ul>
      </div>
      </div>
      </nav>
      */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    var table1 = (function() {/*
      <div class="responsive-wrapper">
      <div class="row header">
      <div>Type</div>
      <div>Name</div>
      <div>Info</div>
      <div></div>
      </div>
      */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    // This closes the html-markup as string for the presented tables
    var table2 = (function() {/*
      </div>
      */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    // Prepares the html-markup for the bridge parameters as forms
    var bridgeName;
    var bridgeUsername;
    var bridgePin;

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

    var http = require("http");
    var https = require("https");

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

    /**
     * getJSON:  REST get request returning JSON object(s)
     * @param options: http options object
     * @param callback: callback to pass the results JSON object(s) back
     */
    function getJSON(options, onResult) {
        var prot = options.port == 443 ? https : http;
        var req = prot.request(options, function(res) {
            var output = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                output += chunk;
            });
            res.on('end', function() {
                var obj = JSON.parse(output);
                onResult(res.statusCode, obj);
            });
        });
        req.on('error', function(err) {
            log('error: ' + err.message);
        });
        req.end();
    };

    function getPluginsFromNPMS(res, search) {
        var options = {
            host: 'api.npms.io',
            port: 443,
            path: '/v2/search?q=' + (!search || 0 === search.length ? '' : search + '+') + 'keywords:homebridge-plugin+not:deprecated+not:insecure&size=250',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        getJSON(options, function(statusCode, result) {
            printPluginPage(res, result);
        });
    }

    function prepareConfig() {
        bridgeName = "<div class='form-group'><label for='homebridgename'>Name:</label><input type='text' class='form-control' name='bridgeName' value='" + configJSON.bridge.name + "'></div>";
        bridgeUsername = "<div class='form-group'><label for='username'>Username:</label><input type='text' class='form-control' name='bridgeUsername' value='" + configJSON.bridge.username + "'></div>";
        bridgePin = "<div class='form-group'><label for='pin'>Pin:</label><input type='text' class='form-control' name='bridgePin' value='" + configJSON.bridge.pin + "'></div>";

        platformsJSON = configJSON.platforms != undefined ? configJSON.platforms : {};
        platforms = "";
        accessoriesJSON = configJSON.accessories != undefined ? configJSON.accessories : {};
        accessories = "";

        const wastebasket = "&#128465";
        const pen = "&#9997";
        var symbolToPresent = wastebasket;

        for (var id_platform in platformsJSON) {
            var platformNoTypeNoName = JSON.parse(JSON.stringify(platformsJSON[id_platform]));
            delete platformNoTypeNoName.platform;
            delete platformNoTypeNoName.name;
            var platform = platformsJSON[id_platform];
            platforms = platforms +
                "<div class='row content'>" +
                "<div>" + platform.platform + "</div>" +
                "<div>" + platform.name + "</div>" +
                "<div><pre>" + (JSON.stringify(platformNoTypeNoName, null, ' ')) + "</pre></div>" +
                "<div><a href='/removePlatform" + id_platform + "' class='btn btn-default center-block' style='outline:none !important;'><span style='font-size:25px;'>" + symbolToPresent + ";</span></a></div>" +
                "</div>";
        }

        for (var id_accessory in accessoriesJSON) {
            var accessoryNoTypeNoName = JSON.parse(JSON.stringify(accessoriesJSON[id_accessory]));
            delete accessoryNoTypeNoName.accessory;
            delete accessoryNoTypeNoName.name;
            var accessory = accessoriesJSON[id_accessory];
            accessories = accessories +
                "<div class='row content'>" +
                "<div>" + accessory.accessory + "</div>" +
                "<div>" + accessory.name + "</div>" +
                "<div><pre>" + (JSON.stringify(accessoryNoTypeNoName, null, ' ')) + "</pre></div>" +
                "<div><a href='/removeAccessory" + id_accessory + "' class='btn btn-default center-block' style='outline:none !important;'><span style='font-size:25px;'>" + symbolToPresent + ";</span></a></div>" +
                "</div>";
        }
    }

    function printPluginPage(res, result) {
        res.write(header + navBar);
        res.write("<div class='container'>");
        res.write("<h2>Plugins</h2>");
        res.write("<form enctype='application/x-www-form-urlencoded' action='/listInstallablePlugins' method='post'>");
        res.write("<div class='input-group'><input type='text' class='form-control' name='searchQuery' placeholder='search' /><br>");
        res.write("<span class='input-group-btn'><input type='submit' class='btn btn-default center-block' value='Filter' style='width:135px' /></span>");
        res.write("</div></form>");

        var plugins = "";
        result.results.forEach(function(e) {
            plugins = plugins +
                "<div class='row content plugins'>" +
                "<div>" + "<a href='" + e.package.links.npm + "'>" + e.package.name + "</a></div>" +
                "<div>" + e.package.publisher.username + "</div>" +
                "<div>" + e.package.description + "</div>";
            if (installedPlugins.indexOf(e.package.name) > -1) {
                plugins += "<div class='action'><a href='/uninstallPlugin=" + e.package.name + "' class='btn btn-danger center-block' style='height: 34px; line-height: 16px; vertical-align:middle;outline:none !important;'>" + "Uninstall</a></div>";
            } else {
                plugins += "<div class='action'><a href='/installPlugin=" + e.package.name + "' class='btn btn-success center-block' style='height: 34px; line-height: 16px; vertical-align:middle;outline:none !important;'>" + "Install v" + e.package.version + "</a></div>";
            }
            plugins += "</div>";
        });
        res.write(table1 + plugins + table2);
        res.write("</div>");
        res.end(footer);
    }

    function printAddPage(res, type, additionalInput) {
        res.write(header + navBar);
        res.write("<div class='container'>");

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
        res.write("</div>");
        res.end(footer);
    }

    function printMainPage(res) {
        res.write(header + navBar);
        res.write("<div class='container'>");
        res.write("<form enctype='application/x-www-form-urlencoded' action='/saveBridgeSettings' method='post'>")
        res.write(bridgeName + bridgeUsername + bridgePin);
        res.write("<input type='submit' class='btn btn-default center-block' style='width:135px' value='Save' />");
        res.write("</form>");

        res.write("<h2>Platforms</h2>");
        if (0 < Object.keys(platformsJSON).length) {
            res.write(table1 + platforms + table2);
        } else {
            res.write("No platforms installed or configured!");
        }
        res.write("<a href='/addPlatform' name='AddPlatform' class='btn btn-default center-block' style='width:135px'>Add</a><br>");

        res.write("<h2>Accessories</h2>");
        if (0 < Object.keys(accessoriesJSON).length) {
            res.write(table1 + accessories + table2);
        } else {
            res.write("No accessories installed or configured!");
        }
        res.write("<a href='/addAccessory' name='AddAccessory' class='btn btn-default center-block' style='width:135px'>Add</a><br>");

        res.write("</div>");
        res.end(footer);
    }

    function reloadConfig(res) {
        configJSON = require(HomebridgeAPI.user.configPath());
        prepareConfig();
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
        switch (req.url) {
            case '/':
                prepareConfig();
                printMainPage(res);
                break;
            case '/listInstallablePlugins':
                if (req.method == 'POST') {
                    req.on('data', function(chunk) {
                        var receivedData = stripEscapeCodes(chunk).replace('searchQuery=', '');
                        try {
                            getInstalledPlugins(res);
                            getPluginsFromNPMS(res, receivedData);
                        } catch (ex) {
                            log(ex);
                        }
                    });
                    req.on('end', function(chunk) {});
                } else {
                    getInstalledPlugins(res);
                    getPluginsFromNPMS(res);
                }
                break;
            case '/saveBridgeSettings':
                if (req.method == 'POST') {
                    req.on('data', function(chunk) {
                        var receivedData = chunk.toString();
                        log("received body data: " + receivedData);
                        var arr = receivedData.split("&");
                        configJSON.bridge.name = stripEscapeCodes(arr[0].replace('bridgeName=', ''));
                        configJSON.bridge.username = arr[1].replace('bridgeUsername=', '').replace(/\%3A/g, ':');
                        configJSON.bridge.pin = arr[2].replace('bridgePin=', '');
                        saveConfig(res);
                        log("Saved bridge settings.");
                    });
                    req.on('end', function(chunk) {});
                } else {
                    log("[405] " + req.method + " to " + req.url);
                }
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
            case '/createBackup':
                saveConfig(res, true);
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
            case '/restart':
                executeBash(config.restart != undefined ? config.restart : "echo 'No command specified!'");
                break;
            default:
                url = req.url;
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
                } else if (url.indexOf('/installPlugin=') !== -1) {
                    executeBash("sudo npm install -g " + url.replace('/installPlugin=', ''));
                    getInstalledPlugins(res);
                    getPluginsFromNPMS(res);
                    break;
                } else if (url.indexOf('/uninstallPlugin=') !== -1) {
                    executeBash("sudo npm uninstall -g " + url.replace('/uninstallPlugin=', ''));
                    getInstalledPlugins(res);
                    getPluginsFromNPMS(res);
                    break;
                }
        };
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
