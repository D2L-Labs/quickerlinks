chrome.omnibox.onInputChanged.addListener(
    function(text, suggest) {
    //   text = text.split(' ')
    //   if (text[1] == "0") {
    //       suggest([{content: "https://d2llabs.desire2learn.com/d2l/home", description: "Home page"}])
    //   } else {
    //       suggest([
    //           {content: "https://d2llabs.desire2learn.com/d2l/home", description: "Home page"},
    //           {content: "https://d2l.com", description: "D2L website"}
    //       ]);
    //   }
});

chrome.omnibox.onInputEntered.addListener(
    function(text) {
    //
    // let newTabProperties = {
    //     url: text,
    //     active: true
    // }
    // chrome.tabs.create(newTabProperties)
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
