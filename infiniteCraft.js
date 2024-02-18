const fs = require('fs');

async function craft(a, b) {
    let res;
    do {
        res = await fetch(`https://neal.fun/api/infinite-craft/pair?first=${a}&second=${b}`, {
            "headers": {
                "accept": "*/*",
                "Referer": "https://neal.fun/infinite-craft/",
            },
            "method": "GET"
        });
        if (res.status != 200) {
            console.log("Rate limited, retrying...")
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    } while (res.status != 200)
    await new Promise(resolve => setTimeout(resolve, 100))

    return await res.json()
}

function alreadyChecked(attempted, elementA, elementB) {
    if (elementA == elementB) {
        return attempted.some(x => x.elements.includes(elementA) && x.elements.includes(elementB) && x.elements[0] == x.elements[1])
    }
    return attempted.some(x => x.elements.includes(elementA) && x.elements.includes(elementB))
}

function getCosts(data) {
    let costs = { "Water": 1, "Fire": 1, "Wind": 1, "Earth": 1 }

    let completed = false;
    while (!completed) {
        completed = true;
        for (recipe of data.attempted) {
            // console.log("Processing", recipe)
            if (costs[recipe.elements[0]] == null || costs[recipe.elements[1]] == null) {
                // console.log("Missing cost for", recipe.elements[0], "or", recipe.elements[1])
                completed = false;
            } else if (!costs[recipe.result]) {
                // console.log("Set cost for", recipe.result, "to", costs[recipe.elements[0]] + costs[recipe.elements[1]], "(didn't exist)")
                costs[recipe.result] = costs[recipe.elements[0]] + costs[recipe.elements[1]]
                completed = false;
            } else if (costs[recipe.result] > costs[recipe.elements[0]] + costs[recipe.elements[1]]) {
                // console.log("Set cost for", recipe.result, "to", costs[recipe.elements[0]] + costs[recipe.elements[1]], `(${costs[recipe.result]} was higher)`)
                costs[recipe.result] = costs[recipe.elements[0]] + costs[recipe.elements[1]]
                completed = false;
            }
        }
    }
    return Object.fromEntries(Object.entries(costs).sort(([, a], [, b]) => a - b))
}

function compress(data) {
    out = []
    for (let i = 0; i < data.attempted.length; i++) {
        out.push(data.attempted[i].elements[0], data.attempted[i].elements[1], data.attempted[i].result)
    }
    data.attempted = out
    return data
}

function uncompress(data) {
    out = []
    for (let i = 0; i < data.attempted.length; i += 3) {
        out.push({ elements: [data.attempted[i], data.attempted[i + 1]], result: data.attempted[i + 2] })
    }
    data.attempted = out
    return data
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

function getPair(attempted, costs, n=1) {
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

    return {result: outputResult, cost: outputCost, icon: outputIcon}
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


    for (let i = 0; i < 20; i++) {
        console.log(`Batch ${i}`)
        for ([elementA, elementB] of getPair(attempted, costs, 100)) {
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

    console.log(attempted)
    console.log(attempted.length)

    save(attempted, costs, icons)
}

getElements()
