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
    for (let recipe of raw.data.split(";").map(x => x.split(","))) {
        data[recipe[0]] ??= { from: [], to: [] }
        data[recipe[0]].to.push([recipe[1], recipe[2]])
        data[recipe[1]] ??= { from: [], to: [] }
        data[recipe[1]].to.push([recipe[0], recipe[2]])
        data[recipe[2]] ??= { from: [], to: [] }
        data[recipe[2]].from.push([recipe[0], recipe[1]])
    }
    return {
        index: Object.fromEntries(Object.entries(raw.index).map(x => [x[0], [x[1][0], x[1][1], x[1][2]]])),
        costs: Object.fromEntries(Object.entries(raw.index).map(x => [x[0], x[1][2]])),
        data: data,
    };
}

// Decode base64 value mod 1000
function getChunk(value) {
    let base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+'
    let result = 0
    for (let i = 0; i < value.length; i++) {
        result = (result * 64 + base64.indexOf(value[i]))
    }
    return Math.floor(result / 100)
}

async function main() {
    let attempted = []
    let icons = { "Water": "💧", "Fire": "🔥", "Wind": "🌬️", "Earth": "🌍" }
    let costs = { "Water": 1, "Fire": 1, "Wind": 1, "Earth": 1 }

    fileContents = fs.readFileSync('data/data.json', 'utf8');
    parsedData = JSON.parse(fileContents);

    let data = generateData(parsedData)
    let chunks = Object.groupBy(Object.entries(data.data), x => getChunk(x[0]))
    for (let key of Object.keys(chunks)) {
        let value = chunks[key].map(e => {
            let currentElement = e[0]
            // console.log("Processing from")
            let from = e[1].from.map(x => data.costs[x[1]] > data.costs[x[0]] ? [x[1], x[0]] : [x[0], x[1]]).filter(x => x[0] != currentElement && x[1] != currentElement && data.index[currentElement][1] != 'Nothing').sort((a, b) => compareRecipes({ A: a[0], B: a[1], C: currentElement }, { A: b[0], B: b[1], C: currentElement }, data))
            // console.log("Processing to")
            let to = e[1].to.filter(x => currentElement != x[1] && x[0] != x[1] && data.index[x[1]][1] != 'Nothing').sort((a, b) => compareRecipes({ A: currentElement, B: a[0], C: a[1] }, { A: currentElement, B: b[0], C: b[1] }, data))
            // console.log("Processing hidden from")
            let hiddenFrom = e[1].from.map(x => data.costs[x[1]] > data.costs[x[0]] ? [x[1], x[0]] : [x[0], x[1]]).filter(x => !(x[0] != currentElement && x[1] != currentElement && data.index[currentElement][1] != 'Nothing')).sort((a, b) => compareRecipes({ A: a[0], B: a[1], C: currentElement }, { A: b[0], B: b[1], C: currentElement }, data))
            // console.log("Processing hidden to")
            let hiddenTo = e[1].to.filter(x => !(currentElement != x[1] && x[0] != x[1] && data.index[x[1]][1] != 'Nothing')).sort((a, b) => compareRecipes({ A: currentElement, B: a[0], C: a[1] }, { A: currentElement, B: b[0], C: b[1] }, data))
            return [e[0], { from, to, hiddenFrom, hiddenTo }]
        })
        // .map(x =>
        //     [x[0], {
        //         from: x[1].from.map(recipe => {
        //             if (data.costs[recipe[0]] > data.costs[recipe[1]]) {
        //                 return { A: recipe[1], B: recipe[0], C: x[0] }
        //             }
        //             return { A: recipe[0], B: recipe[1], C: x[0] }
        //         }),
        //         to: x[1].to.map(recipe => {
        //             return { A: x[0], B: recipe[0], C: recipe[1] }
        //         })
        //     }]).map(x =>
        //         [x[0], {
        //             from: x[1].from,
        //             to: x[1].to,
        //             hiddenFrom: [],
        //             hiddenTo: []
        //         }])
        fs.writeFileSync('data/chunk-' + key + '.json', JSON.stringify(Object.fromEntries(value)), 'utf8');
    }
    // console.log(chunks)
    fs.writeFileSync('data/index.json', JSON.stringify(data.index), 'utf8');
    fs.writeFileSync('data/metadata.json', JSON.stringify({ recipeCount: Object.entries(data.data).reduce((acc, [key, value]) => acc + value.from.length, 0) }), 'utf8');

    // save(attempted, costs, icons)
}

main()
