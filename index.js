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
    var http = require("http");

    // Get the config.json from parents process ...
    var configJSON = require(process.argv[process.argv.indexOf('-U') + 1] + '/config.json');
    // ... extract the platforms JSON-object and instantiate string value ...
    var platformsJSON = configJSON.platforms;
    var platforms = "";
    // ... extract the accessories JSON-object and instantiate string value...
    var accessoriesJSON = configJSON.accessories;
    var accessories = "";

    // Get the log-file

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
    var table1 =  (function () {/* 
    <div class="table-responsive"> 
      <table class="table table-hover">
        <thead>
          <tr>
            <th width='10%'></th>
            <th width='20%'>Type</th>
            <th width='20%'>Name</th>
            <th width='50%'>Info</th>
          </tr>
        </thead>
        <tbody>
    */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    // This closes the html-markup as string for the presented tables
    var table2 =  (function () {/*  
        </tbody>
      </table>
    </div>
    */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    // Prepare the platforms for html-markup
    // - introduces html-table-cell
    // - adds the info from platform JSON-object
    // - strips the JSON-identifiers
    // - adds a checkbox as first table-cell to enable row-selection
    for(var id_platform in platformsJSON){
        var platform = platformsJSON[id_platform];
        platforms = platforms + "<tr><td style='vertical-align:middle;'><div class='checkbox'><label><input type='checkbox' value=''></label></div></td><td style='vertical-align:middle;'>";
	platforms = platforms + platform.platform + "</td><td style='vertical-align:middle;'>";
	platforms = platforms + platform.name + "</td><td style='vertical-align:middle;'>";
        // FIXME
        var tempArray = [];
        for(var element_platform in platform){
          tempArray.push(element_platform);
          tempArray.push(platform[element_platform] + '<br>');
        }
        tempArray.splice(tempArray.indexOf('name'), 2);
        tempArray.splice(tempArray.indexOf('platform'), 2);
        platforms = platforms + tempArray + "</td></tr>";
    }
    
    // Prepare the accessories for html-markup
    // - introduces html-table-cell
    // - adds the info from platform JSON-object
    // - strips the JSON-identifiers
    // - adds a checkbox as first table-cell to enable row-selection
    for(var id_accessory in accessoriesJSON){
        var accessory = accessoriesJSON[id_accessory];
        accessories = accessories + "<tr><td style='vertical-align:middle;'><div class='checkbox'><label><input type='checkbox' value=''></label></div></td><td style='vertical-align:middle;'>";
        accessories = accessories + accessory.accessory + "</td><td style='vertical-align:middle;'>";
        accessories = accessories + accessory.name + "</td><td style='vertical-align:middle;'>";
	// FIXME
        var tempArray = [];
        for(var element_accessory in accessory){
          tempArray.push(element_accessory);
          tempArray.push(accessory[element_accessory] + '<br>');
        }
        tempArray.splice(tempArray.indexOf('name'), 2);
        tempArray.splice(tempArray.indexOf('accessory'), 2);
        accessories = accessories + tempArray + "</td></tr>";
    }

    // Prepares the html-markup for the bridge parameters as forms
    var bridgeName = "<div class='form-group'><label for='homebridgename'>Name:</label><input type='text' class='form-control' id='homebridgename' value='" + configJSON.bridge.name + "'></div>";
    var bridgeUsername = "<div class='form-group'><label for='username'>Username:</label><input type='text' class='form-control' id='username' value='" + configJSON.bridge.username + "'></div>";
    var bridgePin = "<div class='form-group'><label for='pin'>Pin:</label><input type='text' class='form-control' id='pin' value='" + configJSON.bridge.pin + "'></div>";

    // Launches the webserver and transmits the website by concatenating the precreated markup
    var server = http.createServer(function(request, response) {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.write(header);
      response.write("<div class='container'>");
      response.write("<body><h1>Homebridge</h1>");

      response.write("<h2>Configuration</h2>");
      response.write(bridgeName + bridgeUsername + bridgePin);

      response.write("<h2>Platforms</h2>");
      if(JSON.stringify(platformsJSON) != "[]") {
        response.write(table1 + platforms + table2);
      } else {
        response.write("No platforms installed or configured!");
      }

      response.write("<h2>Accessories</h2>");
      if(JSON.stringify(accessoriesJSON) != "[]") {
        response.write(table1 + accessories + table2);
      } else {
        response.write("No accessories installed or configured!");
      }

      response.write("<div class='row'>");
      response.write("<div class='col-xs-offset-1 col-sm-offset-1 col-md-offset-2 col-xs-10 col-sm-9 col-md-8 text-center'>");
      response.write("<div class='btn-group' data-toggle='buttons'>");
      response.write("<input id='Add' name='Add' type='submit' class='btn btn-default center-block' value='Add Accessory' style='width:135px'>");
      response.write("<input id='Remove' name='Remove' type='submit' class='btn btn-default center-block' value='Remove Accessory' style='width:135px'>");
      response.write("</div>");
      response.write("</div>");
      response.write("</div>");

      response.write("<br>");

      response.write("</div>");
      response.write(footer);
      response.end();
    });

    server.listen(self.config.port);
    console.log("Homebridge-Server is listening on port " + self.config.port);
}
Server.prototype.accessories = function(callback) {
    var self = this;
    self.accessories = [];
    callback(self.accessories);
}
