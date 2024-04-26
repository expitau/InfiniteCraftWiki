const { save, load } = require('./util/files')

async function main() {
    data = load();

    recipeCount = 0;
    for (const recipe of data.attempted) {
        if (recipe[0].startsWith(' ') || recipe[1].startsWith(' ')) {
            console.log(`"${recipe[0]}" + "${recipe[1]}" = "${recipe[2]}"`);
        }

        if (recipe[2].startsWith(' ')) {
            const badItem = recipe[2];
            const fixedItem = badItem.trimStart();
            recipe[2] = fixedItem;
            recipeCount++;
            if (!data.icons[fixedItem]) {
                data.icons[fixedItem] = data.icons[badItem];
            }
            if (data.icons[badItem]) {
                delete data.icons[badItem];
            }
        }
    }

    console.log(`${recipeCount} recipes updated`);

    save(data.attempted, data.icons);
}

main();
