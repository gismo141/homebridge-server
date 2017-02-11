/* eslint-env browser, jquery */

/* exported triggerLogFileMethod */
/* exported showLogContent */
/* exported subcribeToLogFileTail */
/* exported showLogContentTail */
/* exported highlightLogText */

var tailSubscriptionID = "";
var eventSource;

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
        highlightLogText();

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
        var cleanLine = result.data.replace(/</g, "&#60;")
                                   .replace(/>/g, "&#62;");
        $("#logContent").append(cleanLine + "<br />");
        highlightLogText();
    }, false);
}

function highlightLogText() {
    var text = $("#highlightText").val();

    // remove the highlight
    var currentText = $("#logContent").html();
    var cleanText = currentText.replace(/<span class=\"logHighlight\">/gi, '')
                               .replace(/<\/span>/gi, '');

    var higlightedText;
    if (text === "") {
        higlightedText = cleanText;
    } else {
        // escape regex characters
        var escapedText = text.replace(/\//gi, '\\/')
                              .replace(/\./gi, '\\.')
                              .replace(/\$/gi, '\\$')
                              .replace(/\*/gi, '\\*')
                              .replace(/\^/gi, '\\^');
        var regex = new RegExp(escapedText, 'gi');
        var subst = '<span class="logHighlight">' + text + '</span>';
        higlightedText = cleanText.replace(regex, subst);
    }

    $("#logContent").html(higlightedText);
}
