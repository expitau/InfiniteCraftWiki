const fs = require('fs');

async function craft(a, b) {
    let res;
    do {
        try {
            res = await fetch(`https://neal.fun/api/infinite-craft/pair?first=${a}&second=${b}`, {
                "headers": {
                    "accept": "*/*",
                    "Referer": "https://neal.fun/infinite-craft/",
                },
                "method": "GET"
            });
        } catch {
            res = {status: 500}
        }
        if (res.status != 200) {
            console.log("Rate limited, retrying in 5s...")
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    } while (res.status != 200)

    // Wait 70ms to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 70))

    return await res.json()
}

function alreadyChecked(attempted, elementA, elementB) {
    if (elementA == elementB) {
        return attempted.some(x => x.elements.includes(elementA) && x.elements.includes(elementB) && x.elements[0] == x.elements[1])
    }
    return attempted.some(x => x.elements.includes(elementA) && x.elements.includes(elementB))
}

function getCosts(data) {
    console.log("Generating costs...")
    let costs = { "Water": 1, "Fire": 1, "Wind": 1, "Earth": 1 }

    let completed = false;
    while (!completed) {
        completed = true;
        for (recipe of data.attempted) {
            if (recipe.result == "Nothing" || recipe.elements[0] == "Nothing" || recipe.elements[1] == "Nothing") {
            } else if (costs[recipe.elements[0]] == null || costs[recipe.elements[1]] == null) {
                // console.log("Processing", recipe)
                console.log("Missing cost for", recipe.elements[0], "or", recipe.elements[1])
                completed = false;
            } else if (!costs[recipe.result]) {
                // console.log("Processing", recipe)
                console.log("Set cost for", recipe.result, "to", costs[recipe.elements[0]] + costs[recipe.elements[1]], "(didn't exist)")
                costs[recipe.result] = costs[recipe.elements[0]] + costs[recipe.elements[1]]
                completed = false;
            } else if (costs[recipe.result] > costs[recipe.elements[0]] + costs[recipe.elements[1]]) {
                // console.log("Processing", recipe)
                console.log("Set cost for", recipe.result, "to", costs[recipe.elements[0]] + costs[recipe.elements[1]], `(${costs[recipe.result]} was higher)`)
                costs[recipe.result] = costs[recipe.elements[0]] + costs[recipe.elements[1]]
                completed = false;
            }
        }
    }
    return Object.fromEntries(Object.entries(costs).sort(([, a], [, b]) => a - b))
}

// Convert a number to base 64
function toBase64(n) {
    n = n + 1
    let base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+'
    let result = ''
    while (n > 0) {
        result = base64[n % 64] + result
        n = Math.floor(n / 64)
    }
    return result
}

function compress(data) {
    console.log("Compressing...")
    let f = {}
    for (let i = 0; i < data.attempted.length; i++) {
        f[data.attempted[i].elements[0]] ??= 0
        f[data.attempted[i].elements[0]]++
        f[data.attempted[i].elements[1]] ??= 0
        f[data.attempted[i].elements[1]]++
        f[data.attempted[i].result] ??= 0
        f[data.attempted[i].result]++
    }
    let index = Object.entries(f).sort(([, a], [, b]) => b - a).map(([a, b], i) => [toBase64(i), [data.icons[a], a, data.costs[a]]])
    let forward = Object.fromEntries(index)
    let reverse = Object.fromEntries(index.map(([a, b]) => [b[1], a]))
    let comp = data.attempted.sort((a, b) => data.costs[a.result] - data.costs[b.result]).map(recipe => {
        return [reverse[recipe.elements[0]], reverse[recipe.elements[1]], reverse[recipe.result]].join(',')
    }).join(';')
    return { index: forward, data: comp }
}

function uncompress(data) {
    out = {}
    out.attempted = data.data.split(';').map(x => x.split(',').map(y => data.index[y])).map(x => { return { elements: [x[0][1], x[1][1]], result: x[2][1] } })
    out.icons = Object.fromEntries(Object.entries(data.index).map(([a, b]) => [b[1], b[0]]))
    out.costs = Object.fromEntries(Object.entries(data.index).map(([a, b]) => [b[1], b[2]]))
    return out
}

function save(attempted, costs, icons) {
    try {
        data = { attempted, costs, icons }

        data.costs = getCosts(data)

        fs.writeFileSync('data.json', JSON.stringify(compress(data)), 'utf8');
        console.log(`${attempted.length} entries written to file`);
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

function getPair(attempted, costs, n = 1) {
    let output = []
    let sortedElements = Object.entries(costs).sort(([, a], [, b]) => a - b).map(x => x[0])
    for (let i = 0; i < sortedElements.length; i++) {
        for (let j = 0; costs[sortedElements[j]] <= costs[sortedElements[i]]; j++) {
            if (!alreadyChecked(attempted, sortedElements[i], sortedElements[j])) {
                output.push([sortedElements[i], sortedElements[j]])
            }
            if (output.length >= n) {
                return output
            }
        }
    }
}

function getRandomPair(attempted, costs, n = 1, maxCost = 15) {
    let output = []
    let sortedElements = Object.entries(costs).sort(([, a], [, b]) => a - b).map(x => x[0]).filter(x => costs[x] <= maxCost).filter(x => x != "Nothing" )
    while (output.length < n) {
        // Choose random sorted elements
        let elementA = sortedElements[Math.floor(Math.random() * sortedElements.length)]
        let elementB = sortedElements[Math.floor(Math.random() * sortedElements.length)]
        if (!alreadyChecked(attempted, elementA, elementB) && !output.some(x => x[0] == elementA && x[1] == elementB) && !output.some(x => x[0] == elementB && x[1] == elementA)) {
            output.push([elementA, elementB])
        }
    }
    return output
}

function getSpecificPair(attempted, costs, element) {
    let sortedElements = Object.entries(costs).sort(([, a], [, b]) => a - b).map(x => x[0])
    for (let i = 0; i < sortedElements.length; i++) {
        if (!alreadyChecked(attempted, sortedElements[i], element)) {
            return [sortedElements[i], element]
        }
    }
}

async function process(elementA, elementB, costs) {
    let response = await craft(elementA, elementB)
    let outputResult = response.result
    let outputCost = costs[response.result]
    let outputIcon = null

    if (response.result == "Nothing") {
        console.log(`${elementA} + ${elementB} -> ${response.result} (not added)`)
    } else if (Object.keys(costs).includes(response.result)) {
        console.log(`${elementA} + ${elementB} -> ${response.result}`)
        if (costs[response.result] > costs[elementA] + costs[elementB]) {
            // console.log(`Reduced cost for ${response.result} from ${costs[response.result]} to ${costs[elementA] + costs[elementB]}`)
            outputCost = costs[elementA] + costs[elementB]
        }
    } else {
        console.log(`${elementA} + ${elementB} -> ${response.result} (new element)`)
        outputCost = costs[elementA] + costs[elementB]
        outputIcon = response.emoji
    }

    return { result: outputResult, cost: outputCost, icon: outputIcon }
}

async function getElements() {
    let attempted = []
    let icons = { "Water": "💧", "Fire": "🔥", "Wind": "🌬️", "Earth": "🌍" }
    let costs = { "Water": 1, "Fire": 1, "Wind": 1, "Earth": 1 }

    try {
        const data = fs.readFileSync('data.json', 'utf8');
        const parsedData = uncompress(JSON.parse(data));
        attempted = parsedData.attempted;
        icons = parsedData.icons;
        costs = parsedData.costs;
    } catch (err) {
        console.error('Error reading file:', err);
    }


    for (let i = 0; i < 200; i++) {
        console.log(`Batch ${i}`)
        for ([elementA, elementB] of getRandomPair(attempted, costs, 50)) {
            let result = await process(elementA, elementB, costs)
            attempted.push({ elements: [elementA, elementB], result: result.result })
            costs[result.result] = result.cost
            if (result.icon) {
                icons[result.result] = result.icon
            }
        }
        // let [elementA, elementB] = getSpecificPair(attempted, costs, "Dragon")


        save(attempted, costs, icons)
    }

    // elementA = "A"
    // elementB = "B"
    // let result = await process(elementA, elementB, costs)
    // attempted.push({ elements: [elementA, elementB], result: result.result })
    // costs[result.result] = result.cost
    // if (result.icon) {
    //     icons[result.result] = result.icon
    // }

    console.log(attempted)
    console.log(attempted.length)

    save(attempted, costs, icons)
}

getElements()
