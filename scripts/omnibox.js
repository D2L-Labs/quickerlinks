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
