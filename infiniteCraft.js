const fs = require('fs');

async function craft(a, b) {
    let res;
    do {
        res = await fetch(`https://neal.fun/api/infinite-craft/pair?first=${a}&second=${b}`, {
        "headers": {
            "accept": "*/*",
            "Referer": "https://neal.fun/infinite-craft/",
        },
        "method": "GET"});
        if (res.status != 200) {
            console.log("Rate limited, retrying...")
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    } while (res.status != 200)
    return await res.json()
}

function chooseElement(list) {
    let totalWeight = Object.entries(list).reduce((acc, [key, value]) => acc + value, 0);
    let random = Math.random() * totalWeight;
    for (let [key, value] of Object.entries(list)) {
        random -= value;
        if (random <= 0) return key;
    }
}

function alreadyChecked(attempted, elementA, elementB) {
    return attempted.some(x => x.elements.includes(elementA) && x.elements.includes(elementB))
}

function save(attempted, list, icons) {
    try {
        fs.writeFileSync('data.json', JSON.stringify({ attempted, list, icons }), 'utf8');
        console.log('Data has been written to file');
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

async function getElements() {
    let attempted = []
    let icons = { "Water": "💧", "Fire": "🔥", "Wind": "🌬️", "Earth": "🌍"}
    let list = { "Water": 1, "Fire": 1, "Wind": 1, "Earth": 1 }
    
    try {
        const data = fs.readFileSync('data.json', 'utf8');
        const parsedData = JSON.parse(data);
        attempted = parsedData.attempted;
        list = parsedData.list;
        icons = parsedData.icons;
    } catch (err) {
        console.error('Error reading file:', err);
    }


    for (let i = 0; i < 100; i++) {
        let elementA;
        let elementB;
        do {
            elementA = chooseElement(list)
            elementB = chooseElement(list)
        } while (alreadyChecked(attempted, elementA, elementB))
        let response = await craft(elementA, elementB)
        if (response.result == "Nothing") {
            console.log(`${elementA} + ${elementB} -> ${response.result} (not added)`)
            list[elementA] *= 0.9
            list[elementB] *= 0.9
        } else if (Object.keys(list).includes(response.result)) {
            console.log(`${elementA} + ${elementB} -> ${response.result}`)
            attempted.push({elements: [elementA, elementB], result: response.result})
            list[elementA] *= 0.9
            list[elementB] *= 0.9
        } else {
            console.log(`${elementA} + ${elementB} -> ${response.result} (new element)`)
            attempted.push({elements: [elementA, elementB], result: response.result})
            list[response.result] = 1
            icons[response.result] = response.emoji
            list[elementA] *= 1.1
            list[elementB] *= 1.1
        }

        save(attempted, list, icons)
    }
    
    list = Object.fromEntries(Object.entries(list).sort(([,a],[,b]) => b-a))
    console.log(list)
    console.log(attempted)
    console.log(attempted.length)

    save(attempted, list, icons)
}

getElements()
