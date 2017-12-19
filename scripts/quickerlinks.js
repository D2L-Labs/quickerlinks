let endpoint = localStorage["quickerLinks.domain"];
// let endpoint = 'https://d2llabs.desire2learn.com';
// let endpoint = 'https://learn.uwaterloo.ca';
let leVersion = '1.24';
let lpVersion = '1.20';

$(document).ready(function() {
    endpoint ? loadCourses() : $('#home').html(`<a href="settings.html">No domain has been chosen yet. Click here.</a>`);
});

function loadCourses() {
    $('#title').attr('href', `${endpoint}/d2l/home`);
    $.ajax({
        url: `${endpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/?OrgUnitTypeId=1,3&sortBy=-PinDate`,
        dataType: "json",
        success: function(data) {
            let courses = data.Items;
            let domainName = courses.filter(course => course.OrgUnit.Type.Id === 1)[0].OrgUnit.Name;
            $('#title').html(domainName);
            let pinnedCourses = courses.filter(course => (!(localStorage["quickerLinks.pinnedOnly"]==='true') || course.PinDate)).filter(course => course.OrgUnit.Type.Id === 3);
            let numRows = pinnedCourses.length / 2 + 1;

            // Two courses take up one row.
            for (var i = 0; i < numRows; i++) {
                $("#home").append("<div class=\"row\"></div>")
            }
            // Appends to cols of width 6 to every row.
            $(".row").append("<div class=\"col-xs-6\"> </div>")
            $(".row").append("<div class=\"col-xs-6\"> </div>")

            // Append card to every column
            $(".col-xs-6").each(function (index) {
                if (index >= pinnedCourses.length) return;

                let image = pinnedCourses[index].OrgUnit.ImageUrl || "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png";
                let title = pinnedCourses[index].OrgUnit.Name;
                let id = pinnedCourses[index].OrgUnit.Id;

                if (!image) {
                    // Set to default
                    image = "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png"
                }
                $(this).append(`<div class=courseInfo>
                                    <a href="course.html?ou=${id}&name=${title}" id="${id}"><img src="${image}" height="87" width="200"/></a>
                                    <div class="extLink">
                                        <a href="#" id="${id}" class="name">${title}</a>
                                    </div>
                                </div>`);
                let updateParent = $(this).children('div').children('div');
                $.ajax({
                    url: `${endpoint}/d2l/api/le/1.24/${id}/updates/myUpdates`,
                    success: function (d) {
                        let updatesCount = d.UnreadDiscussions + d.UnattemptedQuizzes + d.UnreadAssignmentFeedback
                        if (updatesCount) {
                            if (updatesCount > 99) updatesCount = '99+'

                            $(updateParent).append(`<span class="notification">${updatesCount}</span>`)
                        }
                    },
                    error: function (e) {
                        console.log('There was an error when retrieving the data')
                    }
                });
            })
            $('#home a').click(function() {
               let courseId = $(this).attr('id');
               let courseName = $(this).text() || $(this).next().children(":first").text();
               loadCourse({courseId, courseName});
           });
        },
        error: function (e) {
            $('#home').html(`<a href="${endpoint}/d2l/login" target="_blank">Could not login. Click here to log in.</a>`);
            console.log("Error: Not a valid URL.");
        }
    });
}
