

let alertTimer;
let alertAnimation;

function myAlertBottom(){
  const alert = document.querySelector('.myAlert-bottom');
  clearTimeout(alertTimer);
  if (alertAnimation) alertAnimation.cancel();
  alert.hidden = false;
  alertAnimation = alert.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
  alertTimer = setTimeout(() => {
    alertAnimation = alert.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600 });
    alertAnimation.onfinish = () => { alert.hidden = true; };
  }, 2000);
}

function displayAdminMessage() {
  document.querySelector('#isAdminMsg')?.remove();
  let isAdmin = localStorage[quickerLinksSettings.isAdmin.name] === 'true';
  if( isAdmin ) {
    document.querySelector('#domain').insertAdjacentHTML('beforeend', '<span id="isAdminMsg" class="text-info">You are an admin for this site.</span>');
  }
}

function displayErrorMessage() {
  document.querySelector('#isAdminMsg')?.remove();
  document.querySelector('#domain').insertAdjacentHTML('beforeend', '<span id="isAdminMsg" class="text-danger">Error with domain specified.</span>');
}


function saveDomain() {
    myAlertBottom();
    let domain = document.querySelector('#domainInput').value;
    if (domain && !domain.startsWith('http')) {
      domain = "https://" + domain;
    }
    localStorage[quickerLinksSettings.domain.name] = domain;
    localStorage[quickerLinksSettings.isAdmin.name] = undefined;
    document.querySelector('#domainButton').classList.remove('btn-primary');

    checkIfAdmin( displayAdminMessage, displayErrorMessage );
}

document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.querySelector('#domainInput');
  const domainButton = document.querySelector('#domainButton');
  const pinnedCourses = document.querySelector('#pinnedCourses');
  const pastRangeInput = document.querySelector('#pastRangeInput');
  const futureRangeInput = document.querySelector('#futureRangeInput');
  if (localStorage[quickerLinksSettings.domain.name]) {
    domainInput.value = localStorage[quickerLinksSettings.domain.name];
  } else {
    domainInput.placeholder = 'No domain set.';
  }
  domainInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveDomain();
      domainInput.blur();
    }
  });
  domainInput.addEventListener('input', () => domainButton.classList.add('btn-primary'));
  domainButton.addEventListener('click', saveDomain);

  displayAdminMessage();  

  let pinnedOnly = (localStorage[quickerLinksSettings.pinnedOnly.name] === 'true');
  if (pinnedOnly) {
    pinnedCourses.checked = true;
  }  else {
    document.querySelector('#allCourses').checked = true;
  }
  
  document.querySelectorAll('input[name=coursesVisibility]').forEach(input => {
    input.addEventListener('change', () => {
      let newPinnedOnly = pinnedCourses.checked;
      localStorage[quickerLinksSettings.pinnedOnly.name] = newPinnedOnly;
      myAlertBottom();
    });
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
    pastRangeInput.add(new Option(pastDays, i));
    if (i !== 0) {
      futureRangeInput.add(new Option(futureDays, i));
    }
  }
  if (localStorage[quickerLinksSettings.dropboxPastDays.name] !== undefined) {
    pastRangeInput.value = localStorage[quickerLinksSettings.dropboxPastDays.name];
  }
  if (localStorage[quickerLinksSettings.dropboxFutureDays.name] !== undefined) {
    futureRangeInput.value = localStorage[quickerLinksSettings.dropboxFutureDays.name];
  }
  pastRangeInput.addEventListener('change', () => {
    localStorage[quickerLinksSettings.dropboxPastDays.name] = pastRangeInput.value || localStorage[quickerLinksSettings.dropboxPastDays.name];
    myAlertBottom();
  });
  futureRangeInput.addEventListener('change', () => {
    localStorage[quickerLinksSettings.dropboxFutureDays.name] = futureRangeInput.value || localStorage[quickerLinksSettings.dropboxFutureDays.name];
    myAlertBottom();
  });
});
