
let endpoint = 'https://d2llabs.desire2learn.com';
// let endpoint = 'https://learn.uwaterloo.ca';
let leVersion = '1.24';
let lpVersion = '1.18';
let divs = ['courses', 'modules', 'topics'];
//currentState 0-courses, 1-modules 2-topics
let currentState = 0;
let courseInfo = {};
let functions = [loadCourses, loadModules];
let pinnedOnly = true;

$(document).ready(function() {
    loadCourses();
    $('button').click(function() {
        currentState = Math.max(0, currentState-1);
        functions[currentState](courseInfo);
    });
});

function loadCourses() {
    showDiv('courses');
    $('#back').hide();
    $.ajax({
        url: `${endpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/?OrgUnitTypeId=1,3&sortBy=-PinDate`,
        dataType: "json",
        success: function(data) {
            let courses = data.Items;
            for (let i=0; i<courses.length; i++) {
                if (!pinnedOnly || courses[i].PinDate) {
                    $('#courses').append(`<button id="${courses[i].OrgUnit.Id}">${courses[i].OrgUnit.Name}</button>`);
                }
                if (courses[i].OrgUnit.Type.Id === 1) {
                    $('#title').html('Home');
                    $('#title').attr('href', courses[i].OrgUnit.HomeUrl);
                }
            }
            $('button').click(function() {
                let courseId = $(this).attr('id');
                if (!courseId.startsWith("back")) {
                    let courseName = $(this).html();
                    courseInfo = {courseId, courseName};
                    loadModules(courseInfo);
                    currentState++;
                }
            });
        },
        error: function (e) {
            $('#courses').html(`<a href="https://d2llabs.desire2learn.com/d2l/login" target="_blank">Could not login. Click here to log in.</a>`);
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadModules(courseInfo) {
    showDiv('modules');
    $('#back').show();
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
            $('button').click(function() {
                let moduleId = $(this).attr('id');
                if (!moduleId.startsWith("back")) {
                    loadTopics(courseInfo.courseId, modules[moduleId]);
                    currentState++;
                }
            });
        },
        error: function (e) {
            console.log("Error: Not a valid URL.");
        }
    });
}

function loadTopics(courseId, moduleInfo) {
    showDiv('topics');
    $('#back').show();
    $('#title').html(`<h3>${moduleInfo.Title}</h3>`);
    $('#title').attr('href', `${endpoint}/d2l/le/content/${courseId}/Home?itemIdentifier=D2L.LE.Content.ContentObject.ModuleCO-${moduleInfo.ModuleId}`);
    let topics = moduleInfo.Topics;
    for (let i=0; i<topics.length; i++) {
        let url = topics[i].Url;
        if (!url.startsWith("http")) {
            url = `${endpoint}${url}`;
        }
        $('#topics').append(`<a href="${url}" target="_blank">${moduleInfo.Topics[i].Title}</button>`);
    }
}

function showDiv(id) {
    for (let i=0; i<divs.length; i++) {
        $(`#${divs[i]}`).hide();
        $(`#${divs[i]}`).empty();
    }
    $(`#${id}`).show();
}
