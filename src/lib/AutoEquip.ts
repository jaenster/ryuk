import {Override} from "../overrides/Override";
import sdk from "../sdk";
import {CharClasses, PickitResult, Qualities, StorageLocations} from "../enums";

const dependencies = {};
dependencies[sdk.itemtype.bow] = sdk.items.arrows;
dependencies[sdk.items.arrows] = sdk.itemtype.bow;
dependencies[sdk.itemtype.crossbow] = sdk.items.bolts;
dependencies[sdk.items.bolts] = sdk.itemtype.crossbow;

const hasDependency = item => {
  let dep = dependencies[item.classid] || dependencies[item.itemType];
  return !!dep;
};

class AutoEquip {
  public readonly wantType: PickitResult.RYUK_AEQUIP_MERC | PickitResult.RYUK_AEQUIP;
  public readonly formula: (item: ItemUnit) => number;
  private readonly equipHandler: (bodyLoc: number, item: ItemUnit) => {
    rollback: () => {};
    unequiped: ItemUnit[];
    success: boolean
  };

  private compare(...args) {
    return this.compareRetAll(args).first();
  }

  private compareRetAll(items) {
    return items.filter((item: ItemUnit) => {
      return (item instanceof Unit ? this.formula(item) : item) > -Infinity;
    }).sort(this.sortItems);
  }

  private readonly sortItems: (a, b) => number;

  private readonly forUnit: 'merc' | 'me';
  private readonly cachedWanted: Map<ItemUnit, 'AEM' | 'AE' | 0 | -1> = new Map();
  private readonly cacheCalced: Map<ItemUnit, number> = new Map();

  private get reference(): Monster | MeType {
    if (this.forUnit === 'me') return me;
    if (this.forUnit === 'merc') return me.getMerc() || undefined;
  }

  private calcCheckItem(item: ItemUnit) {
    if (!item) {
      return PickitResult.NONE; // We dont want an item that doesnt exists
    }

    if (!item.identified) { // Tell the network we need to identify it first
      return PickitResult.TO_IDENTIFY; // We want to identify this
    }

    // fuck 2 handed items for now
    if (item.twoHanded && this.forUnit === 'me') {
      return PickitResult.NONE;
    }

    if (item.getStat(sdk.stats.Maxdurability) > 0 && item.getStat(sdk.stats.Durability) === 0 && item.getStatEx(sdk.stats.ReplenishDurability) === 0) {
      //ToDo: item is broken, should we repair it ?
      // console.log("item is broken ?");
      return PickitResult.NONE;
    }

    // no quest items
    if (['msf', 'vip'].includes(item.code)) {
      return PickitResult.NONE;
    }

    const bodyLoc = item.getBodyLoc();
    if (!bodyLoc.length) {
      return PickitResult.NONE; // Only items that we can wear
    }

    // if this is for a class, and its not our class or we are a merc
    const forClass = item.charclass;
    if (forClass !== 255) {
      // ToDo; see if this properly handles a act 5 merc
      // console.log('??');
      if (this.reference?.classid > 6) return PickitResult.NONE // merc

      if ((forClass >= 0 && forClass <= 6 && forClass !== this.reference?.classid)) {
        return PickitResult.NONE;
      }
    }

    //ToDo; fix act 1 merc
    if (hasDependency(item) && this.forUnit !== 'merc') {
      // TODO: item require an other item to be used (bow, crossbow)
      return PickitResult.NONE;
      //quantity * 100 / getBaseStat("items", quiver.classid, "maxstack")
      /*const stock = me.getItemsEx()
          .filter(i => i.classid == dependency && ((i.mode == sdk.itemmode.inStorage && i.location == sdk.storage.Inventory) || i.mode == sdk.itemmode.equipped));
      if (stock.length) {
          return 1;
      }
      // can't use this item as we don't have the dependency
      return -1;*/
    }

    const rating = this.formula(item);
    if (rating === -Infinity) {
      return PickitResult.NONE;
    }

    // if a unit has no items, it returns the function getItems itself.. weird
    let itsItems = (this.reference?.getItems() || []);
    if (!Array.isArray(itsItems)) itsItems = [];

    // Current items are either -Infinity, or the actual item
    const currentItems: ItemUnit[] = bodyLoc.compactMap(slot => {
      const current = itsItems.find(item => item.isEquipped && item.bodylocation === slot);
      if (!current && slot === sdk.body.LeftArm) {
        const currentWeapon = itsItems
          .find(item => item.isEquipped && item.bodylocation === sdk.body.RightArm && item.twoHanded);
        // if current weapon is two handed, remove this as current slot
        if (currentWeapon) {
          return null;
        }
      }
      return current;
    });

    // no point in wanting items we cant equip
    /*let currentInSlot = currentItems.find(i => i.getBodyLoc().intersection(item.getBodyLoc()).length > 0);
    let currentStrBonus = currentInSlot?.getStatEx(sdk.stats.Strength) ?? 0;
    let currentDexBonus = currentInSlot?.getStatEx(sdk.stats.Dexterity) ?? 0;
    let currentStrBonus = currentInSlot?.getStatEx(sdk.stats.Strength) ?? 0;
    let currentDexBonus = currentInSlot?.getStatEx(sdk.stats.Dexterity) ?? 0;*/
    let realDex = this.reference?.rawDexterity;
    let realStr = this.reference?.rawStrength;
    if (item.getStat(sdk.stats.Levelreq) > this.reference?.getStat(sdk.stats.Level) || item.dexreq > realDex || item.strreq > realStr) {
      return PickitResult.NONE;
    }

    //ToDo; check if the item is vendored, and if we can afford it

    // Compare the items. The highest rating is the best item, the lowest rating is the worst item
    // In case of multiple slots (e.g. rings), this tells us which ring we want to replace this ring with.
    let compared = this.compareRetAll([item, ...currentItems]);

    // we want item if it is better than the worst equipped for this slot
    const result = compared.indexOf(item);
    if (compared.length === 1 || result < compared.length - 1) {
      return this.wantType;
    }
    return PickitResult.NONE;
  };

