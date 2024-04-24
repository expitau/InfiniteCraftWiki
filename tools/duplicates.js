const { save, load } = require('./util/files')
const { craft } = require('./util/craft')

async function main() {
    data = load();

    console.log('Re-ordering ingredients');
    data.attempted = data.attempted.map(([first, second, result]) => second < first ? [second, first, result] : [first, second, result])

    console.log('Counting pairs');
    let counts = {};
    for (const recipe of data.attempted) {
        const [first, second, result] = recipe;
        if (counts[first] === undefined) {
            counts[first] = {};
        }
        if (counts[first][second] === undefined) {
            counts[first][second] = 0;
        }
        counts[first][second]++;
    }

    console.log('Identifying duplicates');
    counts = Object.fromEntries(Object.entries(counts).map(([first, v]) => [first, Object.fromEntries(Object.entries(v).filter(([second, score]) => score > 1))]).filter(([first, v]) => Object.keys(v).length > 0));
    const duplicates = Object.fromEntries(Object.entries(counts).map(([first, v]) => [first, Object.fromEntries(Object.entries(v).map(([second, score]) => [second, null]))]));

    console.log('Fetch correct recipes');
    for (const first of Object.keys(duplicates)) {
        for (const second of Object.keys(duplicates[first])) {
            const data_json = await craft(first, second);
            duplicates[first][second] = data_json.result;
            data.icons[data_json.result] = data_json.emoji;
            console.log(`"${first}" + "${second}" = "${data_json.result}"`);
        }
    }

    console.log('Remove bad duplicates');
    let removeCount = 0;
    data.attempted = data.attempted.filter(([first, second, result]) => {
        const ret = !(duplicates[first] && duplicates[first][second] && duplicates[first][second] !== result);
        if (!ret) {
            counts[first][second]--;
            removeCount++;
        }
        return ret;
    })
    console.log(`${removeCount} recipes removed`)

    // add recipes if none of the existing entries matched
    let addCount = 0;
    for (const first of Object.keys(counts)) {
        for (const second of Object.keys(counts[first])) {
            if (counts[first][second] === 0) {
                data.attempted.push([first, second, duplicates[first][second]]);
                addCount++;
            }
        }
    }
    console.log(`${addCount} recipes added`);

    // save(data.attempted, data.icons);
}

main();
