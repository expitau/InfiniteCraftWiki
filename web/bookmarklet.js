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

/* Redirect the user to infinite craft if they are not there already */
if (window.location.href != "https://neal.fun/infinite-craft/") {
   window.location.href = "https://neal.fun/infinite-craft/";
} else if (!top.hasOwnProperty('addOnCreated')) {
   /* Append iframe is user is on infinite craft */
   createIframeWithAccess();
   top.addOnCreated = true;
}