  checkItem(item: ItemUnit): PickitResult {
    if (!item.identified) {
      // don't cache if item is unid
      return this.calcCheckItem(item);
    }
    let ret;
    if (!this.cachedWanted.has(item)) this.cachedWanted.set(item, ret = this.calcCheckItem(item));
    return typeof ret === 'undefined' ? this.cachedWanted.get(item) : ret;
  }

  private equip(item: ItemUnit) {
    // We got it now, but somehow... dont want it anymore?
    if (this.checkItem(item) !== this.wantType) {
      return false;
    }

    if (item.isInStash) {
      if (!Town.openStash()) {
        return false;
      }
    }

    const tier = this.formula(item);
    // console.debug(`equiping ${this.forUnit === 'me' ? '' : 'merc '}item ${item.name}. Tier ${tier}`);

    let bodyLocs = item.getBodyLoc();
    let currentItems = this.reference?.getItems() || undefined;
    if (!Array.isArray(currentItems)) currentItems = [];

    let currentSlots = bodyLocs.map(loc => ({
      location: loc, item: currentItems.filter(item => {
        if (item.twoHanded && item.getBodyLoc().includes(loc)) {
          return item.isEquipped;
        }
        return item.isEquipped && item.bodylocation === loc;
      })
        .first()
    }))
      .sort((a, b) => {
        if (!a.item && !b.item) {
          return -1;
        }
        // if item is two handed, you want to replace it, so return it first
        // if item is ring, you want to fill the empty slot first
        if (!a.item) return b.item.twoHanded ? 1 : -1;
        if (!b.item) return a.item.twoHanded ? -1 : 1;
        return this.compare(a.item, b.item) === a.item ? (a.item.twoHanded ? -1 : 1) : -1
      });

    // currentSlots sorted by formula ascending (index 0 is worse than index 1)
    let emptySlot = currentSlots.filter(s => !s.item).first();
    let old;
    if (emptySlot) {
      Misc.logItem('kept', item)
      old = this.equipHandler(emptySlot.location, item);
    } else {
      let found = false;
      for (let i = 0; i < currentSlots.length && !old; i++) {
        // if item is better than current, equip it
        if (this.compare(currentSlots[i].item, item) === item) {
          Misc.logItem('kept', item);
          old = this.equipHandler(currentSlots[i].location, item);
          found = true;
          break;
        }
      }
      if (!found) {
        this.cachedWanted.set(item, 0);
        this.cacheCalced.set(item, -1337);
        return false;
      }
    }

    // Sometimes it happens the OLD item seems better once we have the new one in place
    // Was the old item better?
    if (old && old.unequiped && old.unequiped.length) {
      const newTier = this.formula(old.unequiped.first());
      if (newTier > tier) {
        return !!old.rollback(); // Rollback and return
      }
    }

    return true;
  }

