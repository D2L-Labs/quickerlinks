
let endpoint = 'https://d2llabs.desire2learn.com';
// let endpoint = 'https://learn.uwaterloo.ca';
let leVersion = '1.24';
let lpVersion = '1.18';
let divs = ['courses', 'resources', 'modules', 'topics', 'announcements', 'grades'];
let resources = ['Content', 'Announcements', 'Grades'];
let resourceFns = [loadModules, loadAnnouncements, loadGrades];
//currentState 0-courses, 1-resources, 2-modules, 3-topics
let currentState = 0;
let courseInfo = {};
let functions = [];
let pinnedOnly = true;

$(document).ready(function() {
    createDivs();
    loadCourses();
    $('button').click(function() {
        currentState = Math.max(0, currentState-1);
        functions[currentState](courseInfo);
        functions.pop();
    });
});

function createDivs() {
    for (let i=0; i<divs.length; i++) {
        $('#main').append(`<div id="${divs[i]}"></div>`);
    }
}

function loadCourses() {
    showDiv('courses');
    $('#back').html("Refresh");
    $('#title').html('Home');
    $('#title').attr('href', `${endpoint}/d2l/home`);
    $.ajax({
        url: `${endpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/?OrgUnitTypeId=3&sortBy=-PinDate`,
        dataType: "json",
        success: function(data) {
            let courses = data.Items;
            for (let i=0; i<courses.length; i++) {
                if (!pinnedOnly || courses[i].PinDate) {
                    $('#courses').append(`<button id="${courses[i].OrgUnit.Id}">${courses[i].OrgUnit.Name}</button>`);
                }
            }
            if (courses.length === 0) {
                $('#courses').html('You are not enrolled in any courses.');
            }
            else {
                $('button').click(function() {
                    let courseId = $(this).attr('id');
                    if (!courseId.startsWith("back")) {
                        let courseName = $(this).html();
                        courseInfo = {courseId, courseName};
                        loadResources(courseInfo);
                        functions.push(loadCourses);
                        currentState++;
                    }
                });
            }
        },
        error: function (e) {
            $('#courses').html(`<a href="https://d2llabs.desire2learn.com/d2l/login" target="_blank">Could not login. Click here to log in.</a>`);
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadResources(courseInfo) {
    showDiv('resources');
    $('#back').html("Back");
    $('#title').html(courseInfo.courseName);
    $('#title').attr('href', `${endpoint}/d2l/home/${courseInfo.courseId}`);
    for (let i=0; i<resources.length; i++) {
        $('#resources').append(`<button id="${i}">${resources[i]}</button>`);
    }
    $('button').click(function() {
        let resourceId = $(this).attr('id');
        if (!resourceId.startsWith("back")) {
            resourceFns[resourceId](courseInfo);
            functions.push(loadResources);
            currentState++;
        }
    });
}

function loadModules(courseInfo) {
    showDiv('modules');
    $('#back').html("Back");
    $('#title').html(courseInfo.courseName);
    $('#title').attr('href', `${endpoint}/d2l/le/content/${courseInfo.courseId}/Home`);
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
                    if (!moduleId.startsWith("back")) {
                        loadTopics(courseInfo, modules[moduleId]);
                        functions.push(loadModules);
                        currentState++;
                    }
                });
            }
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadAnnouncements() {
    showDiv('announcements');
    $('#back').html("Back");
    $('#title').html('<p>Announcements for:</p>' + courseInfo.courseName);
    $('#title').attr('href', `${endpoint}/d2l/le/content/${courseInfo.courseId}/Home`);
}

function loadGrades(courseInfo) {
    showDiv('grades');
    $('#back').html("Back");
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
    $('#back').html("Back");
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
