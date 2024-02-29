const fs = require('fs');

function compareRecipes(A, B, data) {
    // console.log(A, B)
    if (data.index[A.C][1] == "Nothing")
        return 1
    if (data.index[B.C][1] == "Nothing")
        return -1

    if (data.costs[A.C] > data.costs[B.C])
        return 1
    if (data.costs[A.C] < data.costs[B.C])
        return -1

    if (data.index[A.C][1] > data.index[B.C][1])
        return 1
    if (data.index[A.C][1] < data.index[B.C][1])
        return -1

    if (data.costs[A.A] + data.costs[A.B] > data.costs[B.A] + data.costs[B.B])
        return 1
    if (data.costs[A.A] + data.costs[A.B] < data.costs[B.A] + data.costs[B.B])
        return -1

    if (data.costs[A.A] > data.costs[B.A])
        return 1
    if (data.costs[A.A] < data.costs[B.A])
        return -1

    if (data.index[A.A][1] > data.index[B.A][1])
        return 1
    if (data.index[A.A][1] < data.index[B.A][1])
        return -1

    if (data.costs[A.B] > data.costs[B.B])
        return 1
    if (data.costs[A.B] < data.costs[B.B])
        return -1

    if (data.index[A.B][1] > data.index[B.B][1])
        return 1
    if (data.index[A.B][1] < data.index[B.B][1])
        return -1

    return 0
}

function generateData(raw) {
    let data = {}
    let costs = Object.fromEntries(Object.entries(raw.index).map(x => [x[0], x[1][2]]))
    for (let recipe of raw.data.split(";").map(x => x.split(","))) {
        data[recipe[0]] ??= { from: [], to: [] }
        data[recipe[0]].to.push([recipe[1], recipe[2]])
        data[recipe[1]] ??= { from: [], to: [] }
        data[recipe[1]].to.push([recipe[0], recipe[2]])
        data[recipe[2]] ??= { from: [], to: [] }
        data[recipe[2]].from.push([recipe[0], recipe[1]])
    }
    data = Object.fromEntries(Object.entries(data).map(x => {
        let from = x[1].from.sort((a, b) => costs[a[0]] + costs[a[1]] - costs[b[0]] - costs[b[1]])
        let to = x[1].to.sort((a, b) => costs[a[1]] - costs[b[1]])
        return [x[0], { from: from, to: to }]
    }))
    return {
        index: Object.fromEntries(Object.entries(raw.index).map(x => [x[0], [x[1][0], x[1][1], x[1][2]]])),
        costs: costs,
        data: data,
    };
}

// Convert a number to base 64
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

function save(attempted, costs, icons) {
    try {
        data = { attempted, costs, icons }

        data.costs = getCosts(data)

        fs.writeFileSync('web/data/data.json', JSON.stringify(compress(data)), 'utf8');
        console.log(`${attempted.length} entries written to file`);
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

function compress(data) {
    console.log("Compressing...")
    let index = Object.keys(data.costs).sort((a,b) => data.costs[a] - data.costs[b]).filter(x => x != "Nothing").map((a, i) => [toBase64(i), [data.icons[a], a, data.costs[a]]])
    let forward = {...Object.fromEntries(index), "A": ["", "Nothing", 0]}
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

async function main() {
    let attempted = []
    let icons = { "Water": "💧", "Fire": "🔥", "Wind": "🌬️", "Earth": "🌍" }
    let costs = { "Water": 1, "Fire": 1, "Wind": 1, "Earth": 1 }

    fileContents = fs.readFileSync('web/data/data.json', 'utf8');
    data = uncompress(JSON.parse(fileContents));

    // recipes = data.data.split(";").map(x => x.split(","))
    for (let i = 0; i < data.attempted.length; i++) {
        let A = data.attempted[i][0]
        let B = data.attempted[i][1]
        let C = data.attempted[i][2]
        if (A == "Nothing" || B == "Nothing") {
            console.log(data.attempted[i])
            data.attempted.splice(i, 1)
            i--
        }
        if (A == "20" || B == "20" || C == "20" || A == "000 Leagues Under the Sea" || B == "000 Leagues Under the Sea" || C == "000 Leagues Under the Sea") {
            console.log(data.attempted[i])
            data.attempted.splice(i, 1)
            i--
        }
    }



    save(data.attempted, data.costs, data.icons)
}

main()