  private asyncIdentify(item: ItemUnit, gid: number) {
    {
      // console.debug('identifying');
      let returnTo = {area: me.area, x: me.x, y: me.y};
      // We can id right now. So lets

      // it can be a while ago, got the tome
      let tome = me.findItem(519, 0, 3); // ToDo Use loose scrolls
      if (tome) {
        const item = getUnits(4, -1, -1, gid).first();
        if (!tome || !item) {
          return; // Without an tome or item, we cant id the item
        }

        // send the packet we right click on the tome

        //  3 attempts
        for (let i = 0, timer = getTickCount();
             i < 3 && getCursorType() !== 6;
             i++, timer = getTickCount()
        ) {
          sendPacket(1, 0x27, 4, gid, 4, tome.gid);
          while (getCursorType() !== 6) {
            delay(3);
            if (getTickCount() - timer > 2e3) break; // Failed to id it. To bad
          }
        }
      } else { // Dont have a tome

        //ToDo; go to cain if he is closer by and we dont have scrolls & nothing else to identify

        Town.goToTown();
        // Lets go to town to identify
        const npc = Town.initNPC("Shop", "identify") || undefined;
        const scroll = npc.getItem(sdk.items.idScroll) || undefined;
        scroll?.buy();
        tome = scroll;
      }

      // console.debug('Identified cursor? ' + (getCursorType() === 6));
      // Try to id the item, 3 attempts
      for (let i = 0, timer = getTickCount();
           i < 3 && !item.identified;
           i++, timer = getTickCount()
      ) {
        // console.debug('send packet of identifing');
        getCursorType() === 6 && sendPacket(1, 0x27, 4, gid, 4, tome.gid);
        while (!item.identified) {
          delay(3);
          if (getTickCount() - timer > 2e3) break; // Failed to id it. To bad
        }
      }


      let failed;
      if (!item.identified) {
        failed = this.equip(item);
        this.cachedWanted.set(item, 0);
        this.cacheCalced.set(item, -Infinity);
      }

      if (returnTo.area !== me.area) {
        Town.moveToSpot('portal');
        Pather.usePortal(returnTo.area);
        Pather.moveTo(returnTo.x, returnTo.y);
      }

      return !failed;
    }
  }

  handle(item) {

    const tome = me.findItem(519, 0, 3);
    if (tome && !item.identified && item.location === sdk.storage.Inventory) {
      const gid = item.gid;

      this.asyncIdentify(item, gid); // So lets
    }

    return item.identified && this.equip(item);
  }

  shop(items) {
    // console.debug('AutoEquip shopping for items');

    // first an object that contains the items per bodylocation
    return items.reduce((acc, item) => {
      const bodyloc = item.getBodyLoc().first(); // rings are not for sale so who cares about multiple slots;

      (acc[bodyloc] = acc[bodyloc] || []).push(item);

      return acc;
    }, new Array(sdk.body.LeftArmSecondary + 1))
      // now this is an array per body location
      .map((/**@type Item[]*/items, bodyloc) => {
          /** @type Item*/
          const currentItem = (this.reference?.getItems() || [])
            .filter(item => item.isEquipped && item.bodylocation === bodyloc)
            .first();

          const currentRating = !currentItem ? -Infinity : this.formula(currentItem);

          // calculate the actual rating of this item
          return items.map(item => {
            let ratingThisItem = this.formula(item);
            if (ratingThisItem < currentRating) return false;

            // Avoid issues like dual handed items and such
            if (!this.checkItem(item)) return false;

            //ToDo; calculate formula for 2 handed weapons
            return ({
              item: item,
              rating: ratingThisItem,
              price: item.getItemCost(0), // 0 = to buy
              currentRating: currentRating,
            });

          })
            // filter out those that are worse as we got and those that we can afford
            .filter(obj => {
                return obj && currentRating < obj.rating && obj.price < me.gold;
              } // Needs to be better
              // && currentRating - obj.rating > obj.rating * 0.10  // needs to be atleast 10% better if we buy the item
              // && obj.price < me.gold // can we afford it?
            ) //ToDo; proper gold handeling
            .sort((a, b) => b.rating - a.rating) // higher is better
            .first();
        }
      )
      // filter out those options without a result
      .filter(_ => !!_)
      .sort((a, b) => (b.rating - b.currentRating) - (a.rating - a.currentRating))
      .map(obj => obj.item);
  };

