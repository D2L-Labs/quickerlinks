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

    console.log(localStorage["quickerLinks.pinnedOnly"])
    if (localStorage["quickerLinks.pinnedOnly"] === null) {
        console.log("unset")
        $('#allCourses').prop('checked', true);
    }
    else {
        console.log("set")
        if (localStorage["quickerLinks.pinnedOnly"]) {
            console.log("TRUE")
            $('#pinnedCourses').prop('checked', true);
        }
        else {
            console.log("FALSE")
            $('#allCourses').prop('checked', true);
        }
    }
    $('input[name=coursesVisibility]').click(function() {
        localStorage.setItem("quickerLinks.pinnedOnly", ($('input[name=coursesVisibility]:checked').val() == 'true'));
    });
});
