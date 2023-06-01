import sdk from "../sdk";

export = function () {

  Config.ClearInvOnStart = false;

  let z = (me.charlvl > 90 ? 0 : 1) as 0 | 1;
  Config.Inventory = [
    [z, z, z, z, z, z, z, z, z, z],
    [z, z, z, z, z, z, z, z, z, z],
    [z, z, z, z, z, z, z, z, z, z],
    [z, z, z, z, z, z, z, z, z, z],
  ];

  Config.PacketShopping = true;

  Object.defineProperty(Config, 'LowGold', {
    get() {
      // lvl 1 = 1.1k
      // lvl 12 = 13.5k
      // lvl 36 = 40.5k
      return (me.charlvl * 1.5) * 750;
    }
  })

  Object.defineProperty(Config, 'StashGold', {
    get() {
      return this.LowGold / 3;
    }
  })

  // this activates kolbot TownChicken, we dont want that
  // Object.defineProperty(Config, 'TownCheck', {
  //     get() {
  //         return me.charlvl >= 18;
  //     }
  // })


  Object.defineProperty(Config, 'FieldID', {
    get() {
      if (me.charlvl <= 6) return false;

      // If shrined, fuck gold and fieldid like crazy, we want to xp
      return me.getStat(sdk.states.ShrineExperience)
        || me.gold > (Config.LowGold * 1.25);

    }
  });
}