/* eslint-env browser, jquery */

/* exported addPlatformConfig */

function addPlatformConfig() {
    var payload = $("#submitPlatformConfig").serialize();
    $.post( "/api/addPlatformConfig", payload, function(result) {
        alert(result.success + "\n" + result.msg);
    });
}
