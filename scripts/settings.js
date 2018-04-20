

function myAlertBottom(){
  $(".myAlert-bottom").fadeIn("slow");
  setTimeout( () => {
    $(".myAlert-bottom").fadeOut("slow"); 
  }, 2000);
}

function displayAdminMessage() {
  $('#isAdminMsg').remove();
  let isAdmin = localStorage[quickerLinksSettings.isAdmin.name] === 'true';
  if( isAdmin ) {
    $('#domain').append('<span id="isAdminMsg" class="text-info">You are an admin for this site.</span>');
  }
}

function displayErrorMessage() {
  $('#isAdminMsg').remove();
  $('#domain').append('<span id="isAdminMsg" class="text-danger">Error with domain specified.</span>');
}


function saveDomain() {
    myAlertBottom();
    let domain = $('#domainInput').val();
    if (domain && !domain.startsWith('http')) {
      domain = "https://" + domain;
    }
    localStorage[quickerLinksSettings.domain.name] = domain;
    localStorage[quickerLinksSettings.isAdmin.name] = undefined;
    $('#domainButton').removeClass('btn-primary');

    checkIfAdmin( displayAdminMessage, displayErrorMessage );
}

$(document).ready( () => {
  if (localStorage[quickerLinksSettings.domain.name]) {
    $('#domainInput').attr('value', localStorage[quickerLinksSettings.domain.name])
  } else {
    $('#domainInput').attr('placeholder', "No domain set.")
  }
  $('#domainInput').keypress( (e) => {
    let key = e.which;
    if( key == 13 ) {
      saveDomain();
      $('#domainInput').blur();
    } else {
      $('#domainButton').addClass('btn-primary');
    }
  });
  $('#domainButton').click( saveDomain );

  displayAdminMessage();  

  let pinnedOnly = (localStorage[quickerLinksSettings.pinnedOnly.name] === 'true');
  if (pinnedOnly) {
    $('#pinnedCourses').prop('checked', true);
  }  else {
    $('#allCourses').prop('checked', true);
  }
  
  $('input[name=coursesVisibility]').click( () => {
    let newPinnedOnly = $('#pinnedCourses').prop('checked');
    localStorage[quickerLinksSettings.pinnedOnly.name] = newPinnedOnly;
    myAlertBottom();
  });

  let pastDays = "", futureDays = "";
  for (let i=0; i<=7; i++) {
    if( i === 0 ) {
      pastDays = "Do not show assignments past their due date";
      futureDays = "Do not show assignments that are not yet due";
    } else if( i > 0 ) {
      pastDays = (i === 1) ? "day" : "days";
      pastDays = i + ' ' + pastDays;
      futureDays = pastDays;
    }
    $('#pastRangeInput').append(`<option id="past${i}" value="${i}">${pastDays}</option>`);
    if (i !== 0) {
      $('#futureRangeInput').append(`<option id="future${i}" value="${i}">${futureDays}</option>`);
    }
  }
  $(`#pastRangeInput #past${localStorage[quickerLinksSettings.dropboxPastDays.name]}`).attr('selected', 'selected');
  $(`#futureRangeInput #future${localStorage[quickerLinksSettings.dropboxFutureDays.name]}`).attr('selected', 'selected');
  $('#pastRangeInput').change( () => {
    localStorage[quickerLinksSettings.dropboxPastDays.name] = $('#pastRangeInput').val() || localStorage[quickerLinksSettings.dropboxPastDays.name];
    myAlertBottom();
  });
  $('#futureRangeInput').change( () => {
    localStorage[quickerLinksSettings.dropboxFutureDays.name] = $('#futureRangeInput').val() || localStorage[quickerLinksSettings.dropboxFutureDays.name];
    myAlertBottom();
  });
});
