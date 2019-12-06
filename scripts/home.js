let homeEndpoint = localStorage[quickerLinksSettings.domain.name];

$(document).ready(function() {
  if (!homeEndpoint) {
    inferEndpointFromTabs();
  } else {
    loadCourses();
  }
  
  checkIfAdmin();
});

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
      $.ajax({
        url: `${homeEndpoint}/d2l/api/lp/${lpVersion}/users/whoami`,
        success: (response) => {
          loadCourses();
        },
        error: () => {
          $('#home').html(`<div class="panel panel-warning"><div class="panel-heading">Cannot find Brightspace</div><div class="panel-body">No domain has been set yet. <a href="settings.html">Click here</a> to change your settings, or log in to your Brightspace site in a new tab.</div></div>`);
        }
      });
    });
}

function loadCourses() {
    $('#title').attr('href', `${homeEndpoint}/d2l/home`);
    $.ajax({
      url: `${homeEndpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/?OrgUnitTypeId=1,3&sortBy=-PinDate`,
      dataType: "json",
      success: (data) => {
        let courses = data.Items;
        let orgName = courses.filter(course => course.OrgUnit.Type.Id === 1)[0].OrgUnit.Name;
        $('#title').html(orgName);

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

          $('#home').html(`<div class="panel panel-success"><div class="panel-heading">${panelHeading}</div><div class="panel-body">${panelBody}</div></div>`);
        }
        
        let numRows = displayCourses.length / 2 + 1;

            // Two courses take up one row.
            for (var i = 0; i < numRows; i++) {
                $("#home").append("<div class=\"row\"></div>")
            }
            // Appends two cols of width 6 to every row.
            $(".row").append("<div class=\"col-xs-6\"> </div>")
            $(".row").append("<div class=\"col-xs-6\"> </div>")

            // Append course to every column
            $(".col-xs-6").each(function (index) {
                if (index >= displayCourses.length) return;

                let currentCourse = displayCourses[index].OrgUnit;
                let image = currentCourse.ImageUrl || "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png";
                let title = currentCourse.Name;
                let id = currentCourse.Id;

                if (!image) {
                    // Set to default
                    image = "https://d2q79iu7y748jz.cloudfront.net/s/_logo/2b6d922805d2214befee400b8bb5de7f.png"
                }
                $(this).append(`<div class="courseInfo">
                                    <div class="dropdown show">
                                        <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <div class="ellipses">
                                            <svg viewBox="0 0 18 18" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 80%; height: 80%;">
                                            <g class="style-scope d2l-icon">
                                                <path d="M2,7 C0.895,7 0,7.895 0,9 C0,10.105 0.895,11 2,11 C3.105,11 4,10.105 4,9 C4,7.895 3.105,7 2,7 Z M16,7 C14.895,7 14,7.895 14,9 C14,10.105 14.895,11 16,11 C17.105,11 18,10.105 18,9 C18,7.895 17.105,7 16,7 Z M9,7 C7.895,7 7,7.895 7,9 C7,10.105 7.895,11 9,11 C10.105,11 11,10.105 11,9 C11,7.895 10.105,7 9,7 Z">
                                                </path>
                                            </g>
                                            </svg>
                                        </div>
                                        </a>
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
                let updateParent = $(this).children('div').children('.extLink');
                $.ajax({
                    url: `${homeEndpoint}/d2l/api/le/${leVersion}/${id}/updates/myUpdates`,
                    success: function (d) {
                        let updatesCount = d.UnreadDiscussions + d.UnattemptedQuizzes + d.UnreadAssignmentFeedback
                        if (updatesCount) {
                            if (updatesCount > 99) updatesCount = '99+'

                            $(updateParent).append(`<span class="notification">${updatesCount}</span>`)
                        }
                    },
                    error: function (e) {
                         console.log(e)
                        console.log('There was an error when retrieving the data')
                    }
                });
            })
            $('.courseImage').hover(function() {
                $(this).parent().parent().find('.ellipses').addClass('ellipsesHover');
            }, function() {
                $(this).parent().parent().find('.ellipses').removeClass('ellipsesHover');
            });
        },
        error: function (e) {
            $('#home').html(`<div class="panel panel-info"><div class="panel-heading">Not logged in</div><div class="panel-body"><a href="${homeEndpoint}/d2l/login" target="_blank">Click here</a> to go to your Brightspace site and log in.</div></div>`);
            console.log("Error: Not a valid URL.");
        }
    });
}
