/* Click here to redirect to infinite craft  */
function createIframeWithAccess() {
   /* Create and append the Iframe */
   var iframe = document.createElement('iframe');
   iframe.style.display = 'none';
   iframe.src = 'HELPER_URL';
   document.body.appendChild(iframe);

   /* Respond to requests for local storage from Iframe */
   window.addEventListener('message', function (event) {
      if (event.data === 'requestLocalStorage') {
         var localStorageData = localStorage.getItem('infinite-craft-data');
         event.source.postMessage(localStorageData, event.origin);
      }
   }, false);
}

function displayMessage(header, content) {
   document.body.innerHTML = `<div style="position: fixed;width: 100vw;text-align: center;height: 100vh;background-color: #191919;color: white;padding-top: 50px;font-size: 20px;font-family: "Roboto", sans-serif;"><div style=" font-weight: bold; font-size: larger;">${header}</div><br><div>${content}</div></div>`;
}

/* Redirect the user to infinite craft if they are not there already */
if (window.location.href != "https://neal.fun/infinite-craft/") {
   setTimeout(() => {
      window.location.href = "https://neal.fun/infinite-craft/";
   }, 1200);
   displayMessage('Redirecting to Infinite Craft', 'Click this Bookmarklet again once you are there to save your data!');
} else if (!top.hasOwnProperty('addOnCreated')) {
   displayMessage('Redirecting to Infinite Craft Wiki', 'Do this any time to update your elements!');
   createIframeWithAccess();
   top.addOnCreated = true;
}