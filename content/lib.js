/* eslint-env browser, jquery */
$( document ).tooltip({
  classes: {
    "ui-tooltip": "highlight"
  },
  show: false
});

// main.html
/* exported configFromData */
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
    return (JSON.stringify(config, null, ' '));
}


// plugins.html
/* exported listInstalledPlugins */
function listInstalledPlugins() {
    $.getJSON("/api/installedPlugins", function(installedPlugins) {
        $("#installedPluginsTable").empty();
        $.each( installedPlugins, function( id_plugin, plugin ) {
            var activeInfo = "<span class='activityActive'></span>";
            var usageInfo = "Platforms: " + plugin.platformUsage + ", Accessories: " + plugin.accessoryUsage;
            var versionInfo = "Version: " + plugin.version;
            var action = "";
            var buttonStyle = "style='height: 34px; line-height: 16px; vertical-align:middle;outline:none !important;'";
            if (plugin.isLatestVersion === "0") {
                action += "<a href='#' class='btn btn-success center-block' " + buttonStyle + " onclick='callPluginOperation(\"" + plugin.name + "@" + plugin.latestVersion + "\", \"update\");'><span style='font-size:25px;' title='Available Version: " + plugin.latestVersion + "'>Update</span></a>";
            }
            action += "<a href='#' class='btn btn-danger center-block' " + buttonStyle + " onclick='callPluginOperation(\"" + plugin.name + "\", \"remove\");'><span style='font-size:25px;'>Uninstall</span></a>";
            var row =  "<div class='row content' title='" + versionInfo + ", " + usageInfo + "'> \
                            <div>" + activeInfo + "</div>\
                            <div><a href='" + plugin.homepage + "' target=_blank>" + plugin.name + "</a></div>\
                            <div>" + plugin.author + "</div>\
                            <div>" + plugin.description + "</div>\
                            <div>" + action + "</div>\
                       </div>";
            $("#installedPluginsTable").append(row);
        });
    });
}

/* exported callPluginOperation */
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

/* exported addPlatformConfig */
function addPlatformConfig() {
    var payload = $("#submitPlatformConfig").serialize();
    $.post( "/api/addPlatformConfig", payload, function(result) {
        alert(result.success + "\n" + result.msg);
    });
}


// addAccessory.html
/* exported addAccessoryConfig */
function addAccessoryConfig() {
    var payload = $("#submitAccessoryConfig").serialize();
    $.post( "/api/addAccessoryConfig", payload, function(result) {
        alert(result.success + "\n" + result.msg);
    });
}


// showLog.html
var tailSubscriptionID = "";
var eventSource;

/* exported triggerLogFileMethod */
function triggerLogFileMethod(selection) {
    switch (selection) {
        case 'page':
            $('#paging').show();
            $('#tailing').hide();
            showLogContent(1);
            if (eventSource) {
                eventSource.close();
            }
            if (tailSubscriptionID !== "") {
                $.getJSON('/api/unsubscribeFromLogFileTail?' + tailSubscriptionID);
                tailSubscriptionID = "";
            }
            break;
        case 'tail':
            $('#tailing').show();
            $('#paging').hide();
            if (tailSubscriptionID === "") {
                subcribeToLogFileTail();
                return;
            }
            showLogContentTail();
            break;
        default:
            break;
    }
}

/* exported showLogContent */
function showLogContent(page) {
    if (!page) {
        page = 1;
    }
    $.getJSON("/api/logFileContent?" + page, function(result) {
        if (!result.success) {
            alert("An error occored: " + result.msg + "\n\nPlease check the config parameter 'log' for homebridge-server.");
            return;
        }

        $("#logContent").empty();
        $.each( result.data.lines, function( id_line, line ) {
            var cleanLine = line.replace(/</g, "&#60;")
                                .replace(/>/g, "&#62;");
            $("#logContent").append(cleanLine + "<br />");
        });

        // reset the paging links
        // firstPageLink stay always the same
        $("#prevPageLink").off( "click" )
        $("#nextPageLink").off( "click" )
        $("#lastPageLink").off( "click" )

        // set the paging links
        // firstPageLink stay always the same
        $("#prevPageLink").click(function() {
            showLogContent(page - 1);
        });
        $("#nextPageLink").click(function() {
            showLogContent(page + 1);
        });
        $("#lastPageLink").click(function() {
            showLogContent(result.data.lastPage);
        });

        $("#currentPage").text(" " + page + " ");
        $("#lastPageLink").text(" " + result.data.lastPage);

        if (page === 1) {
            $("#firstPageLink").hide();
            $("#prevPageLink").hide();
        } else {
            $("#firstPageLink").show();
            $("#prevPageLink").show();
        }

        if (page === result.data.lastPage) {
            $("#nextPageLink").hide();
            $("#lastPageLink").hide();
        } else {
            $("#nextPageLink").show();
            $("#lastPageLink").show();
        }
    });
}

/* exported subcribeToLogFileTail */
function subcribeToLogFileTail() {
    $.getJSON("/api/subscribeToLogFileTail", function(result) {
        if (!result.success) {
            alert("An error occored: " + result.msg + "\n\nPlease check the config parameter 'log' for homebridge-server.");
            return;
        }
        tailSubscriptionID = result.subscriptionID;
        showLogContentTail();
    });
}


/* exported showLogContentTail */
function showLogContentTail() {
    // test the case, when the page still has a tailSubscriptionID, but the tailProcess
    // is not active.
    var callPath = '/api/logFileTail?' + tailSubscriptionID;
    eventSource = new EventSource(callPath)

    $(window).bind("beforeunload", function () {
        // Clear the subscriptionID and close the connection.
        tailSubscriptionID = "";
        eventSource.close();
    });

    $("#logContent").empty();

    eventSource.addEventListener('message', function(e) {
        var result = JSON.parse(e.data);
        if (!result.success) {
            if (result.data === "not_subscribed") {
                // We'll have to resubscribe
                eventSource.close();
                subcribeToLogFileTail();
            }
            return;
        }
        $("#logContent").append(result.data + "<br />");
    }, false);
}
