# InfiniteCraftWiki

This is a webpage that provides a guide on how to craft various items in neal.fun's [Infinite Craft](https://neal.fun/infinite-craft/).

Visit the [live site](https://expitau.com/InfiniteCraftWiki/) to see it in action!

## Importing Save Files

This site has support for importing your crafted elements from Infinite Craft. This diagram provides an overview of the messaging protocol used to sync files.
![sync diagram](docs/syncDiagram.png)

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

See [data.json](web/data/data.json) for the current data, and the bottom of [index.html](web/index.html) for a way to parse it into a dictionary of recipes and backlinks. 

## Acknowledgements
- [Neal Agarwal](https://neal.fun/) for creating Infinite Craft
- [Reu Zuidema](https://github.com/reumarks) For various contributions and PRs
- [fan87](https://github.com/fan87) and [Jcw87](https://github.com/Jcw87) for providing additional datasets
