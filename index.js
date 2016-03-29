var http = require('http');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  console.log("homebridge API version: " + homebridge.version);

  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  
  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerPlatform("homebridge-server", "Server", Server, true);
}

// Platform constructor
// config may be null
// api may be null if launched from old homebridge version
function Server(log, config, api) {
  console.log("Server Init");
  this.log = log;
  this.config = config;
  this.accessories = [];

  this.requestServer = http.createServer(function(request, response) {
    if (request.url === "/add") {
      this.addAccessory();
      response.writeHead(204);
      response.end();
    }

    if (request.url == "/reachability") {
      this.updateAccessoriesReachability();
      response.writeHead(204);
      response.end();
    }

    if (request.url == "/remove") {
      this.removeAccessory();
      response.writeHead(204);
      response.end();
    }
  }.bind(this));

  this.requestServer.listen(18081, function() {
    console.log("Server Listening...");
  });

  if (api) {
      // Save the API object as plugin needs to register new accessory via this object.
      this.api = api;

      // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
      // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
      // Or start discover new accessories
      this.api.on('didFinishLaunching', function() {
        console.log("Plugin - DidFinishLaunching");
      }.bind(this));
  }

var configJSON = require('/Users/michaelriedel/.homebridge/config.json');
var platformsJSON = configJSON.platforms;
var platforms = "";
var accessoriesJSON = configJSON.accessories;
var accessories = "";

var bootstrap = "<link rel=\"stylesheet\" href=\"//maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css\">";
var font = "<link href='https://fonts.googleapis.com/css?family=Open+Sans:300' rel='stylesheet' type='text/css'>";
var style = "<style>h1, h2, h3, h4, h5, h6 {font-family: 'Open Sans', sans-serif;}p, div {font-family: 'Open Sans', sans-serif;}</style>"
var header = "<html><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no\"><head><title>Homebridge - Configuration</title>" + bootstrap + font + style + "</head>"; 
var footer = "<script defer=\"defer\" src=\"//maxcdn.bootstrapcdn.com/bootstrap/latest/js/bootstrap.min.js\"></script></body></html>";

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
    platforms = platforms + "<tr><td>" + platformsJSON[platform].platform + "</td><td>" + platformsJSON[platform].name + "</td></tr>";
}

for(var accessory in accessoriesJSON){
    accessories = accessories + "<tr><td><div class=\"checkbox\"><label><input type=\"checkbox\" value=\"\"></label></div></td><td>" + accessoriesJSON[accessory].accessory + "</td><td>" + accessoriesJSON[accessory].name + "</td><td>" + accessoriesJSON[accessory].name + "</td></tr>";
}

var bridgeName = "<div class=\"form-group\"><label for=\"homebridgename\">Name:</label><input type=\"text\" class=\"form-control\" id=\"homebridgename\" value=\"" + configJSON.bridge.name + "\"></div>";
var bridgeUsername = "<div class=\"form-group\"><label for=\"username\">Username:</label><input type=\"text\" class=\"form-control\" id=\"username\" value=\"" + configJSON.bridge.username + "\"></div>";
var bridgePin = "<div class=\"form-group\"><label for=\"pin\">Pin:</label><input type=\"text\" class=\"form-control\" id=\"pin\" value=\"" + configJSON.bridge.pin + "\"></div>";

var server = http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  response.write(header);
  response.write("<div class=\"container\">");
  response.write("<body><h1>Homebridge</h1>");

  response.write("<h2>Configuration</h2>");
  response.write(bridgeName + bridgeUsername + bridgePin);

  response.write("<h2>Platforms</h2>");
  if(JSON.stringify(platformsJSON) != "[]") {
    response.write(table1 + platforms + table2);
  } else {
    response.write("No platforms installed or configured!")
  }

  response.write("<h2>Accessories</h2>");
  if(JSON.stringify(accessoriesJSON) != "[]") {
    response.write(table1 + accessories + table2);
  } else {
    response.write("No accessories installed or configured!")
  }

  response.write("</div>")
  response.write(footer);
  response.end();
});

server.listen(8765);
console.log("Server is listening");
}