  constructor(formula: (item: ItemUnit) => number,
              equipHandler: (bodyLoc: number, item: ItemUnit) => undefined | {
                rollback: () => {},
                unequiped: ItemUnit[],
                success: boolean
              },
              forUnit: 'merc' | 'me' = 'me') {
    this.formula = formula;
    this.forUnit = forUnit;

    this.sortItems = (a: number | ItemUnit, b: number | ItemUnit) => {
      let fa = typeof a === 'number' ? a : this.formula(a);
      let fb = typeof b === 'number' ? b : this.formula(b);
      if (fb === fa && typeof a !== 'number' && typeof b !== 'number') {

        if (a.isEquipped && b.isEquipped) return 0;
        return a.isEquipped ? -1 : 1;
      }
      return fb - fa;
    };

    this.equipHandler = equipHandler;

    this.wantType = forUnit === 'merc' ? PickitResult.RYUK_AEQUIP_MERC : PickitResult.RYUK_AEQUIP;
  }

}

function getResAmount(item) {
  const resCount = ([
    item.getStat(sdk.stats.Fireresist),
    item.getStat(sdk.stats.Coldresist),
    item.getStat(sdk.stats.Lightresist)
  ] as number[])
    .filter(el => el > 0)
    .length

  // If res count is 3, also count psn if it has
  if (resCount === 3 && item.getStat(sdk.stats.Poisonresist) > 0) return 4;
  return resCount;
}

