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
                            <div>\
                                <span><a href='#' class='btn btn-default' style='height: 34px; line-height: inherit; vertical-align:middle;outline:none !important;' onclick='removePlatformConfigConfirm(\"" + platform.hbServer_confDigest + "\");'><span style='font-size:18px;''>&#128465;</span></a></span>\
                                <span><a href='#' class='btn btn-default' style='height: 34px; line-height: 20px; vertical-align:middle;outline:none !important;' onclick='editPlatform(\"" + platform.hbServer_confDigest + "\");'><span style='font-size:25px;''>&#9997;</span></a></span>\
                            </div>\
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
        $('#editModalPlugins').empty();
        $.each(data, function(id_pf, pf) {
            var selected = false;
            if (pf.hbServer_confDigest === platformID) {
                thisPf = pf;
                selected = true;
            }
            $('#editModalPlugins')
                .append($("<option></option>")
                    .attr("value", pf.hbServer_pluginName)
                    .text(pf.hbServer_pluginName)
                    .prop( "selected", selected ));
        });
        if (!thisPf) {
            alert("Couldn't load the platform with this id.");
            $('#editModal').modal('hide');
            return;
        }
        var title = "Editing " + thisPf.name + " (" + thisPf.hbServer_pluginName + ")";
        $("#editModalTitle").text(title);
        var editedPlatformConf = configFromData(thisPf);
        $("#editModalContainer").text(editedPlatformConf);
    });
}

function savePlatformEdit() {
    var newConf = $("#editModalContainer").val();
    newConf = newConf.replace(/\n/g, '');
    try {
        JSON.parse(newConf);
    } catch (error) {
        $("#editModalStatus").text(error.message);
        return;
    }

    $("#editModalStatus").text("Valid.");
    var payload = {
        "configID": $("#editModalplatformID").val(),
        "platformConfig": newConf,
        "plugin": $("#editModalPlugins").val()
    };
    $.post("/api/updatePlatform", payload)
    .done(function() {
        $('#editModal').modal('hide');
        listPlatforms();
    })
    .error(function(err) {
        $('#editModal').modal('hide');
        alert("Update failed: " + err);
        return;
    })
}
