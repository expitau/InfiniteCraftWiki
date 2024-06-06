const { save, load } = require('./util/files')

let PATH1 = 'web/data/data.json'
let PATH2 = 'web/data/data2.json'

async function main() {
    data1 = load(PATH1)
    data2 = load(PATH2)
    attemptedSet1 = new Set(data1.attempted.map(x => x.join(',,')))
    attemptedSet2 = new Set(data2.attempted.map(x => x.join(',,')))
    for (let item of attemptedSet1) {
        if (attemptedSet2.has(item)) {
            attemptedSet2.delete(item)
        } else {
            recipe = item.split(",,").map(x => data1.icons[x] + " " + x)
            console.log("\x1b[31m-",recipe[0],"+",recipe[1],"=>",recipe[2])
        }
    }
    for (let item of attemptedSet2) {
        recipe = item.split(",,").map(x => data2.icons[x] + " " + x)
        console.log("\x1b[32m+",recipe[0],"+",recipe[1],"=>",recipe[2])
    }
    console.log(data1.attempted.length, data2.attempted.length)
}

main()
