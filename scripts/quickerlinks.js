let endpoint = 'https://d2llabs.desire2learn.com';
// let endpoint = 'https://learn.uwaterloo.ca';
let leVersion = '1.24';
let lpVersion = '1.20';
let divs = ['courses', 'resources', 'modules', 'topics', 'announcements', 'grades'];
let resources = ['Content', 'Announcements', 'Grades'];
let resourceFns = [loadModules, loadAnnouncements, loadGrades];
let breadcrumbs = ['Courses', 'Resources'];
//currentState 0-courses, 1-resources, 2-modules, 3-topics
let currentState = 0;
let courseInfo = {};
let functions = [];
let pinnedOnly = true;
let topicsCache = null;

$(document).ready(function() {
    createDivs();
    loadCourses();
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
    })
    $(document).on('click', '#breadcrumb li', function() {
        let newState = parseInt($(this).attr('id').substring(2));
        if (currentState !== newState) {
            $('#breadcrumb').empty();
            for (let i=0; i<newState; i++) {
                $('#breadcrumb').append(`<li id="bc${i}"><a href="#">${breadcrumbs[i]}</a></li>`);
            }
            if ($('#breadcrumb').has($('#bc1'))) {
                $('#bc1 a').html(courseInfo.courseName);
            }
            functions[newState](courseInfo);
            functions.splice(newState);
            currentState = newState;
        }
    });
});

function createDivs() {
    for (let i=0; i<divs.length; i++) {
        $('#main').append(`<div id="${divs[i]}"></div>`);
    }
}

function loadCourses() {
    showDiv('courses');
    $('#title').html('Link to Home Page');
    $('#title').attr('href', `${endpoint}/d2l/home`);
    $.ajax({
        url: `${endpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/?OrgUnitTypeId=3&sortBy=-PinDate`,
        dataType: "json",
        success: function(data) {
            let courses = data.Items;
            let numRows = courses.length / 2 + 1;

            // Two courses take up one row.
            for (var i = 0; i < numRows; i++) {
                $("#courses").append("<div class=\"row\"></div>")
            }
            $('#breadcrumb').append('<li id="bc0">Courses</li>');
            // Appends to cols of width 6 to every row.
            $(".row").append("<div class=\"col-xs-6\"> </div>")
            $(".row").append("<div class=\"col-xs-6\"> </div>")

            // Append card to every column
            $(".col-xs-6").each(function (index) {
                if (index >= courses.length) return;

                let image = courses[index].OrgUnit.ImageUrl
                let title = courses[index].OrgUnit.Name
                let id = courses[index].OrgUnit.Id

                if (!image) {
                    // Set to default
                    image = "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png"
                }
                $(this).append(`<a href="#" id="${id}"><img src="${image}" height="82" width="190"/></a>`);
                $(this).append(`<div class="extLink"><a href="#" id="${id}">${title}</a><a href="${endpoint}/d2l/le/content/${id}/Home" target="_blank"><span class="glyphicon glyphicon-new-window"></span></a></div>`);
            })
            $('a').click(function() {
               let courseId = $(this).attr('id');
               let courseName = $(this).text();
               if (!courseName) {
                   courseName = $(this).next().children(":first").text();
               }
               courseInfo = {courseId, courseName};
               loadResources(courseInfo);
               functions.push(loadCourses);
               currentState++;
           });
        },
        error: function (e) {
            $('#courses').html(`<a href="${endpoint}/d2l/login" target="_blank">Could not login. Click here to log in.</a>`);
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadResources(courseInfo) {
    showDiv('resources');
    $('#title').html(courseInfo.courseName);
    $('#title').attr('href', `${endpoint}/d2l/home/${courseInfo.courseId}`);
    for (let i=0; i<resources.length; i++) {
        $('#resources').append(`<button id="${i}">${resources[i]}</button>`);
    }
    $('button').click(function() {
        let resourceId = $(this).attr('id');
        resourceFns[resourceId](courseInfo);
        functions.push(loadResources);
        currentState++;
    });
    $('#breadcrumb').append(`<li id="bc1">${courseInfo.courseName}</li>`);
    $('#bc0').html(`<a href="#">${$('#bc0').html()}</a>`);
}

function displayCachedTopics(courseInfo) {
    $('#modules').append('<div id="recentView"></div>')
    $('#modules').children('#recentView').append('<h4>Recently viewed</h4>')
    if (topicsCache[courseInfo.courseId]) { // If there are any available links for this org unit
        topicsCache[courseInfo.courseId].forEach(function (historyItem) {
            $('#modules').children('#recentView').append(`<a href="${historyItem.url}" target="_blank">${historyItem.title}</a> <br/>`)
        })
    } else { // else display no recently visited topics message
        $('#modules').children('#recentView').append("<p> No recently viewed links from this course </p>")
    }
}

function loadModules(courseInfo) {
    showDiv('modules');
    $('#title').html(courseInfo.courseName);
    $('#title').attr('href', `${endpoint}/d2l/le/content/${courseInfo.courseId}/Home`);

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
            $('#breadcrumb').append('<li id="bc2">Modules</li>');
            $('#bc1').html(`<a href="#">${$('#bc1').html()}</a>`);
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
            $('#breadcrumb').append('<li id="bc2">Announcements</li>');
            $('#bc1').html(`<a href="#">${$('#bc1').html()}</a>`);
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
            $('#breadcrumb').append('<li id="bc2">Grades</li>');
            $('#bc1').html(`<a href="#">${$('#bc1').html()}</a>`);
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
    $('#breadcrumb').append('<li id="bc3">Topics</li>');
    $('#bc2').html(`<a href="#">${$('#bc2').html()}</a>`);
}

function showDiv(id) {
    for (let i=0; i<divs.length; i++) {
        $(`#${divs[i]}`).hide();
        $(`#${divs[i]}`).empty();
    }
    $(`#${id}`).show();
}
