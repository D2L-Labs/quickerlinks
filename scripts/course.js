let courseEndpoint = localStorage[quickerLinksSettings.domain.name];
let topicsCache = null;

document.addEventListener('DOMContentLoaded', function() {
  // location = new URL(window.location);
  let nameStart = window.location.search.indexOf('name');
  let courseStart = window.location.search.indexOf('ou')
  let courseId = window.location.search.substring(courseStart + 3, nameStart - 1);
  let courseName = window.location.search.substring(nameStart + 5).replace(new RegExp('%20', 'g'), ' ')
  let courseInfo = {courseId, courseName}
  document.querySelectorAll('.dropdown-item').forEach(link => {
    link.href = `${courseEndpoint}/d2l/home/${courseId}`;
  });
  loadCourse(courseInfo)
  document.querySelector('#back').addEventListener('click', function() {
    window.location.href = 'home.html'
  });
});


function loadCourse(courseInfo) {
  fetchJson(`${courseEndpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/${courseInfo.courseId}`)
    .then(function(data) {
      const title = document.querySelector('#title');
      title.textContent = courseInfo.courseName;
      title.href = `${courseEndpoint}/d2l/home/${courseInfo.courseId}`;
      let image = "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png";
      if( data && data.OrgUnit ) {
        image = (data.OrgUnit.ImageUrl)?data.OrgUnit.ImageUrl:image;
      }
      const header = document.querySelector('#courseHeader');
      header.style.background = `linear-gradient(rgba(0, 0, 0, 0), #000 250px), url("${image}")`;
      header.style.backgroundPosition = 'center';
      loadUpdates(courseInfo);
      loadSubmissions(courseInfo);
      loadContent(courseInfo);
    })
    .catch(function () {
      console.log("Error: Not a valid URL.");
    });
}

function loadContent(courseInfo) {
  if (!topicsCache) { // If topics cache has not been made then make it
    topicsCache = {}
    chrome.history.search({text: 'd2l'}, function (data) {
      data.filter(function (item) {
        return ( item.url.indexOf(courseEndpoint) >=0 ) && (( item.url.indexOf('viewContent') >= 0 ) || ( item.url.indexOf('/d2l/le/lessons/') >= 0 ));
      }).forEach(function (historyItem) {
        // In le version, the URL for viewed content looks similar to the example below
        // https://{domain}/d2l/le/content/{orgUnitId}/viewContent/{topicId}/View
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
  const recentContent = document.querySelector('#recentContent');
  recentContent.insertAdjacentHTML('beforeend', '<div id="recentView"></div>');
  const recentView = recentContent.querySelector('#recentView');
  if (topicsCache[courseInfo.courseId]) { // If there are any available links for this org unit
    recentView.insertAdjacentHTML('beforeend', '<div id="recentViewList" class="list-group"></div>');
    topicsCache[courseInfo.courseId].forEach(function (historyItem) {
      document.querySelector('#recentViewList').insertAdjacentHTML('beforeend', `<a href="${historyItem.url}" class="list-group-item" target="_blank">${historyItem.title}</a>`);
    })
  } else { // else display no recently visited topics message
    recentView.insertAdjacentHTML('beforeend', '<div>No recently viewed links from this course</div>');
  }

  recentView.insertAdjacentHTML('beforeend', `<div class="gotoContent"><a href="${courseEndpoint}/d2l/le/content/${courseInfo.courseId}/Home" target="_blank" >Go to content</a></div>`);
}

function loadUpdates(courseInfo) {
  fetchJson(`${courseEndpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/updates/myUpdates`)
    .then(function(data) {
      let badgeNums = [data.UnreadDiscussions, data.UnreadAssignmentFeedback, data.UnattemptedQuizzes]
      document.querySelector('#course').insertAdjacentHTML('afterbegin', '<ul id="badges" class="nav nav-pills"></ul>');
      const badges = document.querySelector('#badges');
      badges.insertAdjacentHTML('beforeend', `<li><a id="badge-0" class="badges" href="${courseEndpoint}/d2l/le/${courseInfo.courseId}/discussions/List" target="_blank" >Discussions </a></li>`);
      badges.insertAdjacentHTML('beforeend', `<li><a id="badge-1" class="badges" href="${courseEndpoint}/d2l/lms/dropbox/dropbox.d2l?ou=${courseInfo.courseId}" target="_blank" >Assignments </a></li>`);
      badges.insertAdjacentHTML('beforeend', `<li><a id="badge-2" class="badges" href="${courseEndpoint}/d2l/lms/quizzing/user/quizzes_list.d2l?ou=${courseInfo.courseId}" target="_blank" >Quizzes </a></li>`);
      badges.insertAdjacentHTML('beforeend', `<li><a id="badge-3" class="badges" href="${courseEndpoint}/d2l/lms/grades/my_grades/main.d2l?ou=${courseInfo.courseId}" target="_blank" >Grades</a></li>`);

      let updateCount, updateDisplay;
      for (let i=0; i<badgeNums.length; i++) {
        updateCount = badgeNums[i];
        updateDisplay = '';
        if (updateCount > 0) {
          updateDisplay = (updateCount <= 99) ? updateCount : '99+';
          document.querySelector(`#badge-${i}`).insertAdjacentHTML('beforeend', `<span class="notification">${updateDisplay}</span>`);
        }
      }
    })
    .catch(function () {
      console.log("Error: Not a valid URL.");
    });
}

function loadSubmissions(courseInfo) {
  fetchJson(`${courseEndpoint}/d2l/api/le/${leVersion}/${courseInfo.courseId}/dropbox/folders/`)
    .then(function(folders) {
      let foundAssignments = false;
      document.querySelector('#assignments').insertAdjacentHTML('beforeend', '<div id="assignmentsView"></div>');
      const assignmentsView = document.querySelector('#assignmentsView');
      for (let i=0; i<folders.length; i++) {
        //null duedates excluded
        if (folders[i].DueDate) {
          let diff = diffDate(new Date(), new Date(folders[i].DueDate))
          if (diff < localStorage["quickerLinks.dropboxFutureDays"] && diff > -1*localStorage["quickerLinks.dropboxPastDays"]) {
            if(!foundAssignments) {
              assignmentsView.insertAdjacentHTML('beforeend', '<div id="assignmentsViewList" class="list-group"></div>');
            }
            document.querySelector('#assignmentsViewList').insertAdjacentHTML('beforeend', `<a class="list-group-item" href="${courseEndpoint}/d2l/lms/dropbox/user/folder_submit_files.d2l?db=${folders[i].Id}&ou=${courseInfo.courseId}" target="_blank">${folders[i].Name}</a>`);
            foundAssignments = true;
          }
        }
      }
      if (!foundAssignments) {
        assignmentsView.insertAdjacentHTML('beforeend', '<div>No assignments found in specified date range.</div>');
      }
    })
    .catch(function () {
      console.log("Error: Not a valid URL.");
    });
}

function diffDate(date1, date2) {
  return Math.round((date2.getTime() - date1.getTime())/86400000);
}
