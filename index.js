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

    var configJSON = require(process.argv[process.argv.indexOf('-U') + 1] + '/config.json');
    var platformsJSON = configJSON.platforms;
    var platforms = "";
    var accessoriesJSON = configJSON.accessories;
    var accessories = "";

    var bootstrap = "<link rel='stylesheet' href='//maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css'>";
    var font = "<link href='https://fonts.googleapis.com/css?family=Open+Sans:300' rel='stylesheet' type='text/css'>";
    var style = "<style>h1, h2, h3, h4, h5, h6 {font-family: 'Open Sans', sans-serif;}p, div {font-family: 'Open Sans', sans-serif;} input[type='radio'], input[type='checkbox'] {line-height: normal; margin: 0;}</style>"
    var header = "<html><meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'><head><title>Homebridge - Configuration</title>" + bootstrap + font + style + "</head>"; 
    var footer = "<script defer='defer' src='//maxcdn.bootstrapcdn.com/bootstrap/latest/js/bootstrap.min.js'></script></body></html>";

    var table1 =  (function () {/* 
    <div class="table-responsive"> 
      <table class="table table-hover">
        <thead>
          <tr>
            <th></th>
            <th>Type</th>
            <th>Name</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
    */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    var table2 =  (function () {/*  
        </tbody>
      </table>
    </div>
    */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

    for(var platform in platformsJSON){
        platforms = platforms + "<tr><td><div class='checkbox'><label><input type='checkbox' value=''></label></div></td><td>";
	platforms = platforms + platformsJSON[platform].platform + "</td><td>";
	platforms = platforms + platformsJSON[platform].name + "</td><td>";
        var tempArray = [];
        for(var element_accessory in accessory){
          tempArray.push(element_accessory);
          tempArray.push(accessory[element_accessory] + '<br>');
        }
        tempArray.splice(tempArray.indexOf('name'), 2);
        tempArray.splice(tempArray.indexOf('accessory'), 2);
        platforms = platforms + tempArray + "</td></tr>";
    }

    for(var id_accessory in accessoriesJSON){
        var accessory = accessoriesJSON[id_accessory];
        accessories = accessories + "<tr><td><div class='checkbox'><label><input type='checkbox' value=''></label></div></td><td>";
        accessories = accessories + accessory.accessory + "</td><td>";
        accessories = accessories + accessory.name + "</td><td>";
        var tempArray = [];
        for(var element_accessory in accessory){
          tempArray.push(element_accessory);
          tempArray.push(accessory[element_accessory] + '<br>');
        }
        tempArray.splice(tempArray.indexOf('name'), 2);
        tempArray.splice(tempArray.indexOf('accessory'), 2);
        accessories = accessories + tempArray + "</td></tr>";
    }

    var bridgeName = "<div class='form-group'><label for='homebridgename'>Name:</label><input type='text' class='form-control' id='homebridgename' value='" + configJSON.bridge.name + "'></div>";
    var bridgeUsername = "<div class='form-group'><label for='username'>Username:</label><input type='text' class='form-control' id='username' value='" + configJSON.bridge.username + "'></div>";
    var bridgePin = "<div class='form-group'><label for='pin'>Pin:</label><input type='text' class='form-control' id='pin' value='" + configJSON.bridge.pin + "'></div>";

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

      response.write("<div class='block-center'>");
      response.write("<div class='btn-group'>");
      response.write("<input id='add' name='add' type='submit' class='btn btn-default' value='Add Accessory'>");
      response.write("<input id='Remove' name='Remove' type='submit' class='btn btn-default' value='Remove Accessory' width='87px !important'>");
      response.write("</div>");
      response.write("</div>");

      response.write("</div>");
      response.write(footer);
      response.end();
    });

    server.listen(8765);
    console.log("Server is listening");
}
Server.prototype.accessories = function(callback) {
    var self = this;
    self.accessories = [];
    callback(self.accessories);
}
