class MissileData {
  velocity: number;
  size: number;
  range: number;
  minDamage: number; // physical min damage
  maxDamage: number;
  eType: string; // elemental damage type
  eMin: number; // elemental min damage
  eMax: number;
  cltSubMissiles: number[];

  constructor(data: GameTableMissile) {
    this.velocity = data.Vel;
    this.size = data.Size;
    this.range = data.Range;
    this.minDamage = data.MinDamage;
    this.maxDamage = data.MaxDamage;
    this.eType = data.EType;
    this.eMin = data.EMin;
    this.eMax = data.EMax;
    this.cltSubMissiles = [data.CltSubMissile1, data.CltSubMissile2, data.CltSubMissile3];
  }
}


const _missiles: { [id: number]: MissileData } = {};

let size = getTableSize("missiles");

for (let i = 0; i < size; i++) {
  let m = getTableRow("missiles", i);
  _missiles[m.Missile] = new MissileData(m);
}

export default _missiles;