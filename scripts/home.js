let homeEndpoint = localStorage[quickerLinksSettings.domain.name];
let courseColumns = [];

document.addEventListener('DOMContentLoaded', function() {
  initializeCourseSearch();
  if (!homeEndpoint) {
    inferEndpointFromTabs();
  } else {
    loadCourses();
  }
  
  checkIfAdmin();
});

function initializeCourseSearch() {
  const search = document.querySelector('#courseSearch');
  const input = document.querySelector('#courseSearchInput');
  const toggle = document.querySelector('#toggleSearch');
  search.hidden = localStorage[quickerLinksSettings.courseSearchVisible.name] !== 'true';
  input.value = localStorage[quickerLinksSettings.courseSearchQuery.name] || '';
  toggle.setAttribute('aria-expanded', String(!search.hidden));

  function updateSearch() {
    localStorage[quickerLinksSettings.courseSearchVisible.name] = String(!search.hidden);
    localStorage[quickerLinksSettings.courseSearchQuery.name] = input.value;
    toggle.setAttribute('aria-expanded', String(!search.hidden));
    filterCourses();
  }

  toggle.addEventListener('click', () => {
    search.hidden = !search.hidden;
    updateSearch();
    if (!search.hidden) input.focus();
  });
  input.addEventListener('input', updateSearch);
  document.querySelector('#cancelSearch').addEventListener('click', () => {
    input.value = '';
    search.hidden = true;
    updateSearch();
    toggle.focus();
  });
}

function filterCourses() {
  if (!courseColumns.length) return;
  const home = document.querySelector('#home');
  const search = document.querySelector('#courseSearch');
  const query = search.hidden ? '' : document.querySelector('#courseSearchInput').value.toLowerCase();
  const matches = courseColumns.filter(course => course.name.includes(query));
  home.replaceChildren();
  let row;
  matches.forEach((course, index) => {
    if (index % 2 === 0) {
      row = document.createElement('div');
      row.className = 'row';
      home.appendChild(row);
    }
    row.appendChild(course.column);
  });
  document.querySelector('#searchStatus').hidden = matches.length !== 0;
}

function inferEndpointFromTabs() {
  let getWindows = new Promise( function(resolve, reject) {
      chrome.windows.getAll( (data) => {
          resolve(data);
        });
    });

  getWindows
    .then( (windows) => {
      let getAllTabs = windows.map( (w) => {
        return new Promise( (resolve, reject) => {
          chrome.tabs.query({windowId: w.id}, (tabs) => {
            resolve(tabs)
          })
        });
      });
      return Promise.all(getAllTabs)
    })
    .then( (tabs) => {
      tabs = tabs.reduce( (a1, a2) => a1.concat(a2) ); // Flatten array
      tabs = tabs.filter( (tab) => ( tab.url.indexOf('/d2l/') >= 0 ) );
      if (tabs.length) {
        localStorage[quickerLinksSettings.domain.name] = 'https://' + tabs[0].url.split('/')[2]
      }
      homeEndpoint = localStorage[quickerLinksSettings.domain.name];
      fetchJson(`${homeEndpoint}/d2l/api/lp/${lpVersion}/users/whoami`)
        .then(() => {
          loadCourses();
        })
        .catch(() => {
          document.querySelector('#home').innerHTML = `<div class="panel panel-warning"><div class="panel-heading">Cannot find Brightspace</div><div class="panel-body">No domain has been set yet. <a href="settings.html">Click here</a> to change your settings, or log in to your Brightspace site in a new tab.</div></div>`;
        });
    });
}

