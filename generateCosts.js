const fs = require('fs');

// Read data from data.json
fs.readFile('data.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  try {
    // Parse JSON data
    const jsonData = JSON.parse(data);

    let costs = {"Water": 0, "Fire": 0, "Wind": 0, "Earth": 0}

    let completed = false;
    while (!completed) {
        completed = true;
        for (recipe of jsonData.attempted) {
            console.log("Processing", recipe)
            if (costs[recipe.elements[0]] == null || costs[recipe.elements[1]] == null) {
                console.log("Missing cost for", recipe.elements[0], "or", recipe.elements[1])
                completed = false;
            } else if (!costs[recipe.result] || costs[recipe.result] > costs[recipe.elements[0]] + costs[recipe.elements[1]] + 1) {
                console.log("Set cost for", recipe.result)
                costs[recipe.result] = costs[recipe.elements[0]] + costs[recipe.elements[1]] + 1
                completed = false;
            }
        }
    }

    jsonData.costs = Object.fromEntries(Object.entries(costs).sort(([,a],[,b]) => a-b))

    // Convert JSON back to string
    const newData = JSON.stringify(jsonData);

    fs.writeFile('data.json', newData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
      console.log('Data updated successfully!');
    });
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
});
