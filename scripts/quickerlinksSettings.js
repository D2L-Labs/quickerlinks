$(document).ready(function() {
    if (localStorage["quickerLinks.domain"]) {
        $('#domainInput').attr('value', localStorage["quickerLinks.domain"])
    }
    else {
        $('#domainInput').attr('value', "No domain set.")
    }
    $('#domainButton').click(function() {
        let domain = $('#domainInput').val();
        if (domain && !domain.startsWith('http')) {
            domain = "https://" + domain;
        }
        localStorage["quickerLinks.domain"] = domain;
    });

    if (localStorage["quickerLinks.pinnedOnly"] === null) {
        $('#allCourses').prop('checked', true);
    }
    else {
        if (localStorage["quickerLinks.pinnedOnly"] === 'true') {
            $('#pinnedCourses').prop('checked', true);
        }
        else {
            $('#allCourses').prop('checked', true);
        }
    }
    $('input[name=coursesVisibility]').click(function() {
        localStorage.setItem("quickerLinks.pinnedOnly", ($('input[name=coursesVisibility]:checked').val() == 'true'));
    });

    for (let i=0; i<=7; i++) {
        $('#pastRangeInput').append(`<option id="past${i}">${i}</option>`);
        if (i !== 0) {
            $('#futureRangeInput').append(`<option id="future${i}">${i}</option>`);
        }
    }
    $(`#pastRangeInput #past${localStorage["quickerLinks.dropboxPastDays"]}`).attr('selected', 'selected');
    $(`#futureRangeInput #future${localStorage["quickerLinks.dropboxFutureDays"]}`).attr('selected', 'selected');
    $('#rangeButton').click(function() {
        localStorage["quickerLinks.dropboxPastDays"] = $('#pastRangeInput').val() || localStorage["quickerLinks.dropboxPastDays"];
        localStorage["quickerLinks.dropboxFutureDays"] = $('#futureRangeInput').val() || localStorage["quickerLinks.dropboxFutureDays"];
    });
});
