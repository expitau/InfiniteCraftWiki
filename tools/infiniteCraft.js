const fs = require('fs');
const { save, load } = require('./util/files')
const { craft } = require('./util/craft')

function alreadyChecked(attempted, elementA, elementB) {
    return attempted.some(x => (x[0] == elementA && x[1] == elementB) || (x[0] == elementB && x[1] == elementA))
}

function getAlreadyChecked(attempted, elementA, elementB) {
    return attempted.find(x => (x[0] == elementA && x[1] == elementB) || (x[0] == elementB && x[1] == elementA))
}

function getPair(attempted, costs, n = 1) {
    console.log("Generating pairs...")
    let output = []
    let sortedElements = Object.entries(costs).sort(([, a], [, b]) => a - b).map(x => x[0]).filter(x => x != "Nothing")
    for (let i = 175; i < sortedElements.length; i++) {
        console.log(i, sortedElements[i])
        for (let j = 0; j <= i; j++) {
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
    let sortedElements = Object.entries(costs).sort(([, a], [, b]) => a - b).map(x => x[0]).filter(x => costs[x] <= maxCost).filter(x => x != "Nothing")
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
        console.log(`${elementA} + ${elementB} -> ${response.result}`)
    } else if (Object.keys(costs).includes(response.result)) {
        console.log(`${elementA} + ${elementB} -> ${response.result}`)
        if (costs[response.result] > costs[elementA] + costs[elementB]) {
            // console.log(`Reduced cost for ${response.result} from ${costs[response.result]} to ${costs[elementA] + costs[elementB]}`)
            outputCost = costs[elementA] + costs[elementB]
        }
    } else {
        console.log(`=== ${elementA} + ${elementB} -> ${response.result} ===`)
        outputCost = costs[elementA] + costs[elementB]
        outputIcon = response.emoji
    }

    return { result: outputResult, cost: outputCost, icon: outputIcon }
}

async function getElements(mode = "random", batchSize = 50) {
    let { attempted, costs, icons } = load()
    console.log(attempted)
    for (let i = 0; i < 2000; i++) {
        console.log(`Batch ${i}`)
        let batch = []
        let processing = []
        if (mode == "random") {
            batch = getRandomPair(attempted, costs, 50)
        } else if (mode == "fixed") {
            batch = getPair(attempted, costs, 50)
        } else {
            throw new Error("Invalid mode")
        }
        for (let [elementA, elementB] of batch) {
            processing.push(process(elementA, elementB, costs))

            if (processing.length >= 1) {
                let results = await Promise.all(processing)
                for (result of results) {
                    attempted.push(result.result)
                    costs[result.result] = result.cost
                    if (result.icon) {
                        icons[result.result] = result.icon
                    }
                }
                processing = []
            }
        }
        save(attempted, icons)
    }
    save(attempted, icons)
}

// getElements("fixed", 10)

const { attempted, costs, icons } = load()

let itemsFile = fs.readFileSync('recipes/items.csv', 'utf8');
let recipesFile = fs.readFileSync('recipes/recipes.csv', 'utf8');

let newItems = itemsFile.split("\r\n").map(x => x.split(","))
let newRecipes = recipesFile.split("\r\n").map(x => x.split(","))

let i = 0
for (let recipe of newRecipes) {
    // console.log(recipe)
    if (recipe.length != 3) {
        // console.log(recipe)
        continue;
    }

    if (!icons[recipe[0]] || !icons[recipe[1]]) {
        // console.log("Missing costs for", recipe)
        continue;
    }

    // let existing = getAlreadyChecked(attempted, recipe[0], recipe[1])
    // if (existing) {
    //     // console.log("Already checked", recipe)
    //     if (existing[2] != recipe[2]) {
    //         console.log("Found error!", recipe, existing)
    //         continue;
    //     }
    //     continue;
    // }
    attempted.push(recipe)
    icons[recipe[2]] = newItems.find(x => x[0] == recipe[2])[1]
    if (i % 1000 == 0) {
        console.log("Added recipe", recipe, icons[recipe[2]])
    }
    if (i % 100000 == 0) {
        save(attempted, icons)
    }
    i++
    // console.log("Added item", recipe[2], icons[recipe[2]])
}
save(attempted, icons)
