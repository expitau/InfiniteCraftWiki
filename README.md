# InfiniteCraftWiki

This is a webpage that provides a guide on how to craft various items in neal.fun's [Infinite Craft](https://neal.fun/infinite-craft/).

Visit the [live site](https://expitau.github.io/InfiniteCraftWiki/) to see it in action!

## Importing Save Files

This site has support for importing your crafted elements from Infinite Craft. To do this, go to https://neal.fun/infinite-craft/, right click -> Inspect element -> Console, and paste the following code:

```javascript
fetch("https://raw.githubusercontent.com/expitau/InfiniteCraftWiki/main/data.json").then(res => res.json()).then(data => { index = Object.fromEntries(Object.entries(data.index).map(x => [x[1][1], x[0]])); window.location.href = `https://expitau.github.io/InfiniteCraftWiki?s=${JSON.parse(localStorage.getItem('infinite-craft-data')).elements.map(a => index[a.text]).filter(x => x).join(",")}` })
```

This will automatically redirect and load your data.

## Developers

### Data Format
The data is stored in a JSON file, with two keys "index" and "data". The "index" has a list of base64 values mapping to elements. The "data" is a string of semicolon-separated recipes, where each recipe is a comma-separated list of elements. The first 2 elements in the recipe are the ingredients, and the last is the result. The actual elements can be looked up in the index, which stores the icon, the name of the element, and the "cost", which is the smallest number of elements needed to create it.

**Example Data**
```json
{
    "index": {
        "B": ["🔥","Fire",1],
        "C": ["🌍","Earth",1],
        "D": ["🌬️","Wind",1],
        "E": ["🌫️","Dust",2],
        "F": ["🌋","Lava",2],
        "G": ["🌋","Volcano",2]
    },
    "data": "D,C,E;B,C,F;B,B,G"
}
```

(This corresponds to three recipes, Wind + Earth = Dust, Fire + Earth = Lava, and Fire + Fire = Volcano. The costs are the minimal costs for each item.)

See [data.json](data.json) for the current data, and the bottom of [index.html](index.html) for a way to parse it into a dictionary of recipes and backlinks. 
