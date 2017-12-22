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
    loadCourse(courseInfo)
    $('#back').click(function() {
        window.location.href = 'popup.html'
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
            $('#badges').append(`<li><a id="badge0" class="badges" href="${endpoint}/d2l/le/${courseInfo.courseId}/discussions/List" target="_blank">Discussions </a></li>`);
            $('#badges').append(`<li><a id="badge1" class="badges" href="${endpoint}/d2l/lms/dropbox/dropbox.d2l?ou=${courseInfo.courseId}" target="_blank">Assignments </a></li>`);
            $('#badges').append(`<li><a id="badge2" class="badges" href="${endpoint}/d2l/lms/quizzing/user/quizzes_list.d2l?ou=${courseInfo.courseId}" target="_blank">Quizzes </a></li>`);
            $('#badges').append(`<li><a class="badges" href="${endpoint}/d2l/lms/grades/my_grades/main.d2l?ou=${courseInfo.courseId}" target="_blank">Grades</a></li>`);

            for (let i=0; i<badgeNums.length; i++) {
                if (badgeNums[i] > 0) {
                    $(`#badge${i}`).append(`<span class="notification">${badgeNums[i]}</span>`)
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

// function loadAnnouncements(courseInfo) {
//     showDiv('announcements');
//     $('#title').html(courseInfo.courseName);
//     $('#title').attr('href', `${endpoint}/d2l/lms/news/main.d2l?ou=${courseInfo.courseId}`);
//     $.ajax({
//         url: `${endpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/news/`,
//         dataType: "json",
//         success: function(announcements) {
//             for (let i=0; i<announcements.length; i++) {
//                 let url = `${endpoint}/d2l/le/news/${courseInfo.courseId}/${announcements[i].Id}/view`
//                 $('#announcements').append(`<a href="${url}" target="_blank">${announcements[i].Title}</a>`);
//             }
//             if (announcements.length === 0) {
//                 $('#announcements').html('There are no announcements in this course.');
//             }
//         },
//         error: function (e) {
//             console.log("Error: Not a valid URL.");
//         }
//     });
// }
//
// function loadGrades(courseInfo) {
//     showDiv('grades');
//     $('#title').html(courseInfo.courseName);
//     $.ajax({
//         url: `${endpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/grades/values/myGradeValues/`,
//         dataType: "json",
//         success: function(grades) {
//             for (let i=0; i<grades.length; i++) {
//                 $('#grades').append(`<h4>${grades[i].GradeObjectName}: ${grades[i].DisplayedGrade}</h4>`);
//             }
//             if (grades.length === 0) {
//                 $('#grades').html('There are no grades in this course.');
//             }
//         },
//         error: function (e) {
//             console.log("Error: Not a valid URL.");
//         }
//     });
// }

// function loadTopics(courseInfo, moduleInfo) {
//     showDiv('topics');
//     $('#title').html(moduleInfo.Title);
//     $('#title').attr('href', `${endpoint}/d2l/le/content/${courseInfo.courseId}/Home?itemIdentifier=D2L.LE.Content.ContentObject.ModuleCO-${moduleInfo.ModuleId}`);
//     let topics = moduleInfo.Topics;
//     for (let i=0; i<topics.length; i++) {
//         let url = topics[i].Url;
//         if (!url.startsWith("http")) {
//             url = `${endpoint}${url}`;
//         }
//         $('#topics').append(`<a href="${url}" target="_blank">${moduleInfo.Topics[i].Title}</button>`);
//     }
//     if (topics.length === 0) {
//         $('#topics').html('There are no topics in this module.');
//     }
// }

function diffDate(date1, date2) {
    return Math.round((date2.getTime() - date1.getTime())/86400000);
}
