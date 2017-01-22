// main.html
function configFromData(configData) {
    // TODO: use internalPropertiesReplacer approach like in ConfigManager
    var config = JSON.parse(JSON.stringify(configData));
    delete config.platform;
    delete config.accessory;
    delete config.name;
    delete config.hbServer_active_flag;
    delete config.hbServer_latestVersion;
    delete config.hbServer_installedVersion;
    delete config.hbServer_pluginName;
    return (JSON.stringify(config, null, ' ')).replace(/,/g, ',<br>');
}

// plugins.html
function listInstalledPlugins() {
    console.log("listInstalledPlugins()");
    $.getJSON("/api/installedPlugins", function(installedPlugins) {
        $("#installedPluginsTable").empty();
        $.each( installedPlugins, function( id_plugin, plugin ) {
            var activeInfo = "Currently active.";
            var usageInfo = "platforms: " + plugin.platformUsage + "<br\>accessories: " + plugin.accessoryUsage;
            var versionInfo = "Version: " + plugin.version;
            var action = "";
            var buttonStyle = "style='height: 34px; line-height: 16px; vertical-align:middle;outline:none !important;'";
            if (plugin.isLatestVersion === "0") {
                action += "<a href='#' class='btn btn-success center-block' " + buttonStyle + " onclick='callPluginOperation(\"" + plugin.name + "@" + plugin.latestVersion + "\", \"update\");'><span style='font-size:25px;''>Update to " + plugin.latestVersion + "</span></a>";
            }
            action += "<a href='#' class='btn btn-danger center-block' " + buttonStyle + " onclick='callPluginOperation(\"" + plugin.name + "\", \"remove\");'><span style='font-size:25px;''>Uninstall</span></a>";
            var row =  "<tr> \
                            <td style='vertical-align:middle;'><a href='" + plugin.homepage + "' target=_blank>" + plugin.name + "</a></td> \
                            <td style='vertical-align:middle;'>" + plugin.author + "</td> \
                            <td style='vertical-align:middle;'>" + plugin.description + "</td> \
                            <td style='vertical-align:middle;'>" + versionInfo + "<br\>" + activeInfo + "<br\>" + usageInfo + "</td> \
                            <td style='vertical-align:middle;'>" + action + "</td> \
                       </tr>";
            $("#installedPluginsTable").append(row);
        });
    });
}

function callPluginOperation(pluginName, operation) {
    $('#progressModal').modal('show');

    var opsName = "";
    var opsCall = "";
    switch (operation) {
        case 'install':
            opsName = "Installing: ";
            opsCall = "/api/installPlugin?" + pluginName;
            break;
        case 'update':
            opsName = "Updating: ";
            opsCall = "/api/updatePlugin?" + pluginName;
            break;
        case 'remove':
            opsName = "Removing: ";
            opsCall = "/api/removePlugin?" + pluginName;
            break;
        default:
            return;
    }

    $("#progressModalLogContainer").text("");
    $("#progressModalTitle").text(opsName + pluginName);
    $("#progressModalStatus").text("Working...");
    $.get( opsCall, function( data ) {
        var lines = data.split(/\r?\n/);
        for (var lineID in lines) {
            if (lines[lineID].startsWith("{\"hbsAPIResult\":")) {
                var apiResult = JSON.parse(lines[lineID]).hbsAPIResult;
                if (apiResult.success) {
                    $("#progressModalStatus").text("Finished!");
                    listInstalledPlugins();
                } else {
                    $("#progressModalStatus").text("Finished with error: " + apiResult.msg);
                }
            } else {
                $("#progressModalLogContainer").append(lines[lineID] + "\n");
            }
            $("#progressModalLogContainer").scrollTop($("#progressModalLogContainer").prop("scrollHeight"));
        }
    });
}



// addPlatform.html
function listPlugins() {

}

function savePlatform() {
    console.log("savePlatform()");
    var payload = $("#submitPlatformConfig").serialize();
    // $.post( "/api/savePlatformConfig", $("#platformConfig").val(), function(result) {
    $.post( "/api/savePlatformConfig", payload, function(result) {
        alert(result.success + "\n" + result.msg);
    });
}

// addAccessory.html
function saveAccesory() {
    console.log("savePlatform()");
}
