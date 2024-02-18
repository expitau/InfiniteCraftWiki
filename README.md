# InfiniteCraftWiki

This is a webpage that provides a guide on how to craft various items in neal.fun's [Infinite Craft](https://neal.fun/infinite-craft/).

Visit the [live site](https://expitau.github.io/InfiniteCraftWiki/) to see it in action!

## Developers

### Data Format
The data is stored in a JSON file, with a list of attemped recipes, the current best costs for each recipe, and a dictionary of icons. Attempted is an array of strings with length divisible by 3. Each group of 3 strings represents a recipe, with the first 2 the names of items and the last the result. The icons are guaranteed to have an icon for everything present in attempted (except "Nothing", which is a special case. A "Nothing" result means that the items will not craft). The costs of Water, Fire, Wind, and Earth are 1, and the costs of other items are the minimal sum of the costs of their ingredients. 

**Example Data**
```json
{
    "attempted": ["Earth","Water","Plant","Water","Wind","Wave"],
    "costs": {
        "Water": 1,
        "Fire": 1,
        "Wind": 1,
        "Earth": 1,
        "Plant": 2,
        "Wave": 2,
    },
    "icons": {
        "Water": "💧",
        "Fire":"🔥",
        "Wind":"🌬️",
        "Earth":"🌍",
        "Plant":"🌱",
        "Wave":"🌊",
    },
}
```

(This corresponds to two recipes, Earth + Water = Plant and Water + Wind = Wave. The costs are the minimal costs for each item.)

See [data.json](data.json) for the current data, and the bottom of [index.html](index.html) for a way to parse it into a dictionary of recipes and backlinks. 
