/* eslint-env browser, jquery */

/* exported addAccessoryConfig */

function addAccessoryConfig() {
    var payload = $("#submitAccessoryConfig").serialize();
    $.post( "/api/addAccessoryConfig", payload, function(result) {
        alert(result.msg);
    });
}
