chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
    suggest([
        {content: `${localStorage["quickerLinks.domain"]}/d2l/lp/configVariableBrowser`, description: "Config Variable Browser"},
        {content: `${localStorage["quickerLinks.domain"]}/d2l/lp/manageUsers/main.d2l?ou=${localStorage["quickerLinks.domainId"]}`, description: "Users"},
        {content: `${localStorage["quickerLinks.domain"]}/d2l/logging`, description: "System Logs"}
    ]);
});

chrome.omnibox.onInputEntered.addListener(function (command) {
    if (localStorage["quickerLinks.isAdmin"] === 'true') {
        if (command === 'config') {
          chrome.tabs.update({ url: `${localStorage["quickerLinks.domain"]}/d2l/lp/configVariableBrowser` });
        }
        else if (command === 'users') {
          chrome.tabs.update({ url: `${localStorage["quickerLinks.domain"]}/d2l/lp/manageUsers/main.d2l?ou=${localStorage["quickerLinks.domainId"]}` });
        }
        else if (command === 'sel') {
          chrome.tabs.update({ url: `${localStorage["quickerLinks.domain"]}/d2l/logging` });
        }
    }
    else {
        alert(`Access denied. Not an admin for ${endpoint}`);
    }
});
