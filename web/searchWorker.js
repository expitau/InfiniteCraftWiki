let chunks = {}
let numChunks = 0

let DATA_PREFIX = '/web/data'
fetch(DATA_PREFIX + '/metadata.json').then(res => res.json()).then(data => {
    numChunks = data.indexCount
    for (let i = 0; i < data.indexCount; i++) {
        fetch(DATA_PREFIX + `/index/idx-${i+1}.json`).then(res => res.json())
        .then(chunk => {
            chunks[i] = chunk
            if (Object.keys(chunks).length == numChunks) {
                isReady = true
                console.log("Search worker ready")
                process()
            }
        })
    }

})

let currentSearch = ''
let queue = 0
let isReady = false

self.addEventListener('message', async (e) => {
    currentSearch = e.data.query
    queue = 0
    process()
})

function process() {
    while (isReady && queue < numChunks) {
        chunkNumber = queue
        queue += 1
        let results = chunks[chunkNumber].filter(x => x[2].toLowerCase().includes(currentSearch.toLowerCase())).map(x => x[0])
        if (results && results.length > 0) {
            self.postMessage({ query: currentSearch, results })
        }
    }
}