// Function invoked when homebridge tries to restore cached accessory
// Developer can configure accessory at here (like setup event handler)
// Update current value
Server.prototype.configureAccessory = function(accessory) {
  console.log("Plugin - Configure Accessory: " + accessory.displayName);

  // set the accessory to reachable if plugin can currently process the accessory
  // otherwise set to false and update the reachability later by invoking 
  // accessory.updateReachability()
  accessory.reachable = true;

  accessory.on('identify', function(paired, callback) {
    console.log("Identify!!!");
    callback();
  });

  if (accessory.getService(Service.Lightbulb)) {
    accessory.getService(Service.Lightbulb)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
      console.log("Light -> " + value);
      callback();
    });
  }

  this.accessories.push(accessory);
}

//Handler will be invoked when user try to config your plugin
//Callback can be cached and invoke when nessary
Server.prototype.configurationRequestHandler = function(context, request, callback) {
  console.log("Context: ", JSON.stringify(context));
  console.log("Request: ", JSON.stringify(request));

  // Check the request response
  if (request && request.response && request.response.inputs && request.response.inputs.name) {
    this.addAccessory(request.response.inputs.name);

    // Invoke callback with config will let homebridge save the new config into config.json
    // Callback = function(response, type, replace, config)
    // set "type" to platform if the plugin is trying to modify platforms section
    // set "replace" to true will let homebridge replace existing config in config.json
    // "config" is the data platform trying to save
    callback(null, "platform", true, {"platform":"Server", "otherConfig":"SomeData"});
    return;
  }

  // - UI Type: Input
  // Can be used to request input from user
  // User response can be retrieved from request.response.inputs next time
  // when configurationRequestHandler being invoked

  var respDict = {
    "type": "Interface",
    "interface": "input",
    "title": "Add Accessory",
    "items": [
      {
        "id": "name",
        "title": "Name",
        "placeholder": "Fancy Light"
      }//, 
      // {
      //   "id": "pw",
      //   "title": "Password",
      //   "secure": true
      // }
    ]
  }

  // - UI Type: List
  // Can be used to ask user to select something from the list
  // User response can be retrieved from request.response.selections next time
  // when configurationRequestHandler being invoked

  // var respDict = {
  //   "type": "Interface",
  //   "interface": "list",
  //   "title": "Select Something",
  //   "allowMultipleSelection": true,
  //   "items": [
  //     "A","B","C"
  //   ]
  // }

  // - UI Type: Instruction
  // Can be used to ask user to do something (other than text input)
  // Hero image is base64 encoded image data. Not really sure the maximum length HomeKit allows.

  // var respDict = {
  //   "type": "Interface",
  //   "interface": "instruction",
  //   "title": "Almost There",
  //   "detail": "Please press the button on the bridge to finish the setup.",
  //   "heroImage": "base64 image data",
  //   "showActivityIndicator": true,
  // "showNextButton": true,
  // "buttonText": "Login in browser",
  // "actionURL": "https://google.com"
  // }

  // Plugin can set context to allow it track setup process
  context.ts = "Hello";

  //invoke callback to update setup UI
  callback(respDict);
}

// Sample function to show how developer can add accessory dynamically from outside event
Server.prototype.addAccessory = function(accessoryName) {
  console.log("Add Accessory");
  var uuid;

  if (!accessoryName) {
    accessoryName = "Test Accessory"
  }

  uuid = UUIDGen.generate(accessoryName);

  var newAccessory = new Accessory(accessoryName, uuid);
  newAccessory.on('identify', function(paired, callback) {
    console.log("Identify!!!");
    callback();
  });
  // Plugin can save context on accessory
  // To help restore accessory in configureAccessory()
  // newAccessory.context.something = "Something"

  newAccessory.addService(Service.Lightbulb, "Test Light")
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    console.log("Light -> " + value);
    callback();
  });

  this.accessories.push(newAccessory);
  this.api.registerPlatformAccessories("homebridge-server", "Server", [newAccessory]);
}

Server.prototype.updateAccessoriesReachability = function() {
  console.log("Update Reachability");
  for (var index in this.accessories) {
    var accessory = this.accessories[index];
    accessory.updateReachability(false);
  }
}

// Sample function to show how developer can remove accessory dynamically from outside event
Server.prototype.removeAccessory = function() {
  console.log("Remove Accessory");
  this.api.unregisterPlatformAccessories("homebridge-server", "Server", this.accessories);

  this.accessories = [];
}