let endpoint = localStorage["quickerLinks.domain"];
// let endpoint = 'https://d2llabs.desire2learn.com';
// let endpoint = 'https://learn.uwaterloo.ca';
let leVersion = '1.24';
let lpVersion = '1.20';
let divs = ['home', 'course'];
let badges = ['Discussions', 'Quizzes', 'Grades'];
let topicsCache = null;

$(document).ready(function() {
    createDivs();
    endpoint ? loadCourses() : $('#home').html(`<a href="settings.html">No domain has been chosen yet. Click here.</a>`);
    $('#back').click(function() {
        loadCourses();
    })
});

function createDivs() {
    for (let i=0; i<divs.length; i++) {
        $('#main').append(`<div id="${divs[i]}"></div>`);
    }
}

function loadCourses() {
    showDiv('home');
    $('#courseHeader').hide();
    $('#homeHeader').show();
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
                                    <a href="#" id="${id}"><img src="${image}" height="87" width="200"/></a>
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

function loadCourse(courseInfo) {
    $.ajax({
        url: `${endpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/${courseInfo.courseId}`,
        dataType: "json",
        success: function(data) {
            showDiv('course');
            $('#homeHeader').hide();
            $('#courseHeader').show();
            $('#title').html(courseInfo.courseName);
            $('#title').attr('href', `${endpoint}/d2l/home/${courseInfo.courseId}`);
            let image = data.OrgUnit.ImageUrl || "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png";
            $('#courseHeader').css('background-image', `url("${image}")`);
            $('#courseHeader').css('width', window.innerWidth);
            $('#courseHeader').css('height', window.innerWidth/2.32);
            $('#course').html(`<ul id="badges" class="nav nav-pills" role="tablist"></ul>`);
            for (let i=0; i<badges.length; i++) {
                $('#badges').append(`<li role="presentation" class="active"><a href="#">${badges[i]} <span class="badge">NUM</span></a></li>`)
            }
            $('#course').append(`<div id="assignments">Assignments</div>`);
            $('#course').append(`<div id="recentContent"></div>`);
            loadContent(courseInfo);
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
}

function displayCachedTopics(courseInfo) {
    $('#recentContent').append('<div id="recentView"></div>')
    $('#recentContent').children('#recentView').append('<h4>Recently viewed</h4>')
    if (topicsCache[courseInfo.courseId]) { // If there are any available links for this org unit
        topicsCache[courseInfo.courseId].forEach(function (historyItem) {
            $('#recentContent').children('#recentView').append(`<a href="${historyItem.url}" target="_blank">${historyItem.title}</a> <br/>`)
        })
    } else { // else display no recently visited topics message
        $('#recentContent').children('#recentView').append("<p> No recently viewed links from this course </p>")
    }
}

function loadContent(courseInfo) {
    if (!topicsCache) { // If topics cache has not been made then make it
        topicsCache = {}
        chrome.history.search({text: ''}, function (data) {
            data.filter(function (item) {
                return ~item.url.indexOf(endpoint) && ~item.url.indexOf('viewContent')
            }).forEach(function (historyItem) {
                // In le version, the URL for viewed content looks similar to the example below
                // https://d2llabs.desire2learn.com/d2l/le/content/8432/viewContent/1055235/View
                // So by splitting on the '/' character, we can obtain the org unit
                // by looking at the 6th index of the resulting array
                orgUnit = historyItem.url.split('/')[6];
                if (topicsCache[orgUnit]) {
                    topicsCache[orgUnit].push(historyItem)
                } else {
                    topicsCache[orgUnit] = [historyItem]
                }
            })
            displayCachedTopics(courseInfo)
        })
    } else {
        displayCachedTopics(courseInfo)
    }
    /*
    $.ajax({
        url: `${endpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/content/toc`,
        dataType: "json",
        success: function(data) {
            let modules = data.Modules;
            for (let i=0; i<modules.length; i++) {
                $('#modules').append(`<button id="${i}">${modules[i].Title}</button>`);
            }
            if (modules.length === 0) {
                $('#modules').html('There are no modules in this course.');
            }
            else {
                $('button').click(function() {
                    let moduleId = $(this).attr('id');
                    loadTopics(courseInfo, modules[moduleId]);
                    functions.push(loadModules);
                    currentState++;
                });
            }
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
    */
}

function loadAnnouncements(courseInfo) {
    showDiv('announcements');
    $('#title').html(courseInfo.courseName);
    $('#title').attr('href', `${endpoint}/d2l/lms/news/main.d2l?ou=${courseInfo.courseId}`);
    $.ajax({
        url: `${endpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/news/`,
        dataType: "json",
        success: function(announcements) {
            for (let i=0; i<announcements.length; i++) {
                let url = `${endpoint}/d2l/le/news/${courseInfo.courseId}/${announcements[i].Id}/view`
                $('#announcements').append(`<a href="${url}" target="_blank">${announcements[i].Title}</a>`);
            }
            if (announcements.length === 0) {
                $('#announcements').html('There are no announcements in this course.');
            }
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadGrades(courseInfo) {
    showDiv('grades');
    $('#title').html(courseInfo.courseName);
    $.ajax({
        url: `${endpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/grades/values/myGradeValues/`,
        dataType: "json",
        success: function(grades) {
            for (let i=0; i<grades.length; i++) {
                $('#grades').append(`<h4>${grades[i].GradeObjectName}: ${grades[i].DisplayedGrade}</h4>`);
            }
            if (grades.length === 0) {
                $('#grades').html('There are no grades in this course.');
            }
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadTopics(courseInfo, moduleInfo) {
    showDiv('topics');
    $('#title').html(moduleInfo.Title);
    $('#title').attr('href', `${endpoint}/d2l/le/content/${courseInfo.courseId}/Home?itemIdentifier=D2L.LE.Content.ContentObject.ModuleCO-${moduleInfo.ModuleId}`);
    let topics = moduleInfo.Topics;
    for (let i=0; i<topics.length; i++) {
        let url = topics[i].Url;
        if (!url.startsWith("http")) {
            url = `${endpoint}${url}`;
        }
        $('#topics').append(`<a href="${url}" target="_blank">${moduleInfo.Topics[i].Title}</button>`);
    }
    if (topics.length === 0) {
        $('#topics').html('There are no topics in this module.');
    }
}

function showDiv(id) {
    for (let i=0; i<divs.length; i++) {
        $(`#${divs[i]}`).hide();
        $(`#${divs[i]}`).empty();
    }
    $(`#${id}`).show();
}
