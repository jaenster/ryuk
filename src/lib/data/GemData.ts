class GemData {

  constructor(data: GameTableGems) {

  }
}


const _gems: { [id: number]: GemData } = {};

let size = getTableSize("gems");

for (let i = 0; i < size; i++) {
  let g = getTableRow("gems", i);
  console.log(g);
  // _gems[g.Name] = new GemData(g);
}

export default _gems;