import CharData from "../lib/CharData";

export = function () {

  /*
   80 / sqrt(maxmana)

  max mana         potions
    20                17
    40                12
    100               8
   ~ 150              6
   < 250              5
   < 400              4
   < 700              3
   < 800              2
  */

  const mpFactor = 80;
  let mpBuffer = ~~(mpFactor / Math.sqrt(me.mpmax));
  Config.MPBuffer = [~~(mpBuffer / 3 * 2), mpBuffer];

  const hpFactor = 65;
  let hpBuffer = ~~(hpFactor / Math.sqrt(me.hpmax));
  Config.HPBuffer = [~~(hpBuffer / 3 * 2), hpBuffer];

  Config.RejuvBuffer = (me.charlvl < 12 ? 5 : 3);

  Config.HealHP = 50;
  Config.HealMP = 70;

  Config.BeltColumn = ["hp", "mp", "mp", "mp"];

  const min = (Storage.BeltSize() - 1) as 0 | 1 | 2 | 3 | 4;
  Config.MinColumn = [min, min, min, min];

  Config.LifeChicken = 35;
  Config.ManaChicken = 0;

  Config.UseHP = 75;
  Config.UseMP = 30;
  Config.UseRejuvHP = 40;
  Config.UseRejuvMP = 0;
  Config.UseMercHP = 75;
  Config.UseMercRejuv = 0;

  Config.LogExperience = true;
  Config.PickitFiles.push("pots.nip");

  Object.defineProperty(Config, 'UseMerc', {
    get() {
      return CharData.merc.type; // if we got a merc
    }

  })
}