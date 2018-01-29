function myAlertBottom(){
  $(".myAlert-bottom").fadeIn("slow");
  setTimeout( () => {
    $(".myAlert-bottom").fadeOut("slow"); 
  }, 2000);
}

$(document).ready( () => {
    if (localStorage["quickerLinks.domain"]) {
      $('#domainInput').attr('value', localStorage["quickerLinks.domain"])
    }
    else {
      $('#domainInput').attr('placeholder', "No domain set.")
    }
    $('#domainInput').keypress( () => {
      $('#domainButton').addClass('btn-primary');
    });
    $('#domainButton').click( () => {
      myAlertBottom();
      let domain = $('#domainInput').val();
      if (domain && !domain.startsWith('http')) {
        domain = "https://" + domain;
      }
      localStorage["quickerLinks.domain"] = domain;
      $('#domainButton').removeClass('btn-primary');
    });

    if (localStorage["quickerLinks.pinnedOnly"] === null) {
      $('#pinnedCourses').prop('checked', true);
    }
    else {
      if (localStorage["quickerLinks.pinnedOnly"] === 'true') {
        $('#pinnedCourses').prop('checked', true);
      }
      else {
        $('#allCourses').prop('checked', true);
      }
    }
    $('input[name=coursesVisibility]').click( () => {
      localStorage.setItem("quickerLinks.pinnedOnly", ($('input[name=coursesVisibility]:checked').val() == 'true'));
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
    $(`#pastRangeInput #past${localStorage["quickerLinks.dropboxPastDays"]}`).attr('selected', 'selected');
    $(`#futureRangeInput #future${localStorage["quickerLinks.dropboxFutureDays"]}`).attr('selected', 'selected');
    $('#pastRangeInput').change( () => {
      localStorage["quickerLinks.dropboxPastDays"] = $('#pastRangeInput').val() || localStorage["quickerLinks.dropboxPastDays"];
      myAlertBottom();
    });
    $('#futureRangeInput').change( () => {
      localStorage["quickerLinks.dropboxFutureDays"] = $('#futureRangeInput').val() || localStorage["quickerLinks.dropboxFutureDays"];
      myAlertBottom();
    });
});
