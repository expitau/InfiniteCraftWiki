const fs = require('fs');

const LOAD_FILE = 'web/data/data.json'
const SAVE_FILE = 'web/data/data.json'

function toBase64(n) {
    n = n + 1
    let base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-='
    let result = ''
    while (n > 0) {
        result = base64[n % 64] + result
        n = Math.floor(n / 64)
    }
    return result
}

function compress(data) {
    console.log("Compressing...")
    let index = Object.keys(data.costs).sort((a, b) => data.costs[a] - data.costs[b]).filter(x => x != "Nothing").map((a, i) => [toBase64(i), [data.icons[a], a, data.costs[a]]])
    let forward = { ...Object.fromEntries(index), "A": ["", "Nothing", 0] }
    let reverse = Object.fromEntries(Object.entries(forward).map(x => [x[1][1], x[0]]))
    let comp = data.attempted.sort((a, b) => data.costs[a[2]] - data.costs[b[2]]).map(recipe => {
        return [reverse[recipe[0]], reverse[recipe[1]], reverse[recipe[2]]].join(',')
    }).join(';')
    return { index: forward, data: comp }
}

function uncompress(data) {
    out = {}
    out.attempted = data.data.split(';').map(x => x.split(',').map(y => data.index[y])).map(x => { return [x[0][1], x[1][1], x[2][1]] })
    out.icons = Object.fromEntries(Object.entries(data.index).map(([a, b]) => [b[1], b[0]]))
    out.costs = Object.fromEntries(Object.entries(data.index).map(([a, b]) => [b[1], b[2]]))
    return out
}

function getCosts(data) {
    console.log("Generating costs...")
    let costs = { "Water": 1, "Fire": 1, "Wind": 1, "Earth": 1 }

    let completed = false;
    while (!completed) {
        completed = true;
        for (recipe of data.attempted) {
            if (recipe[2] == "Nothing" || recipe[0] == "Nothing" || recipe[1] == "Nothing") {
            } else if (costs[recipe[0]] == null || costs[recipe[1]] == null) {
                // console.log("Processing", recipe)
                // console.log("Missing cost for", recipe[0], "or", recipe[1])
                completed = false;
            } else if (!costs[recipe[2]]) {
                // console.log("Processing", recipe)
                // console.log("Set cost for", recipe[2], "to", costs[recipe[0]] + costs[recipe[1]], "(didn't exist)")
                costs[recipe[2]] = costs[recipe[0]] + costs[recipe[1]]
                completed = false;
            } else if (costs[recipe[2]] > costs[recipe[0]] + costs[recipe[1]]) {
                // console.log("Processing", recipe)
                // console.log("Set cost for", recipe[2], "to", costs[recipe[0]] + costs[recipe[1]], `(${costs[recipe[2]]} was higher)`)
                costs[recipe[2]] = costs[recipe[0]] + costs[recipe[1]]
                completed = false;
            }
        }
    }
    return Object.fromEntries(Object.entries(costs).sort(([, a], [, b]) => a - b))
}


function save(attempted, icons) {
    try {
        data = { attempted, icons }

        data.costs = getCosts(data)

        fs.writeFileSync(SAVE_FILE, JSON.stringify(compress(data)), 'utf8');
        console.log(`${attempted.length} entries written to file`);
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

function load() {
    let data
    try {
        const file = fs.readFileSync(LOAD_FILE, 'utf8');
        data = uncompress(JSON.parse(file));
    } catch (e) {
        console.error(e)
        let attempted = []
        let icons = { "Water": "💧", "Fire": "🔥", "Wind": "🌬️", "Earth": "🌍" }
        let costs = { "Water": 1, "Fire": 1, "Wind": 1, "Earth": 1 }
        data = { attempted, costs, icons }
    }
    console.log(`${data.attempted.length} entries read from file`)
    return data
}

module.exports = { compress, uncompress, getCosts, save, load }
