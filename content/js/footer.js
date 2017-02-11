/* eslint-env browser, jquery */

/* exported updateBridgeStats */

function updateBridgeStats() {
    var eventSource = new EventSource('http://127.0.0.1:8765/api/bridgeInfo');

    eventSource.addEventListener('message', function(e) {
        var result = JSON.parse(e.data);

        if (result.type === 'bridgeInfo') {
            $("#bridgeUptime").text(moment.duration(result.data.uptime, 'seconds').humanize());
            $("#bridgeMemoryUsed").text(numeral(result.data.heap).format('0b'));
            $("#bridgeHostOS").text(result.data.osInfo);
            $("#bridgeVersion").text(result.data.hbVersion);
        }
        if (result.type === 'bridgeUpdateAvailable') {
            var updateInfo = "";
            var status = result.data.updateAvailable;
            if (status == true) {
                updateInfo = "update available";
                if (result.data.latestVersion !== 'unknown') {
                    updateInfo = updateInfo + ": " + result.data.latestVersion;
                }
            }
            $("#bridgeUpdate").text(updateInfo);
        }
    }, false);
}