export const personalAutoEquip = new AutoEquip(function formula(item: ItemUnit) {
  //ToDo; proper fix
  // const bestSkills = [sdk.skills.FireBall, sdk.skills.Blizzard, sdk.skills.FireBolt];

  const skills = () => {
      let val = item.getStatEx(sdk.stats.Allskills) + item.getStatEx(sdk.stats.Addclassskills, me.classid);

      // Calculate imported skill tabs.
      const tabs = [],
        char = sdk.skillTabs[['amazon', 'sorc', 'necro', 'paladin', 'barb', 'druid', 'assassin'][me.classid]];

      // // Loop over all skill tabs of this char
      // // And push every skill that has a tab
      // Object.keys(char).forEach(types => char[types].skills.some(sk => bestSkills.find(bsk => bsk.skillId === sk)) && tabs.push(char[types].id));
      //
      // // Sum total value of all tabs
      // val += tabs
      //     .filter((v, i, s) => s.indexOf(v) === i) // Filter to only have uniques (shouldnt happen, better safe as sorry)
      //     .reduce((a, tab) => a + item.getStatEx(sdk.stats.AddskillTab, tab), 0); // Sum them
      //
      // // Take care of specific + skills
      // val += bestSkills.reduce((a, c) => a
      //     + item.getStatEx(sdk.stats.Addclassskills, c) // + skills on item
      //     + item.getStatEx(sdk.stats.Nonclassskill, c) // + o skills. Dont think it will happen, but, we wouldnt mind if it did happen
      //     , 0);

      return (val * 10) | 0; // Boost the value, +1 skills are worth allot
    }, // get all skills

    // Take care of the elemental damage of your best skill. (facets/eschutas/the lot)
    // elementDmg = () => bestSkills.reduce(function (a, c) {
    //     if (sdk.stats.hasOwnProperty('Passive' + c.type + 'Mastery')) a += item.getStatEx(sdk.stats['Passive' + c.type + 'Mastery']); // + skill damage
    //     if (sdk.stats.hasOwnProperty('Passive' + c.type + 'Pierce')) a += item.getStatEx(sdk.stats['Passive' + c.type + 'Pierce']); // - enemy resistance
    //     return a;
    // }, 0),

    //ToDo; fix later
    elementDmg = () => 0,

    // ToDo; take in account the current resistance. Because at some point, enough is enough
    res = () => {
      const res = (item.getStatEx(sdk.stats.Fireresist)
        + item.getStatEx(sdk.stats.Coldresist)
        + item.getStatEx(sdk.stats.Lightresist)
      ) | 0;

      // slightly boost multiple res items over single res items
      // so we rather keep a 10/10/10 res item over a single res item of 31 + fire res
      return res * (1 + (getResAmount(item) / 4));
    },
    strdex = () => item.getStatEx(sdk.stats.Strength)
      + item.getStatEx(sdk.stats.Dexterity) | 0,
    vita = () => item.getStatEx(sdk.stats.Vitality) | 0,
    hpmp = () => item.getStatEx(sdk.stats.Maxhp)
      + item.getStatEx(sdk.stats.Maxmana)
      + item.getStatEx(sdk.stats.PerLevelHp) / 2048 * me.charlvl
      + item.getStatEx(sdk.stats.PerLevelMana) / 2048 * me.charlvl | 0,
    fcr = () => item.getStatEx(sdk.stats.Fastercastrate) | 0,
    fbr = () => item.getStatEx(sdk.stats.Fasterblockrate) | 0,
    def = () => item.getStatEx(sdk.stats.Armorclass /*defense*/) | 0,
    fhr = () => item.getStatEx(sdk.stats.Fastergethitrate /* fhr*/) | 0,
    frw = () => item.getStatEx(sdk.stats.Fastermovevelocity /* fwr*/) | 0,
    ctb = () => item.getStatEx(sdk.stats.Toblock /*ctb = chance to block*/) | 0,
    beltsize = () => !(item.code === "lbl" || item.code === "vbl") ? !(item.code === "mbl" || item.code === "tbl") ? 4 : 3 : 2,
    ias = () => {
      // This is a tricky one. A sorc, doesnt give a shit about IAS.
      // 0='amazon',1='sorc',2='necro',3='paladin',4='barb',5='druid',6='assassin'
      // ToDo; make
      return 0;
    };

  const generalMagic = () => (skills() * 1000)
    + (fcr() * 400)

    + (res() * 100)
    + (fhr() * 100)

    + (ctb() * 40)
    + (fbr() * 40)
    + (frw() * 40)
    + (strdex() * 40)
    + (vita() * 40)

    + (hpmp() * 30)
    + def();

  const generalRare = () => (skills() * 10000)
    + (fcr() * 4000)

    + (res() * 1000)
    + (fhr() * 1000)

    + (ctb() * 400)
    + (fbr() * 400)
    + (strdex() * 400)
    + (vita() * 400)

    + (hpmp() * 300)
    + def();

  const basicRule: { magic: () => number, rare: () => number } = {magic: generalMagic, rare: generalRare};

  const tiers = [
    { // Future, inventory
      magic: () => -Infinity, //ToDo charms. Total score is divided by its size

      // Cant happen but to shut up typescript
      rare: () => -Infinity,
    },
    basicRule, // head

    basicRule, // amulet

    basicRule, // torso

    basicRule, // weapon
    basicRule, // shield

    basicRule, // ring #1
    basicRule, // ring #2

    { // belt
      magic: () => (res() * 10000)
        + (beltsize() * 10000)
        + (strdex() * 1000)
        + (hpmp() * 100)
        + (fhr() * 10)
        + def(),

      rare: () => (res() * 100000)
        + (beltsize() * 50000)
        + (fhr() * 10000)
        + (strdex() * 1000)
        + (hpmp() * 1000)
        + def()
    },

    basicRule, // feet
    basicRule, // hands
  ];

  // console.log(item.name);
  // console.log(new Error().stack.match(/[^\r\n]+/g)[1]);
  const bodyLoc = item.getBodyLoc().first(); // always returns an array, as weapon/shield / rings have multiple slots
  if (!bodyLoc) return -Infinity; // Its not an equitable item


  const tierFuncs = tiers[bodyLoc];

  if (tierFuncs === undefined) {
    // throw Error('Should not happen?');
    console.log('Tier function not found, which is weird');
    return 0;
  }
  const [magicTier, rareTier] = [tierFuncs.magic, tierFuncs.rare];

  let bias = 1;

  // if eth
  if (item.ethereal) {
    bias += 0.10; // A fix'd negative point of 10%

    // And increase this negativity scale for its state, so a nearly broken item will be quicker replaced with something better
    bias += 1 - (1 / (item.getStat(sdk.stats.Maxdurability) as number) * (item.getStat(sdk.stats.Durability) as number));
  }

  if (item.isRuneword || item.quality >= Qualities.Rare) {
    if (typeof rareTier === 'function') {
      let tier = rareTier() / bias;
      // console.debug('rare tier -- ' + item.name + ' -- ' + tier);
      return tier;
    }
    return 0;
  }
  // magical, or lower
  if (typeof magicTier === 'function') {
    let tier = magicTier() / bias;
    // console.debug('magic tier -- ' + item.name + ' -- ' + tier);
    return tier;
  }
  return 0;
}, (bodyLoc, item) => {
  return item.equip(bodyLoc);
});


