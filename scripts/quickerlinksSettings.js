$(document).ready(function() {
    if (localStorage["quickerLinks.domain"]) {
        $('#domainInput').attr('placeholder', localStorage["quickerLinks.domain"])
    }
    else {
        $('#domainInput').attr('placeholder', "No domain set.")
    }
    $('#domainButton').click(function() {
        let domain = $('#domainInput').val();
        if (!domain.startsWith('http')) {
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
});
