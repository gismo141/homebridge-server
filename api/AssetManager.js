/* eslint-env node */

'use strict';

module.exports = {
  AssetManager: AssetManager
}

var fs = require('fs');
var hbLog = function() {};

var assetPath;
var headerHTML, navBarHTML, footerHTML, mainHTML, pluginsHTML, addPlatformHTML, addAccessoryHTML, styleCSS, libJS, showLogHTML;

function AssetManager(hbsPath, log) {
    assetPath = require('path').resolve(hbsPath, 'content');

    hbLog = log;
    this.reload();
}

AssetManager.prototype.headerHTML = function() { return headerHTML};

AssetManager.prototype.navBarHTML = function() { return navBarHTML};

AssetManager.prototype.footerHTML = function() { return footerHTML};

AssetManager.prototype.mainHTML = function() { return mainHTML};

AssetManager.prototype.pluginsHTML = function() { return pluginsHTML};

AssetManager.prototype.addPlatformHTML = function() { return addPlatformHTML};

AssetManager.prototype.addAccessoryHTML = function() { return addAccessoryHTML};

AssetManager.prototype.styleCSS = function() { return styleCSS};

AssetManager.prototype.libJS = function() { return libJS};

AssetManager.prototype.showLogHTML = function() { return showLogHTML};

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
    loadContentAsset("header.html", function(data) { headerHTML = data; });
    loadContentAsset("navbar.html", function(data) { navBarHTML = data; });
    loadContentAsset("footer.html", function(data) { footerHTML = data; });
    loadContentAsset("main.html", function(data) { mainHTML = data; });
    loadContentAsset("plugins.html", function(data) { pluginsHTML = data; });
    loadContentAsset("addPlatform.html", function(data) { addPlatformHTML = data; });
    loadContentAsset("addAccessory.html", function(data) { addAccessoryHTML = data; });
    loadContentAsset("style.css", function(data) { styleCSS = data; });
    loadContentAsset("lib.js", function(data) { libJS = data; });
    loadContentAsset("showLog.html", function(data) { showLogHTML = data; });
}