export const mercAutoEquip = me.gametype && new AutoEquip(function formula(item: ItemUnit) {
  if (!me.getMerc()) return -Infinity;
  const res = () => (item.getStatEx(sdk.stats.Fireresist)
      + item.getStatEx(sdk.stats.Coldresist)
      + item.getStatEx(sdk.stats.Lightresist)
    ) | 0,
    strdex = () => item.getStatEx(sdk.stats.Strength)
      + item.getStatEx(sdk.stats.Dexterity) | 0,
    hpmp = () => item.getStatEx(sdk.stats.Maxhp)
      + item.getStatEx(sdk.stats.Maxmana)
      + item.getStatEx(sdk.stats.PerLevelHp) / 2048 * me.getMerc()?.charlvl
      + item.getStatEx(sdk.stats.PerLevelMana) / 2048 * me.charlvl | 0,
    def = () => item.getStatEx(sdk.stats.Armorclass /*defense*/) | 0,
    fhr = () => item.getStatEx(sdk.stats.Fastergethitrate /* fhr*/) | 0,
    ll = () => item.getStatEx(sdk.stats.LifeLeech) | 0,
    ias = () => item.getStatEx(sdk.stats.Fasterattackrate) | 0,
    aura = () => [sdk.skills.Meditation, sdk.skills.Conviction]
      .reduce((acc, cur) => acc + (item.getStatEx(sdk.stats.SkillOnAura, cur) | 0) | 0, 0),
    ar = () => item.getStatEx(sdk.stats.Attackrate),
    cb = () => item.getStatEx(sdk.stats.Crushingblow),
    avgDmg = () => (item.getStatEx(sdk.stats.Mindamage) + item.getStatEx(sdk.stats.Maxdamage)) / 2,
    avgFireDmg = () => (item.getStatEx(sdk.stats.Firemindam) + item.getStatEx(sdk.stats.Firemaxdam)) / 2,
    avgColdDmg = () => (item.getStatEx(sdk.stats.Coldmindam) + item.getStatEx(sdk.stats.Coldmaxdam)) / 2,
    avgLightDmg = () => (item.getStatEx(sdk.stats.Lightmindam) + item.getStatEx(sdk.stats.Lightmaxdam)) / 2,
    avgPoisonDmg = () => (item.getStatEx(sdk.stats.Poisonmindam) + item.getStatEx(sdk.stats.Poisonmaxdam)) / 2,
    ed = () => item.getStatEx(sdk.stats.Damagepercent),
    dmg = () => avgDmg() + avgColdDmg() + avgLightDmg() + avgFireDmg()// + avgPoisonDmg()

  const generalMagic = () =>
    +(aura() * 1000)
    + (ll() * 400)
    + (res() * 100)
    + (ias() * 100)
    + (fhr() * 100)
    + (strdex() * 40)
    + (hpmp() * 30)
    + def();

  const magicWeapon = () =>
    aura() * 10000
    + dmg() * 1000
    + ll() * 400
    + ias() * 100
    + ar() * 100
    + fhr() * 100
    + cb() * 50
    + strdex() * 40
    + hpmp() * 30;

  const rareWeapon = () =>
    aura() * 10000
    + dmg() * 1000
    + ll() * 400
    + ias() * 100
    + ar() * 100
    + fhr() * 100
    + cb() * 50
    + strdex() * 40
    + hpmp() * 30;

  const generalRare = () =>
    +(aura() * 10000)
    + (ll() * 4000)
    + (res() * 1000)
    + (ias() * 1000)
    + (fhr() * 1000)
    + (strdex() * 400)
    + (hpmp() * 300)
    + def();

  const basicRule: { magic: () => number, rare: () => number } = {magic: generalMagic, rare: generalRare};

  const weaponRule: { magic: () => number, rare: () => number } = {
    magic: magicWeapon,
    rare: rareWeapon
  }

  const tiers = [
    undefined, // inventory
    basicRule, // head
    undefined, // amulet
    basicRule, // torso
    weaponRule, // weapon
    // basicRule, // shield // Actually act 3 mercs can use shields, but fuck act 3 mercs for now
  ];

  const bodyLoc = item.getBodyLoc().first(); // always returns an array, as weapon/shield / rings have multiple slots
  if (!bodyLoc) return -Infinity; // Its not an equitable item
  if (bodyLoc >= tiers.length || bodyLoc === 2) return -Infinity; // Cant be worn by a merc

  // Mercs are annoying and pick with weapons/armors
  const merc = me.getMerc();
  let canWear = bodyLoc !== sdk.body.RightArm

    // a act 2 merc
    || (merc?.classid === sdk.monsters.Guard && (item.itemType === sdk.itemtype.spear || item.itemType === sdk.itemtype.polearm))

    // a act 1 merc
    || (merc?.classid === sdk.monsters.RogueScout && item.itemType === sdk.itemtype.bow);

  // console.log('Item? ', item.name, 'can wear:', canWear);
  if (!canWear) return -Infinity

  const tierFuncs = tiers[bodyLoc];

  if (tierFuncs === undefined) return -Infinity;

  const [magicTier, rareTier] = [tierFuncs.magic, tierFuncs.rare];

  let bias = 1;

  // if eth -> Mercs like eth items, so bias .75
  if (item.ethereal) bias = .75;

  if (item.isRuneword || item.quality >= Qualities.Rare) {
    if (typeof rareTier === 'function') {
      let tier = rareTier() / bias;
      console.debug('rare *merc* tier -- ' + item.name + ' -- ' + tier);
      return tier;
    }
    return -Infinity;
  }
  // magical, or lower
  if (typeof magicTier === 'function') {
    let tier = magicTier() / bias;
    // console.debug('magic *merc* tier -- ' + item.name + ' -- ' + tier);
    return tier;
  }
  return -Infinity;
}, function (bodyLoc, item) {
  // console.log('Should equip merc item', bodyLoc, item);
  // make sure we are not in shop or anything
  me.cancel() && me.cancel() && me.cancel();
  if (!me.getMerc() || me.getMerc().dead || item.isInStash) {
    return false;
  }
  return me.getMerc().equip(bodyLoc, item);
}, 'merc');

