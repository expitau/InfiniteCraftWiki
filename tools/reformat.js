const fs = require('fs');
const { toBase64, fromBase64 } = require('./util/files')

const LOAD_FROM = 'web/data/data.json'
let raw = JSON.parse(fs.readFileSync(LOAD_FROM, 'utf8'));

function compareRecipes(A, B, data) {
    // If the name of the output is "Nothing"
    if (data[A[2]][1] == "Nothing")
        return 1
    if (data[B[2]][1] == "Nothing")
        return -1

    // If name of the first input is "Nothing"
    if (data[A[0]][1] == "Nothing")
        return 1
    if (data[B[0]][1] == "Nothing")
        return -1

    // If name of the second input is "Nothing"
    if (data[A[1]][1] == "Nothing")
        return 1
    if (data[B[1]][1] == "Nothing")
        return -1

    // Order by input costs
    if (Math.max(data[A[0]][2], data[A[1]][2]) > Math.max(data[B[0]][2], data[B[1]][2]))
        return 1
    if (Math.max(data[A[0]][2], data[A[1]][2]) < Math.max(data[B[0]][2], data[B[1]][2]))
        return -1

    // Order by output cost
    if (data[A[2]][2] > data[B[2]][2])
        return 1
    if (data[A[2]][2] < data[B[2]][2])
        return -1

    // Order by output name
    if (data[A[2]][1] > data[B[2]][1])
        return 1
    if (data[A[2]][1] < data[B[2]][1])
        return -1

    // Order by first ingredient name
    if (data[A[0]][1] > data[B[0]][1])
        return 1
    if (data[A[0]][1] < data[B[0]][1])
        return -1

    // Order by second ingredient name
    if (data[A[1]][1] > data[B[1]][1])
        return 1
    if (data[A[1]][1] < data[B[1]][1])
        return -1

    return 0
}

let indexArr = Object.entries(raw.index).sort((a, b) => fromBase64(a[0]) - fromBase64(b[0])).map(x => [fromBase64(x[0]), x[1][0], x[1][1]]);
let recipes = raw.data.split(";").map(x => x.split(",").map(y => fromBase64(y)));
console.log(indexArr.slice(0, 10))
console.log(recipes.slice(0, 10))
console.log(indexArr.length, recipes.length)

function recipeSegmentToBase64(segment) {
    if (!segment) return undefined
    return segment.map(x => toBase64(x).padStart(4, 'A')).join('')
}


console.log("Updating costs...")
let resolved = Object.fromEntries(indexArr.map(x => [x[0], [x[1], x[2], Infinity]]))
for (i in resolved) {
    if (resolved[i][1] == "Fire") {
        resolved[i][2] = 1
    }
    if (resolved[i][1] == "Water") {
        resolved[i][2] = 1
    }
    if (resolved[i][1] == "Wind") {
        resolved[i][2] = 1
    }
    if (resolved[i][1] == "Earth") {
        resolved[i][2] = 1
    }
}
console.log(Object.values(resolved).slice(0,10))

// Update costs
while (true) {
    let changed = 0;
    for (let i = 0; i < recipes.length; i++) {
        let [A, B, C] = recipes[i];

        if (resolved[A][2] != Infinity && resolved[B][2] != Infinity && resolved[A][1] != 'Nothing' && resolved[B][1] != 'Nothing' && resolved[C][1] != 'Nothing' && (resolved[C][2] < 0 || resolved[C][2] > Math.max(resolved[A][2], resolved[B][2]) + 1)) {
            changed += 1
            resolved[C][2] = Math.max(resolved[A][2], resolved[B][2]) + 1
        }
    }
    console.log("Changed", changed, "values")
    if (changed == 0) {
        break
    }
}

let resolvedObj = Object.fromEntries(Object.entries(resolved).sort((a, b) => a[1][2] - b[1][2]).map((x, i) => [x[0], [i, x[1][0], x[1][1], x[1][2], [], []]]))

console.log("Generating lists...")
for (let i = 0; i < recipes.length; i++) {
    if (i % 1000000 == 0) {
        console.log(Math.floor(i / recipes.length * 100) + "%")
    }
    let [A, B, C] = recipes[i];
    let costA = resolvedObj[A][3]
    let costB = resolvedObj[B][3]
    resolvedObj[A][4].push([resolvedObj[B][0], resolvedObj[C][0]])
    resolvedObj[B][4].push([resolvedObj[A][0], resolvedObj[C][0]])
    if (costA > costB) {
        resolvedObj[C][5].push([resolvedObj[B][0], resolvedObj[A][0]])
    } else {
        resolvedObj[C][5].push([resolvedObj[A][0], resolvedObj[B][0]])
    }
}

console.log("Sorting and finalizing (takes 60s)...")
resolved = Object.entries(resolvedObj).sort((a, b) => a[1][0] - b[1][0]).map(x => [x[1][1], x[1][2], x[1][3], x[1][4], x[1][5]])
resolved = resolved.map((x,i) =>
    [
        x[0], x[1], x[2],
        x[3].sort((a, b) => compareRecipes([i,a[0],a[1]],[i,b[0],b[1]],resolved)),
        x[4].sort((a, b) => compareRecipes([a[0],a[1],i],[b[0],b[1],i],resolved)),
    ])

let outputIndex = resolved.map((x,i) => [i, x[0], x[1], x[2], x[4][0] && x[4][0][0], x[4][0] && x[4][0][1]])
let outputData = resolved.map((x,i) => [i, x[3].map(y => recipeSegmentToBase64(y)), x[4].map(y => recipeSegmentToBase64(y))])

function getChunk(n) {
    return Math.floor(Math.log(n / 50 + 1) * 8) + 1;
}

let indexChunks = Object.groupBy(outputIndex, (x, i) => Math.floor(i / 100000) + 1)
let dataChunks = Object.groupBy(outputData, (x, i) => getChunk(i))

for (let chunk in indexChunks) {
    fs.writeFileSync(`web/data/index/idx-${chunk}.json`, JSON.stringify(indexChunks[chunk]))
}
for (let chunk in dataChunks) {
    fs.writeFileSync(`web/data/data/dat-${chunk}.json`, JSON.stringify(dataChunks[chunk]))
}

fs.writeFileSync('web/data/metadata.json', JSON.stringify({
    recipeCount: recipes.length,
    elementCount: resolved.length,
    bookmarkletVersion: 2,
    chunkCount: Object.keys(dataChunks).length,
    indexCount: Object.keys(indexChunks).length
}))
