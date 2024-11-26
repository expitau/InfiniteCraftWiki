window.BOOKMARKLET_DATA = function () {
    /* Fetch metadata.json and alert if version different */
    async function checkVersion() {
        let VERSION = 2;
        let response = await fetch(`https://expitau.com/InfiniteCraftWiki/data/metadata.json`);
        let data = await response.json();
        console.log(data);
        if (data.bookmarkletVersion != VERSION) {
            alert('Bookmarklet version is outdated! Update the bookmarklet by dragging it into your bookmarks bar again from the wiki page.');
        }
    }
    /* Click here to redirect to infinite craft -> Click again to Save data to the Wiki */
    function createIframeWithAccess() {
        if (document.getElementById('IframeWithAccess') != null) {
            document.getElementById('IframeWithAccess').remove();
        }

        let iframe = document.createElement('iframe');
        iframe.id = 'IframeWithAccess';
        iframe.style.display = 'none';
        iframe.src = '$$IFRAME_PATH$$';
        document.body.appendChild(iframe);

        function sendDataToIFrame(type, data) {
            let host = new URL(iframe.src).origin;
            iframe.contentWindow.postMessage(JSON.stringify({ type: type, data: data }), host);
        }

        function processDataFromIFrame(data) {
            if (data.type == 'connected') {
                connectedMessage.style.color = "green";
                document.getElementById('connectedMessage').innerHTML = "Syncing with wiki";
            } else if (data.type == 'disconnected') {
                connectedMessage.style.color = "red";
                document.getElementById('connectedMessage').innerHTML = "Wiki connection lost - use bookmarklet to reconnect";
            }
        }
        clearInterval(window.syncInterval);
        window.syncInterval = setInterval(() => {
            var localStorageData = localStorage.getItem('infinite-craft-data');
            sendDataToIFrame('data', localStorageData);
        }, 1000);

        window.addEventListener('message', function (event) {
            if (event.source == iframe.contentWindow) {
                processDataFromIFrame(JSON.parse(event.data));
            }
        }, false);
    }

    function displayMessage(header, content) {
        document.body.innerHTML = `<div style="position: fixed;width: 100vw;text-align: center;height: 100vh;background-color: #191919;color: #c6c7c7;padding-top: 50px;font-size: 18px; font-family: "Roboto", sans-serif;"><h1 style="margin-bottom: 5px;">${header}</h1><br><div style="font-weight: bold; color: gray;">${content}</div></div>`;
    }

    /* If not currently on infinite craft game, redirect */
    if (!window.location.href.includes('neal.fun/infinite-craft')) {
        setTimeout(() => {
            window.location.href = 'https://neal.fun/infinite-craft/';
        }, 1000);
        displayMessage('Redirecting to Infinite Craft', 'Click this bookmarklet again once you are there to start syncing your data!<br>Click <a href="https://neal.fun/infinite-craft/">here</a> if you are not redirected');
        return;
    }

    checkVersion().then(() => {
        createIframeWithAccess();

        /* Reset the connection message */
        document.getElementById('connectedMessage')?.remove();
        let mainContainer = document.getElementsByClassName('container')[0];
        let connectedMessage = document.createElement('div');
        connectedMessage.id = 'connectedMessage';
        connectedMessage.style = 'margin-left: 150px; font-size: larger; margin-top: 15px;';
        connectedMessage.style.color = "green";
        connectedMessage.innerHTML = 'Syncing with Wiki';
        mainContainer.appendChild(connectedMessage);
    })
}.toString();
