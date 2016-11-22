
var Service, Characteristic, LastUpdate;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerPlatform("homebridge-server", "Server", Server);
}

function Server(log, config) {
    var self = this;
    self.config = config;
    self.log = log;
    var fs = require('fs');
    var http = require('http');

    // ... extract the platforms JSON-object and instantiate string value ...
    var platformsJSON = "";
    var platforms = "";
    // ... extract the accessories JSON-object and instantiate string value...
    var accessoriesJSON = "";
    var accessories = "";

    // Prepare cosmetics for the site
    // - CSS with Twitter bootstrap
    // - fontface with Apple-like Open Sans
    // - general header with responsive design
    // - JS with Twitter bootstrap
    var bootstrap = "<link rel='stylesheet' href='//maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css'>";
    var font = "<link href='https://fonts.googleapis.com/css?family=Open+Sans:300' rel='stylesheet' type='text/css'>";
    var style = "<style>h1, h2, h3, h4, h5, h6 {font-family: 'Open Sans', sans-serif;}p, div {font-family: 'Open Sans', sans-serif;} input[type='radio'], input[type='checkbox'] {line-height: normal; margin: 0;}</style>"
    var header = "<html><meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'><head><title>Homebridge - Configuration</title>" + bootstrap + font + style + "</head>";
    var footer = "<script defer='defer' src='//maxcdn.bootstrapcdn.com/bootstrap/latest/js/bootstrap.min.js'></script></body></html>";

    // Prepare the html-markup as string for the presented tables
    // - tables are responsive and glow when hovered
    // - present Type, Name and additional Info
    // - content is added later by concatenating table1 + 'content' + table2
    var table1 = (function() {/* 
            <div class="table-responsive"> 
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th width='10%'>Type</th>
                    <th width='40%'>Name</th>
                    <th width='40%'>Info</th>
                    <th width='10%'></th>
                  </tr>
                </thead>
                <tbody>
    */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    // This closes the html-markup as string for the presented tables
    var table2 = (function() {/*  
                </tbody>
              </table>
            </div>
    */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    // Prepares the html-markup for the bridge parameters as forms
    var bridgeName;
    var bridgeUsername;
    var bridgePin;

    // Get the config.json from parents process ...
    var configJSON = require(process.argv[process.argv.indexOf('-U') + 1] + '/config.json');

    // Launches the webserver and transmits the website by concatenating the precreated markup
    var server = http.createServer(handleRequest);

    //We need a function which handles requests and send response
    function handleRequest(req, res) {
        switch (req.url) {
            case '/':
                prepareConfig();
                printMainPage(res);
                break;
            case '/saveBridgeSettings':
                if (req.method == 'POST') {

                    req.on('data', function(chunk) {
                        receivedData = chunk.toString();
                        console.log("[Homebridge-Server] received body data: " + receivedData);
                        var arr = receivedData.split("&");
                        configJSON.bridge.name = arr[0].replace('bridgeName=','');
                        configJSON.bridge.username = arr[1].replace('bridgeUsername=','').replace(/\%3A/g,':');
                        configJSON.bridge.pin = arr[2].replace('bridgePin=','');
                        saveConfig(res);
                        console.log("[Homebridge-Server] Saved bridge settings.");
                    });
                    req.on('end', function(chunk) { });

                } else {
                    console.log("[Homebridge-Server] [405] " + req.method + " to " + req.url);
                }

                break;
            case '/addPlatform':
                printAddPlatformPage(res);
                break;
            case '/addAccessory':
                printAddAccessoryPage(res);
                break;
            case '/savePlatformSettings':
                break;
            case '/saveAccessorySettings':
                break;
            default:
                url = req.url;
                if (url.indexOf('/remove') !== -1) {
                    object = url.replace('/remove', '');
                    if (object.indexOf('Platform') !== -1) {
                        platform = object.replace('Platform', '');
                        delete configJSON.platforms[platform];
                        platformsJSON = configJSON.platforms;
                    } else if (object.indexOf('Accessory') !== -1) {
                        accessory = object.replace('Accessory', '');
                        delete configJSON.accessories[accessory];
                        accessoriesJSON = configJSON.accessories;
                    }
                    saveConfig(res);
                    console.log("[Homebridge-Server] Saved platform and accessory settings.");
                }
        };
    }

    function prepareConfig() {
        // Prepare the platforms for html-markup
        // - introduces html-table-cell
        // - adds the info from platform JSON-object
        // - strips the JSON-identifiers
        // - adds a checkbox as first table-cell to enable row-selection
        platformsJSON = configJSON.platforms;
        platforms = "";
        for (var id_platform in platformsJSON) {
            var platform = platformsJSON[id_platform];
            platforms = platforms + "<tr><td style='vertical-align:middle;'>";
            platforms = platforms + platform.platform + "</td><td style='vertical-align:middle;'>";
            platforms = platforms + platform.name + "</td><td style='vertical-align:middle;'>";
            // FIXME
            var tempArray = [];
            for (var element_platform in platform) {
                tempArray.push(element_platform);
                tempArray.push(platform[element_platform] + '<br>');
            }
            tempArray.splice(tempArray.indexOf('name'), 2);
            tempArray.splice(tempArray.indexOf('platform'), 2);
            platforms = platforms + tempArray + "</td>";
            platforms = platforms + "</td><td style='vertical-align:middle;'><a href='/removePlatform" + id_platform + "' class='btn btn-default center-block' style='width:30px'>-</a>" + "</td><td style='vertical-align:middle;'></td></tr>";
        }

        // Prepare the accessories for html-markup
        // - introduces html-table-cell
        // - adds the info from platform JSON-object
        // - strips the JSON-identifiers
        // - adds a checkbox as first table-cell to enable row-selection
        accessoriesJSON = configJSON.accessories;
        accessories = "";
        for (var id_accessory in accessoriesJSON) {
            var accessory = accessoriesJSON[id_accessory];
            accessories = accessories + "<tr><td style='vertical-align:middle;'>";
            accessories = accessories + accessory.accessory + "</td><td style='vertical-align:middle;'>";
            accessories = accessories + accessory.name + "</td><td style='vertical-align:middle;'>";
            // FIXME
            var tempArray = [];
            for (var element_accessory in accessory) {
                tempArray.push(element_accessory);
                tempArray.push(accessory[element_accessory] + '<br>');
            }
            tempArray.splice(tempArray.indexOf('name'), 2);
            tempArray.splice(tempArray.indexOf('accessory'), 2);
            accessories = accessories + tempArray + "</td>";
            accessories = accessories + "</td><td style='vertical-align:middle;'><a href='/removePlatform" + id_accessory + "' class='btn btn-default center-block' style='width:135px'>Remove</a>" + "</td><td style='vertical-align:middle;'></td></tr>";
        }

        // Prepares the html-markup for the bridge parameters as forms
        bridgeName = "<div class='form-group'><label for='homebridgename'>Name:</label><input type='text' class='form-control' name='bridgeName' value='" + configJSON.bridge.name + "'></div>";
        bridgeUsername = "<div class='form-group'><label for='username'>Username:</label><input type='text' class='form-control' name='bridgeUsername' value='" + configJSON.bridge.username + "'></div>";
        bridgePin = "<div class='form-group'><label for='pin'>Pin:</label><input type='text' class='form-control' name='bridgePin' value='" + configJSON.bridge.pin + "'></div>";
    }

    function saveConfig(res) {
        var newConfig = JSON.stringify(configJSON)
        newConfig = newConfig.replace(',null', '');
        newConfig = newConfig.replace('null,', '');
        newConfig = newConfig.replace('null', '');
        fs.writeFile(process.argv[process.argv.indexOf('-U') + 1] + '/config.json', newConfig, "utf8", savedConfig(res));
    }

    function savedConfig(res) {
      res.write(header);
      res.write("<div class='alert alert-danger alert-dismissible fade in out' style='position: absolute; top: 20px; right: 20px;'><a href='/' class='close' data-dismiss='alert'>&times;</a><strong>Note!</strong> Please restart Homebridge to activate your changes.</div>");
      prepareConfig();
      printMainPage(res);
    }

    function printAddPlatformPage(res) {
        res.write(header);
        res.write("<div class='container'>");
        res.write("<body><h2>Add Platform</h2>");

        res.write("<form enctype='application/x-www-form-urlencoded' action='/savePlatformSettings' method='post'>")
        res.write("<input type='submit' class='btn btn-default center-block' style='width:135px' value='Add' />");
        res.write("</form>");

        res.write("<br>");
        res.write("</div>");
        res.end(footer);
    }

    function printAddAccessoryPage(res) {
        res.write(header);
        res.write("<div class='container'>");
        res.write("<body><h2>Add Accessory</h2>");

        res.write("<form enctype='application/x-www-form-urlencoded' action='/saveAccessorySettings' method='post'>")
        res.write("<input type='submit' class='btn btn-default center-block' style='width:135px' value='Add' />");
        res.write("</form>");

        res.write("<br>");
        res.write("</div>");
        res.end(footer);
    }

    function printMainPage(res) {
        res.write(header);
        res.write("<div class='container'>");
        res.write("<body><h1>Homebridge</h1>");

        res.write("<h2>Configuration</h2>");
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
        res.write("<br><a href='/addPlatform' id='Add' name='AddPlatform' class='btn btn-default center-block' style='width:135px'>New Platform</a><br>");

        res.write("<h2>Accessories</h2>");
        if (0 < Object.keys(accessoriesJSON).length) {
            res.write(table1 + accessories + table2);
        } else {
            res.write("No accessories installed or configured!");
        }
        res.write("<br><a href='/addAccessory' id='Add' name='AddAccessory' class='btn btn-default center-block' style='width:135px'>New Accessory</a><br>");

        res.write("<br>");
        res.write("</div>");
        res.end(footer);
    }

    //Lets start our server
    server.listen(self.config.port, function() {
        //Callback triggered when server is successfully listening. Hurray!
        require('dns').lookup(require('os').hostname(), function(err, add, fam) {
            console.log("[Homebridge-Server] is listening on: http://%s:%s", add, self.config.port);
        })
    });
}

Server.prototype.accessories = function(callback) {
    var self = this;
    self.accessories = [];
    callback(self.accessories);
}