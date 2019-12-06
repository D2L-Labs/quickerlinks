let commandTrie = {
    children: {},
    suggestion: null
}
let trieInitialized = false;

let standardCommands = [
  { name: 'home', url: '/d2l/home', description: '<match>home</match> - Go to your home page'}
];

let adminCommands = [
  { name: 'users', url: '/d2l/lp/manageUsers/main.d2l', description: '<match>users</match> - Go to Manage Users'},
  { name: 'syslog', url: '/d2l/logging', description: '<match>syslog</match> - Go to the System Log'},
  { name: 'cvb', url: '/d2l/lp/configVariableBrowser', description: '<match>cvb</match> - Go to the Config Variable Browser'}
];

function insertSuggestion(trie, toInsert) {
  let cmd = toInsert.command;
  let suggestion = toInsert.suggestion;
  let trieNode = trie;
  for (letter of cmd) {
    if (trieNode.children[letter]) {
      trieNode = trieNode.children[letter];
    } else {
      trieNode.children[letter] = { children: {}, suggestion: null };
      trieNode = trieNode.children[letter];
    }
  }
  trieNode.suggestion = suggestion;
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

  for (key in trieNode.children) {
    getAllChildrenSuggestions(trieNode.children[key], suggestions)
  }
}


function initTrie() {
  let domain = localStorage[quickerLinksSettings.domain.name];
  let aCommands, command;

  let isAdmin = localStorage[quickerLinksSettings.isAdmin.name] === 'true';

  aCommands = standardCommands.concat( (isAdmin) ? adminCommands : [] );

  for( let i=0; i<aCommands.length; i++ ) {
    command = aCommands[i];
    insertSuggestion(commandTrie, {
      command: command.name,
      suggestion: {
        content: `${command.name}`,
        description: command.description
      }
    });
  }

  chrome.omnibox.setDefaultSuggestion({description:`<dim>QuickerLinks - getting you to where you are going, quicker than quick.</dim>`});
}

chrome.omnibox.onInputStarted.addListener(function() {
  if (!trieInitialized) {
    initTrie();
    trieInitialized = true;
  }
});

chrome.omnibox.onInputChanged.addListener( (text, suggest) => {
  suggest(getSuggestions(commandTrie, text));
});

chrome.omnibox.onInputEntered.addListener( (inCommand) => {
  let domain = localStorage[quickerLinksSettings.domain.name];
  let aCommands, command, url;

  let isAdmin = localStorage[quickerLinksSettings.isAdmin.name] === 'true';
  aCommands = standardCommands.concat( (isAdmin) ? adminCommands : [] );

  for( let i=0; i<aCommands.length; i++ ) {
    command = aCommands[i];
    if( command.name == inCommand ) {
      url = `${domain}${command.url}`;
      break;
    }
  }

  if( url ) {
    chrome.tabs.update({url});
  } else {
    console.log('No matching command available.');
  }
});
