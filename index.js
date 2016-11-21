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
    var fs              = require('fs');
    var HttpDispatcher  = require('httpdispatcher');
    var http            = require('http');
    var dispatcher      = new HttpDispatcher();
    var restart_required = 0;

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
    var table1 =  (function () {/* 
    <div class="table-responsive"> 
      <table class="table table-hover">
        <thead>
          <tr>
            <th width='20%'>Type</th>
            <th width='20%'>Name</th>
            <th width='50%'>Info</th>
            <th width='10%'></th>
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

    // Prepares the html-markup for the bridge parameters as forms
    var bridgeName;
    var bridgeUsername;
    var bridgePin;

    // Get the config.json from parents process ...
    var configJSON = require(process.argv[process.argv.indexOf('-U') + 1] + '/config.json');

    // Launches the webserver and transmits the website by concatenating the precreated markup
    var server = http.createServer(handleRequest);

    dispatcher.onGet("/", function(req, res) {
      prepareConfig();
      printMainPage(res);
      fs.writeFile(process.argv[process.argv.indexOf('-U') + 1] + '/config.json', JSON.stringify(configJSON).replace(',null','').replace('null,','').replace('null',''), "utf8");
    });

    dispatcher.beforeFilter(/\//, function(req, res, chain) { //any url
        url = req.url;
        if(url.indexOf('/remove') !== -1) {
          object = url.replace('/remove','');
          res.write("<div class='alert alert-info fade in'><a href='/' class='close' data-dismiss='alert'>&times;</a><strong>Note!</strong> Please restart Homebridge to activate your changes.</div>");
          res.write(header + "<div class='container'><br><h3>");
          if(object.indexOf('Platform') !== -1) {
            platform = object.replace('Platform','');
            res.write("Successfully removed platform: </h3><label>'" + configJSON.platforms[platform].name + "'</label>");
            delete configJSON.platforms[platform];
            platformsJSON = configJSON.platforms;
          } else if(object.indexOf('Accessory') !== -1) {
            accessory = object.replace('Accessory','');
            res.write("Successfully removed accessory: </h3><label>'" + configJSON.accessories[accessory].name + "'</label>");
            delete configJSON.accessories[accessory];
            accessoriesJSON = configJSON.accessories;
          }
          res.end("</div>" + footer);
          console.log(platformsJSON.length);
        }
        chain.next(req, res, chain);
    });
 
    dispatcher.onError(function(req, res) {
        res.writeHead(404);
        res.end();
    });

    //We need a function which handles requests and send response
	function handleRequest(request, response) {
		try {
        //log the request on console
        console.log(request.url);
        //Disptach
        dispatcher.dispatch(request, response);
    } catch(err) {
        console.log(err);
    }
	}

  function prepareConfig() {
    // Prepare the platforms for html-markup
    // - introduces html-table-cell
    // - adds the info from platform JSON-object
    // - strips the JSON-identifiers
    // - adds a checkbox as first table-cell to enable row-selection
    platformsJSON = configJSON.platforms;
    platforms = "";
    for(var id_platform in platformsJSON){
        var platform = platformsJSON[id_platform];
        platforms = platforms + "<tr><td style='vertical-align:middle;'>";
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
        platforms = platforms + tempArray + "</td>";
        platforms = platforms + "</td><td style='vertical-align:middle;'><a href='/removePlatform" + id_platform + "' class='btn btn-default center-block' style='width:135px'>Remove</a>" + "</td><td style='vertical-align:middle;'></td></tr>";
    }
    
    // Prepare the accessories for html-markup
    // - introduces html-table-cell
    // - adds the info from platform JSON-object
    // - strips the JSON-identifiers
    // - adds a checkbox as first table-cell to enable row-selection
    accessoriesJSON = configJSON.accessories;
    accessories = "";
    for(var id_accessory in accessoriesJSON){
        var accessory = accessoriesJSON[id_accessory];
        accessories = accessories + "<tr><td style='vertical-align:middle;'>";
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
        accessories = accessories + tempArray + "</td>";
        accessories = accessories + "</td><td style='vertical-align:middle;'><a href='/removePlatform" + id_accessory + "' class='btn btn-default center-block' style='width:135px'>Remove</a>" + "</td><td style='vertical-align:middle;'></td></tr>";
    }

    // Prepares the html-markup for the bridge parameters as forms
    bridgeName = "<div class='form-group'><label for='homebridgename'>Name:</label><input type='text' class='form-control' id='homebridgename' value='" + configJSON.bridge.name + "'></div>";
    bridgeUsername = "<div class='form-group'><label for='username'>Username:</label><input type='text' class='form-control' id='username' value='" + configJSON.bridge.username + "'></div>";
    bridgePin = "<div class='form-group'><label for='pin'>Pin:</label><input type='text' class='form-control' id='pin' value='" + configJSON.bridge.pin + "'></div>";
  }

  function printMainPage(res) {
      res.write(header);
      res.write("<div class='container'>");
      res.write("<body><h1>Homebridge</h1>");

      res.write("<h2>Configuration</h2>");
      res.write(bridgeName + bridgeUsername + bridgePin);

      res.write("<h2>Platforms</h2>");
      if(0 < Object.keys(platformsJSON).length) {
        res.write(table1 + platforms + table2);
      } else {
        res.write("No platforms installed or configured!");
      }
      res.write("<br><a href='/addPlatform' id='Add' name='AddPlatform' class='btn btn-default center-block' style='width:135px'>Add</a><br>");

      res.write("<h2>Accessories</h2>");
      if(0 < Object.keys(accessoriesJSON).length) {
        res.write(table1 + accessories + table2);
      } else {
        res.write("No accessories installed or configured!");
      }
      res.write("<br><a href='/addAccessory' id='Add' name='AddAccessory' class='btn btn-default center-block' style='width:135px'>Add</a><br>");

      res.write("<br>");

      res.write("</div>");
      res.write(footer);
      res.end();
  }

	//Lets start our server
	server.listen(self.config.port, function(){
	    //Callback triggered when server is successfully listening. Hurray!
	    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
			console.log("Homebridge-Server is listening on: http://%s:%s", add, self.config.port);
		})
	});
}

Server.prototype.accessories = function(callback) {
    var self = this;
    self.accessories = [];
    callback(self.accessories);
}
