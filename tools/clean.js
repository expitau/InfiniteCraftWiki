const fs = require('fs');
const { load, save } = require('./util/files')

async function main() {
    data = load()

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

    save([...new Set(data.attempted.map(x => x.join(":1")))].map(x => x.split(":1")), data.icons)
}

main()