// All this is custom, dont do anything with kolbots auto equip as it sucks and i dont like nip
Pickit.on('checkItem', function (item, result) {

  [personalAutoEquip, mercAutoEquip].filter(e => e).some((aq) => {
    const tmpResult = aq.checkItem(item);
    switch (tmpResult) {
      case PickitResult.TO_IDENTIFY:
      case aq.wantType:
        result.result = tmpResult;
        return true;
    }
    return false;
  });

  // console.debug('Checking item?', result.result, ' -> ', item.name);
});

const itemEvent = (item) => {
  (getInteractedNPC() || undefined)?.itemcount === 0 && me.cancel();
  [personalAutoEquip, mercAutoEquip].filter(e => e).some((aq) => {
    const tmpResult = aq.checkItem(item);
    if (tmpResult === aq.wantType) {
      aq.handle(item);
      return true;
    }
    return false;
  });
}

Pickit.on('pickedItem', itemEvent);
Pickit.on('identifiedItem', itemEvent)

new Override(Item, Item.autoEquip, function (original) {
  //ToDo; We got time to actually equip items right now

  (getInteractedNPC() || undefined)?.itemcount === 0 && me.cancel();
  console.log('Running auto equipment');
  (me.getItems() || [])
    .filter(item => item.identified && (item.isInInventory || item.isInStash))
    .forEach(itemEvent);
}).apply();

new Override(Item, Item.autoEquipCheck, function (original, item) {
  return personalAutoEquip.checkItem(item) || (mercAutoEquip && mercAutoEquip.checkItem(item));
});
