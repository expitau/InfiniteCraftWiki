self.addEventListener('message', async (e) => {
   const chunk = e.data.chunk;
   const saveData = new Set(e.data.saveData);
   const DATA_PREFIX = e.data.DATA_PREFIX;

   let result = await fetch(`${DATA_PREFIX}chunks/chunk-${chunk}.json`);
   let data = await result.json();
   console.log("Loaded chunk", chunk);

   const [sep1, sep2, sep3] = [":3", ":2", ":1"];
   let chunkData = Object.fromEntries(Object.entries(data).map(x => {
      let [from, to, hiddenFrom, hiddenTo] = x[1].split(sep1);

      const processSection = (section) => {
         if (section === "") return [];
         return section.split(sep2).map(x => x.split(sep3));
      };

      from = processSection(from);
      to = processSection(to);
      hiddenFrom = processSection(hiddenFrom);
      hiddenTo = processSection(hiddenTo);
      
      if (saveData.size != 0) {
         from = from.sort((a, b) => (+saveData.has(b[0])) + (+saveData.has(b[1])) - (+saveData.has(a[0])) - (+saveData.has(a[1])));
         to = to.sort((a, b) => (+saveData.has(b[0])) + (+saveData.has(a[1])) * 2 - (+saveData.has(b[1])) * 2 - (+saveData.has(a[0])));
      }

      return [x[0], { from, to, hiddenFrom, hiddenTo }];
   }));

   self.postMessage({ chunkData, chunk });
});