/* eslint-env node */

'use strict';

module.exports = {
  AssetManager: AssetManager
}

var fs = require('fs');
var hbLog = function() {};

var assetPath;

function AssetManager(hbsPath, log) {
    assetPath = require('path').resolve(hbsPath, 'content');

    hbLog = log;
    this.reload();
}

AssetManager.prototype.reload = function() {
    loadAllContentAssets();
}


function loadContentAsset(name, callback) {
    var fullPath = require('path').resolve(assetPath, name);
    fs.readFile(fullPath, 'utf8', function(err, data) {
        if (err) {
            hbLog(err);
            callback("");
        }
        callback(data);
    });
}

function loadAllContentAssets() {
    loadContentAsset("header.html", function(data) { AssetManager.prototype.headerHTML = data; });
    loadContentAsset("navbar.html", function(data) { AssetManager.prototype.navBarHTML = data; });
    loadContentAsset("footer.html", function(data) { AssetManager.prototype.footerHTML = data; });
    loadContentAsset("main.html", function(data) { AssetManager.prototype.mainHTML = data; });
    loadContentAsset("plugins.html", function(data) { AssetManager.prototype.pluginsHTML = data; });
    loadContentAsset("addPlatform.html", function(data) { AssetManager.prototype.addPlatformHTML = data; });
    loadContentAsset("addAccessory.html", function(data) { AssetManager.prototype.addAccessoryHTML = data; });
    loadContentAsset("style.css", function(data) { AssetManager.prototype.styleCSS = data; });
    loadContentAsset("showLog.html", function(data) { AssetManager.prototype.showLogHTML = data; });

    loadContentAsset("js/global.js", function(data) { AssetManager.prototype.globalJS = data; });
    loadContentAsset("js/main.js", function(data) { AssetManager.prototype.mainJS = data; });
    loadContentAsset("js/plugins.js", function(data) { AssetManager.prototype.pluginsJS = data; });
    loadContentAsset("js/showLog.js", function(data) { AssetManager.prototype.showLogJS = data; });
    loadContentAsset("js/addAccessory.js", function(data) { AssetManager.prototype.addAccessoryJS = data; });
    loadContentAsset("js/addPlatform.js", function(data) { AssetManager.prototype.addPlatformJS = data; });
    loadContentAsset("js/footer.js", function(data) { AssetManager.prototype.footerJS = data; });
}