function loadCourses() {
    const home = document.querySelector('#home');
    fetchJson(`${homeEndpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/?OrgUnitTypeId=1,3&sortBy=-PinDate`)
      .then((data) => {
        let courses = data.Items;

        let displayCourses;
        
        let pinnedOnly = (localStorage[quickerLinksSettings.pinnedOnly.name] === 'true');
        if( pinnedOnly ) {
          displayCourses = courses.filter(course => (course.PinDate && (course.OrgUnit.Type.Id ===3) ) );
        } else {
          displayCourses = courses.filter(course => (course.OrgUnit.Type.Id === 3));
        }

        if (displayCourses.length === 0) {
          let panelHeading, panelBody;
          if (pinnedOnly) {
            panelHeading = 'No Pinned Courses';
            panelBody = 'Go to your Brightspace site and pin some courses.';
          } else {
            panelHeading = 'No Courses';
            panelBody = 'You are not enrolled in any courses.';
          } 

          home.innerHTML = `<div class="panel panel-success"><div class="panel-heading">${panelHeading}</div><div class="panel-body">${panelBody}</div></div>`;
        }
        
        let numRows = displayCourses.length / 2 + 1;

            // Two courses take up one row.
            for (var i = 0; i < numRows; i++) {
                home.insertAdjacentHTML('beforeend', '<div class="row"></div>');
            }
            // Appends two cols of width 6 to every row.
            home.querySelectorAll('.row').forEach(row => {
              row.insertAdjacentHTML('beforeend', '<div class="col-xs-6"> </div><div class="col-xs-6"> </div>');
            });

            // Append course to every column
            home.querySelectorAll('.col-xs-6').forEach(function (column, index) {
                if (index >= displayCourses.length) return;

                let currentCourse = displayCourses[index].OrgUnit;
                let image = currentCourse.ImageUrl || "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png";
                let title = currentCourse.Name;
                let id = currentCourse.Id;

                if (!image) {
                    // Set to default
                    image = "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png"
                }
                column.insertAdjacentHTML('beforeend', `<div class="courseInfo">
                          <div class="dropdown">
                            <button class="dropdown-toggle" type="button" aria-label="Course links" aria-haspopup="true" aria-expanded="false">
                                        <div class="ellipses">
                                            <svg viewBox="0 0 18 18" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 80%; height: 80%;">
                                            <g class="style-scope d2l-icon">
                                                <path d="M2,7 C0.895,7 0,7.895 0,9 C0,10.105 0.895,11 2,11 C3.105,11 4,10.105 4,9 C4,7.895 3.105,7 2,7 Z M16,7 C14.895,7 14,7.895 14,9 C14,10.105 14.895,11 16,11 C17.105,11 18,10.105 18,9 C18,7.895 17.105,7 16,7 Z M9,7 C7.895,7 7,7.895 7,9 C7,10.105 7.895,11 9,11 C10.105,11 11,10.105 11,9 C11,7.895 10.105,7 9,7 Z">
                                                </path>
                                            </g>
                                            </svg>
                                        </div>
                                        </button>
                                        <ul class="dropdown-menu menu">
                                            <li><a class="dropdown-item" href="${homeEndpoint}/d2l/home/${id}" target="_blank">Go to course</a></li>
                                        </ul>
                                    </div>
                                    <a href="course.html?ou=${id}&name=${title}" id="${id}">
                                        <img src="${image}" height="87" width="210" class="courseImage"/>
                                    </a>
                                    <div class="extLink">
                                        <a href="course.html?ou=${id}&name=${title}" id="${id}" class="name">${title}</a>
                                    </div>
                                </div>`);
                let updateParent = column.querySelector('.extLink');
                fetchJson(`${homeEndpoint}/d2l/api/le/${leVersion}/${id}/updates/myUpdates`)
                  .then(function (data) {
                    let updatesCount = data.UnreadDiscussions + data.UnattemptedQuizzes + data.UnreadAssignmentFeedback
                        if (updatesCount) {
                            if (updatesCount > 99) updatesCount = '99+'

                            updateParent.insertAdjacentHTML('beforeend', `<span class="notification">${updatesCount}</span>`);
                        }
                    })
                    .catch(function (error) {
                      console.log(error)
                        console.log('There was an error when retrieving the data')
                    });
            });
            courseColumns = Array.from(home.querySelectorAll('.col-xs-6'))
              .filter(column => column.querySelector('.name'))
              .map(column => ({
                column,
                name: column.querySelector('.name').textContent.toLowerCase(),
              }));
            filterCourses();
              })
              .catch(function () {
                home.innerHTML = `<div class="panel panel-info"><div class="panel-heading">Not logged in</div><div class="panel-body"><a href="${homeEndpoint}/d2l/login" target="_blank">Click here</a> to go to your Brightspace site and log in.</div></div>`;
            console.log("Error: Not a valid URL.");
              });
}
