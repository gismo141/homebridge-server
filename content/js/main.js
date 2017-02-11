/* eslint-env browser, jquery */

/* exported listPlatforms */
/* exported removePlatformConfigConfirm */
/* exported removePlatformConfig */
/* exported editPlatform */
/* exported savePlatformEdit */
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
    delete config.hbServer_confDigest;
    return (JSON.stringify(config, null, ' '));
}

function listPlatforms() {
    $.getJSON("/api/installedPlatforms", function(data) {
        if (data.length === 0) {
            $("#platformsTableHeader").hide();
            $("#platformsTable").text("No platforms installed or configured!");
        } else {
            $("#platformsTableHeader").show();
            $("#platformsTable").empty();
            $.each(data, function(id_platform, platform) {
                var conf = configFromData(platform);
                var activeIndicator = platform.hbServer_active_flag === 1 ? "   <span class='activityActive'></span>" : "<span class='activityInactive'></span>";
                var row = "<div class='row content'> \
                            <div>" + activeIndicator + "</div>\
                            <div>" + platform.platform + "<br\>(" + platform.hbServer_pluginName + ")</div>\
                            <div>" + platform.name + "</div>\
                            <div><pre>" + conf + "</pre></div>\
                            <div><a href='#' class='btn btn-default center-block' style='height: 34px; line-height: 16px; vertical-align:middle;outline:none !important;' onclick='removePlatformConfigConfirm(\"" + platform.hbServer_confDigest + "\");'><span style='font-size:25px;''>&#128465;</span></a></div>\
                            <div><a href='#' class='btn btn-default center-block' style='height: 34px; line-height: 16px; vertical-align:middle;outline:none !important;' onclick='editPlatform(\"" + platform.hbServer_confDigest + "\");'><span style='font-size:25px;''>&#9997;</span></a></div>\
                           </div>";
                $("#platformsTable").append(row);
            });
        }
    });
}

function removePlatformConfigConfirm(platformID) {
    $('#confirmRemoveModal').modal('show');
    $("#confirmRemoveModalPlatformID").val(platformID);
}

function removePlatformConfig() {
    var platformID = $("#confirmRemoveModalPlatformID").val();
    $('#confirmRemoveModalStatus').text("Updateing config.json...");

    $.getJSON("/api/removePlatform?" + platformID, function(result) {
        if (result.success) {
            $('#confirmRemoveModalStatus').text("Updating config.json... Done.");
            listPlatforms();
            $('#confirmRemoveModal').modal('hide');
        } else {
            $('#confirmRemoveModalStatus').text("Failed: " + result.msg);
        }
    });
}

function editPlatform(platformID) {
    $('#editModal').modal('show');
    $("#editModalplatformID").val(platformID);

    $.getJSON("/api/installedPlatforms", function(data) {
        var thisPf;
        $.each(data, function(id_pf, pf) {
            if (pf.hbServer_confDigest === platformID) {
                thisPf = pf;
            }
        });
        if (!thisPf) {
            console.log("platform not loaded; digest not found.");
            return;
        }
        var title = "Editing " + thisPf.platform + " (" + thisPf.hbServer_pluginName + ")";
        $("#editModalTitle").text(title);
        var editedPlatformConf = configFromData(thisPf);
        $("#editModalContainer").text(editedPlatformConf);
    });
}

function savePlatformEdit() {
    var newConf = $("#editModalContainer").val();
    console.log("newConf: " + newConf);
    var json = "";
    var success = true;
    var error;
    try {
        json = JSON.parse(newConf);
    } catch (e) {
        success = false;
        error = e.message;
    }
    if (success) {
        $("#editModalStatus").text("Valid.");
        var platformID = $("#editModalplatformID").val();
        $.getJSON("/api/removePlatform?" + platformID, function(data) {
            // save platform config
        });
    } else {
        $("#editModalStatus").text(error);
    }
}
