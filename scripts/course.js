let endpoint = localStorage["quickerLinks.domain"];
let leVersion = '1.24';
let lpVersion = '1.20';
let topicsCache = null;

$(document).ready(function() {
    // location = new URL(window.location);
    let nameStart = window.location.search.indexOf('name');
    let courseStart = window.location.search.indexOf('ou')
    let courseId = window.location.search.substring(courseStart + 3, nameStart - 1);
    let courseName = window.location.search.substring(nameStart + 5).replace(new RegExp('%20', 'g'), ' ')
    let courseInfo = {courseId, courseName}
    $(".dropdown-item").attr('href', `${endpoint}/d2l/home/${courseId}`)
    loadCourse(courseInfo)
    $('#back').click(function() {
        window.location.href = 'home.html'
    });
});


function loadCourse(courseInfo) {
    $.ajax({
        url: `${endpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/${courseInfo.courseId}`,
        dataType: "json",
        success: function(data) {
            $('#title').html(courseInfo.courseName);
            $('#title').attr('href', `${endpoint}/d2l/home/${courseInfo.courseId}`);
            let image = data.OrgUnit.ImageUrl || "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png";
            // $('#courseHeader').css('background-image', `url("${image}")`);
            $('#courseHeader').css('width', window.innerWidth);
            $('#courseHeader').css('height', window.innerWidth/3);
            $('#courseHeader').css('background', `linear-gradient(rgba(0, 0, 0, 0), #000 250px), url("${image}")`);
            $('#courseHeader').css('background-position', 'center');
            loadUpdates(courseInfo);
            loadSubmissions(courseInfo);
            loadContent(courseInfo);
            $('#courseHeader').hover(function() {
                $(this).parent().parent().find('.ellipses').addClass('ellipsesHover');
            }, function() {
                $(this).parent().parent().find('.ellipses').removeClass('ellipsesHover');
            });
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadContent(courseInfo) {
    if (!topicsCache) { // If topics cache has not been made then make it
        topicsCache = {}
        chrome.history.search({text: 'd2l'}, function (data) {
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
}


function displayCachedTopics(courseInfo) {
    $('#recentContent').append('<div id="recentView"></div>')
    if (topicsCache[courseInfo.courseId]) { // If there are any available links for this org unit
        topicsCache[courseInfo.courseId].forEach(function (historyItem) {
            $('#recentContent').children('#recentView').append(`<div class="contentItem"><a href="${historyItem.url}" target="_blank">${historyItem.title}</a></div>`)
        })
    } else { // else display no recently visited topics message
        $('#recentContent').children('#recentView').append(`<div class="contentItem">No recently viewed links from this course</div>`);
    }
}

function loadUpdates(courseInfo) {
    $.ajax({
        url: `${endpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/updates/myUpdates`,
        dataType: "json",
        success: function(data) {
            let badgeNums = [data.UnreadDiscussions, data.UnreadAssignmentFeedback, data.UnattemptedQuizzes]
            $('#course').prepend(`<ul id="badges" class="nav nav-pills"></ul>`);
            $('#badges').append(`<li><a id="badge-0" class="badges" href="${endpoint}/d2l/le/${courseInfo.courseId}/discussions/List" target="_blank" >Discussions </a></li>`);
            $('#badges').append(`<li><a id="badge-1" class="badges" href="${endpoint}/d2l/lms/dropbox/dropbox.d2l?ou=${courseInfo.courseId}" target="_blank" >Assignments </a></li>`);
            $('#badges').append(`<li><a id="badge-2" class="badges" href="${endpoint}/d2l/lms/quizzing/user/quizzes_list.d2l?ou=${courseInfo.courseId}" target="_blank" >Quizzes </a></li>`);
            $('#badges').append(`<li><a id="badge-3" class="badges" href="${endpoint}/d2l/lms/grades/my_grades/main.d2l?ou=${courseInfo.courseId}" target="_blank" >Grades</a></li>`);

            let updateCount, updateDisplay;
            for (let i=0; i<badgeNums.length; i++) {
                updateCount = badgeNums[i];
                updateDisplay = '';
                if (updateCount > 0) {
                    updateDisplay = (updateCount <= 99) ? updateCount : '99+';
                    $(`#badge-${i}`).append(`<span class="notification">${updateDisplay}</span>`)
                }
            }
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadSubmissions(courseInfo) {
    $.ajax({
        url: `${endpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/dropbox/folders/`,
        dataType: "json",
        success: function(folders) {
            let foundAssignments = false;
            for (let i=0; i<folders.length; i++) {
                //null duedates excluded
                if (folders[i].DueDate) {
                    let diff = diffDate(new Date(), new Date(folders[i].DueDate))
                    if (diff < localStorage["quickerLinks.dropboxFutureDays"] && diff > -1*localStorage["quickerLinks.dropboxPastDays"]) {
                        $('#assignments').append(`<div class="contentItem"><a href="${endpoint}/d2l/lms/dropbox/user/folder_submit_files.d2l?db=${folders[i].Id}&ou=${courseInfo.courseId}" target="_blank">${folders[i].Name}</a></div>`)
                        foundAssignments = true;
                    }
                }
            }
            if (!foundAssignments) {
                $('#assignments').append(`<div class="contentItem">No assignments found in specified date range.</div>`)
            }
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
}

function diffDate(date1, date2) {
    return Math.round((date2.getTime() - date1.getTime())/86400000);
}
