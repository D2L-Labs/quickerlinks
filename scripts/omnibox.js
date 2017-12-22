let commandTrie = {
    children: {},
    suggestion: null
}
let trieInitialized = false;

function insertSuggestion(trie, toInsert) {
    let cmd = toInsert.command;
    let suggestion = toInsert.suggestion
    let trieNode = trie;
    for (letter of cmd) {
        if (trieNode.children[letter]) {
            trieNode = trieNode.children[letter]
        } else {
            trieNode.children[letter] = { children: {}, suggestion: null }
            trieNode = trieNode.children[letter]
        }
    }
    trieNode.suggestion = suggestion
}

function getSuggestions(trie, command) {
    let suggestions = []
    let trieNode = trie;

    // Search for lowest common ancestor
    for (letter of command) {
        trieNode = trieNode.children[letter]
        if (!trieNode) {
            return suggestions;
        }
    }
    // Take all paths from this ancestor.
    getAllChildrenSuggestions(trieNode, suggestions)
    return suggestions;
}

function getAllChildrenSuggestions(trieNode, suggestions) {
    if (trieNode.suggestion) suggestions.push(trieNode.suggestion)

    for (key in trieNode.children ) {
        getAllChildrenSuggestions(trieNode.children[key], suggestions)
    }
}


function initTrie() {
    let orgUnitId = localStorage["quickerLinks.orgUnitId"];
    let domain = localStorage["quickerLinks.domain"];

    insertSuggestion(commandTrie, {
        command: "home",
        suggestion: {
            content: `${domain}/d2l/home`,
            description: 'Your home page'
        }
    })

    insertSuggestion(commandTrie, {
        command: "users",
        suggestion: {
            content: `${domain}/d2l/lp/manageUsers/main.d2l?ou=${orgUnitId}`,
            description: 'Manage the users'
        }
    });

    insertSuggestion(commandTrie, {
        command: "sel",
        suggestion: {
            content: `${domain}/d2l/logging`,
            description: 'System error log'
        }
    });

    insertSuggestion(commandTrie, {
        command: "config",
        suggestion: {
            content: `${domain}/d2l/lp/configVariableBrowser`,
            description: 'Config variable browser'
        }
    });
}

chrome.omnibox.onInputStarted.addListener( function() {
    if (!trieInitialized) {
        initTrie();
        trieInitialized = true;
    }
});

chrome.omnibox.onInputChanged.addListener( function(text, suggest) {
    // suggest([
    //     {content: `${domain}/d2l/lp/configVariableBrowser`, description: "Config Variable Browser"},
    //     {content: `${domain}/d2l/lp/manageUsers/main.d2l?ou=${orgUnitId}`, description: "Users"},
    //     {content: `${domain}/d2l/logging`, description: "System Logs"}
    // ]);
    sg = getSuggestions(commandTrie, text)
    suggest(sg)
});

chrome.omnibox.onInputEntered.addListener (function(command) {
    let url = ''
    let orgUnitId = localStorage["quickerLinks.orgUnitId"];
    let domain = localStorage["quickerLinks.domain"];
    if (localStorage["quickerLinks.isAdmin"] === 'true') {
        if (command === 'config') {
            url =  `${domain}/d2l/lp/configVariableBrowser`
        }
        else if (command === 'users') {
            url = `${domain}/d2l/lp/manageUsers/main.d2l?ou=${orgUnitId}`;
        }
        else if (command === 'sel') {
            url = `${domain}/d2l/logging`;
        }
        else if (command.startsWith('http')) {
            url = command;
        }
        else {
            alert('No matching command.');
        }
    }
    else {
        alert(`Access denied. Not an admin for ${endpoint}`);
    }
    if (url) {
        chrome.tabs.update({url});
    }
});
