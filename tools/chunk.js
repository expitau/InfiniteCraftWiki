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

// Decode base64 value mod 1000
function getChunk(value) {
    let base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-='
    let result = 0
    for (let i = 0; i < value.length; i++) {
        result = (result * 64 + base64.indexOf(value[i]))
    }
    return Math.floor(result / 100)
}

async function main() {
    fileContents = fs.readFileSync('web/data/data.json', 'utf8');
    rawData = JSON.parse(fileContents);

    let data = generateData(rawData)
    let chunks = Object.groupBy(Object.entries(data.data), x => getChunk(x[0]))
    for (let key of Object.keys(chunks)) {
        let value = chunks[key].map(e => {
            let currentElement = e[0]
            // console.log("Processing from")
            let from = e[1].from.filter(x => x[0] != currentElement && x[1] != currentElement && data.index[currentElement][1] != 'Nothing').sort((a, b) => compareRecipes({ A: a[0], B: a[1], C: currentElement }, { A: b[0], B: b[1], C: currentElement }, data))
            // console.log("Processing to")
            let to = e[1].to.filter(x => currentElement != x[1] && x[0] != x[1] && data.index[x[1]][1] != 'Nothing').sort((a, b) => compareRecipes({ A: currentElement, B: a[0], C: a[1] }, { A: currentElement, B: b[0], C: b[1] }, data))
            // console.log("Processing hidden from")
            let hiddenFrom = e[1].from.map(x => data.costs[x[1]] > data.costs[x[0]] ? [x[1], x[0]] : [x[0], x[1]]).filter(x => !(x[0] != currentElement && x[1] != currentElement && data.index[currentElement][1] != 'Nothing')).sort((a, b) => compareRecipes({ A: a[0], B: a[1], C: currentElement }, { A: b[0], B: b[1], C: currentElement }, data))
            // console.log("Processing hidden to")
            let hiddenTo = e[1].to.filter(x => !(currentElement != x[1] && x[0] != x[1] && data.index[x[1]][1] != 'Nothing')).sort((a, b) => compareRecipes({ A: currentElement, B: a[0], C: a[1] }, { A: currentElement, B: b[0], C: b[1] }, data))
            return [e[0], `${from.map(x => x.join(":1")).join(":2")}:3${to.map(x => x.join(":1")).join(":2")}:3${hiddenFrom.map(x => x.join(":1")).join(":2")}:3${hiddenTo.map(x => x.join(":1")).join(":2")}`]
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
        fs.writeFileSync('web/data/chunks/chunk-' + key + '.json', JSON.stringify(Object.fromEntries(value)), 'utf8');
        console.log("Wrote chunk", key)
    }
    data.index = Object.fromEntries(Object.entries(data.index).map(e => {
        return [e[0], [e[1][0], e[1][1], e[1][2], data.data[e[0]].from[0][0], data.data[e[0]].from[0][1]]]
    }))
    // console.log(chunks)
    fs.writeFileSync('web/data/index.json', JSON.stringify(data.index), 'utf8');
    fs.writeFileSync('web/data/metadata.json', JSON.stringify({ recipeCount: Object.entries(data.data).reduce((acc, [key, value]) => acc + value.from.length, 0) }), 'utf8');

    // save(attempted, costs, icons)
}

main()
