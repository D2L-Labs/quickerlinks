const leVersion = '1.24';
const lpVersion = '1.20';

const quickerLinksSettingsPrefix = 'quickerLinks';
const quickerLinksSettings = {
  domain: {
      name: `${quickerLinksSettingsPrefix}.domain`,
      default: null,
    },
  pinnedOnly: {
      name: `${quickerLinksSettingsPrefix}.pinnedOnly`,
      default: 'true',
    },
  courseSearchVisible: {
      name: `${quickerLinksSettingsPrefix}.courseSearchVisible`,
      default: 'false',
    },
  courseSearchQuery: {
      name: `${quickerLinksSettingsPrefix}.courseSearchQuery`,
      default: '',
    },
  dropboxPastDays: {
      name: `${quickerLinksSettingsPrefix}.dropboxPastDays`,
      default: 3,
    },
  dropboxFutureDays: {
      name: `${quickerLinksSettingsPrefix}.dropboxFutureDays`,
      default: 4,
    },
  isAdmin: {
      name: `${quickerLinksSettingsPrefix}.isAdmin`,
      default: undefined,
    },
  orgId: {
      name: `${quickerLinksSettingsPrefix}.isOrgId`,
      default: 0,
   },
}

for( setting in quickerLinksSettings ) {
  if( localStorage[setting.name] === undefined ) {
    localStorage[setting.name] = setting.default;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function checkIfAdmin(callbackSuccess, callbackError) {
  let settingsEndpoint = localStorage[quickerLinksSettings.domain.name];
  let isAdminCurrent = localStorage[quickerLinksSettings.isAdmin.name];
  if( isAdminCurrent === undefined || isAdminCurrent === 'undefined' ) {
    return fetchJson(`${settingsEndpoint}/d2l/api/lp/${lpVersion}/enrollments/myenrollments/?OrgUnitTypeId=1`)
      .then((myenrollments) => {
        localStorage[quickerLinksSettings.orgId.name] = myenrollments.Items[0].OrgUnit.Id;
        let isAdmin = false;
        if (myenrollments.Items[0].Access.LISRoles.includes("urn:lti:instrole:ims/lis/Administrator")) {
          isAdmin = true;
        }
        localStorage[quickerLinksSettings.isAdmin.name] = isAdmin;
        if(callbackSuccess) {
          callbackSuccess();
        }
      })
      .catch(() => {
        localStorage[quickerLinksSettings.isAdmin.name] = false;
        if(callbackError) {
          callbackError();
        }
      });
  }
}