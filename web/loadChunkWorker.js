self.addEventListener('message', async (e) => {
   const chunk = e.data.chunk;
   const saveData = new Set(e.data.saveData);
   const DATA_PREFIX = e.data.DATA_PREFIX;

   let result = await fetch(`${DATA_PREFIX}data/dat-${chunk}.json`);
   let data = await result.json();
   console.log("Loaded chunk", chunk);

   let chunkData = {}

   for (let [index, rawTo, rawFrom] of data) {
      let from = rawFrom.map(x => base64ToRecipeSegment(x));
      let to = rawTo.map(x => base64ToRecipeSegment(x));
      chunkData[index] = {
         from: from,
         to: to,
      };
   }
   self.postMessage({ chunkData, chunk });
});
