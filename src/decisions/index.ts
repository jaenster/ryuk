import Script from '../scripts/Script';
import {Decision} from "./decision";
import sdk from "../sdk";
import {gotWp, haveWp, talkTo} from "../scripts/util";
import {findActiveBuild} from "../lib/AutoBuild";
import CharData from '../lib/CharData';
import ExperienceData from '../lib/data/ExperienceData';
import {getTownForQuest} from "../lib/utilities";
import {StorageLocations} from "../enums";

class MagicFind extends Decision {
  public run() {
  }
}

class Quit extends Decision {
  public run() {
    print('NOT QUITTING, DEBUG');
    while (true) {
      delay(1000);
    }
  }
}

const modeTestCallback = function (test) {
  if (test & Mode.XPAC && !(test & Mode.CLASSIC) && !me.gametype) return false;
  if (test & Mode.CLASSIC && !(test & Mode.XPAC) && me.gametype) return false;

  if (test & Mode.HARDCORE && !(test & Mode.SOFTCORE) && !me.playertype) return false;
  if (test & Mode.SOFTCORE && !(test & Mode.HARDCORE) && me.playertype) return false;

  return true;
}


type DecisionTree = {
  description?: string,
  mode?: number[],
  depend?: number,
  skipAfter?: number | number[],
  runFirst?: string,
  do?: (() => boolean),
  level?: { min: number } | { max: number },
  gold?: { min: number } | { max: number },
  difficulty?: ('normal' | 'nightmare' | 'hell') | ('normal' | 'nightmare' | 'hell')[],
} & ({ name: string, } | { children: DecisionTree[] })

enum Mode {
  CLASSIC = 1 << 0,
  XPAC = 1 << 1,
  SOFTCORE = 1 << 2,
  HARDCORE = 1 << 3,
}

function hasChildren<T>(test: T): test is (T & { children: DecisionTree[] }) {
  return test.hasOwnProperty('children');
}

export default function (): Decision {
  if (me.inTown) Town.doChores();

  let broke = false; // ToDo, figure out if we are broke. if not, we can do some stuff before other quests

  if (me.inTown) {

    let didSomething;
    const itemHandlers: {
      quest: number,
      itemClassId: number,
      npc?: string,
      consume?: true,
    }[] = [
      {
        quest: sdk.quests.LamEsensTome,
        itemClassId: sdk.items.LamEsensTome,
        npc: NPC.Alkor,
      },
      {
        quest: sdk.quests.TheGoldenBird,
        itemClassId: sdk.items.JadeFigurine,
        npc: NPC.Meshif,
      },
      {
        quest: sdk.quests.TheGoldenBird,
        itemClassId: sdk.items.TheGoldenBird,
        npc: NPC.Alkor,
      },
      {
        quest: sdk.quests.TheGoldenBird,
        itemClassId: sdk.items.PotOfLife,
        consume: true,
      },
      {
        quest: sdk.quests.RadamentsLair,
        itemClassId: sdk.items.BookOfSkill,
        consume: true,
      },
      {
        quest: sdk.quests.PrisonOfIce,
        itemClassId: sdk.items.ResScroll,
        consume: true,
      },
    ];
    do {
      didSomething = false;

      itemHandlers.forEach((el, index) => {
        const town = getTownForQuest(el.quest);
        if (!Pather.accessToAct(town)) return;

        const item = me.getItemsEx().find(item => item.classid === el.itemClassId);
        if (item) {
          // In case we are failing, simply do it again this loop in town
          itemHandlers.splice(index, 1);

          Town.goToTown(town);
          if (typeof el.npc === 'string') {
            console.log('Going to talk to ' + el.npc + ' for ' + Object.keys(sdk.quests).find(q => sdk.quests[q] === el.quest) + ' with ' + item.name);
            talkTo(el.npc);
          }

          if (typeof el.consume === 'boolean' && el.consume) {
            if (item.location !== StorageLocations.Equipment) {
              if (!me.inTown) return;
              switch (item.location) {
                case StorageLocations.Cube:
                //@ToDo: dont need to open stash if cube is inventory but whatever
                case StorageLocations.Stash:
                  Town.openStash();
                  Storage.Inventory.MoveTo(item);
              }
            }
            console.log('consume ' + item.name);
            clickItem(1, item);
          }
          didSomething = true;
        }
      })
    } while (didSomething)
  }

  if (me.inTown) {

    const talkTree: {
      name: string
      quest: number,
      subId?: {
        set?: number[],
        not?: number[],
      },
      npc?: string,
      useMenu?: number,
      action?: () => void,
      mode?: number[],
    }[] = [
      // act 1 shit
      /*{
          name: 'welcome warriv',
          quest: sdk.quests.SpokeToWarriv,
          subId: {
              not: [0],
          },
          npc: NPC.Warriv
      },*/
      {
        name: 'get akara award',
        quest: sdk.quests.DenOfEvil,
        subId: {
          set: [1],
          not: [0],
        },
        npc: NPC.Akara,
      },
      {
        name: 'bloodraven talk with kashya',
        quest: sdk.quests.SistersBurialGrounds,
        subId: {
          set: [1],
          not: [0],
        },
        npc: NPC.Kashya
      },
      {
        name: 'travel to act 2',
        quest: sdk.quests.SistersToTheSlaughter,
        subId: {
          set: [1],
          not: [0],
        },
        npc: NPC.Warriv,
        useMenu: sdk.menu.GoEast,
      },

      // act 2 shit
      {
        name: 'talk to Atma',
        quest: sdk.quests.RadamentsLair,
        subId: {
          set: [1],
          not: [0],
        },
        npc: NPC.Atma,
      },
      {
        name: 'talk to drogan about darkness',
        quest: sdk.quests.TheTaintedSun,
        subId: {
          set: [2],
          not: [3, 0],
        },
        npc: NPC.Drognan,
      },
      // { //ToDo; see wtf is going wrong here
      //     name: 'talk to cain to enter palace',
      //     quest: sdk.quests.TheTaintedSun,
      //     subId: {
      //         set: [0],
      //         not: [2, 3],
      //     },
      //     npc: NPC.Cain,
      // },
      {
        name: 'talk to cain once we have the staff',
        quest: sdk.quests.TheHoradricStaff,
        subId: {
          set: [11], //I assembled the Horadric Staff thanks to the Cube
          not: [10], //I talked to Cain with the Horadric Staff assembled
        },
        npc: NPC.Cain,
      },
      {
        name: 'talk to jerhern',
        quest: sdk.quests.TheSevenTombs,
        subId: {
          set: [3], // A party member talked to Tyrael. Q text: "Talk to Jerhyn"
          not: [0],
        },
        npc: NPC.Jerhyn,
        action() {
          Pather.moveToExit(sdk.areas.HaremLvl1, true);
          Pather.makePortal(true);
        }
      },
      {
        name: 'talk to Meshif',
        quest: sdk.quests.TheSevenTombs,
        subId: {
          set: [4], // I talked to Jerhyn after Tyrael. 3 is reset to false
          not: [3, 0], // A party member talked to Tyrael. Q text: "Talk to Jerhyn"
        },
        npc: NPC.Meshif,
        useMenu: sdk.menu.SailEast
      },

      // act 3 shit
      {
        name: 'talk to Hratli',
        quest: sdk.quests.SpokeToHratli,
        subId: {
          not: [0],
        },
        npc: NPC.Hratli,
      },
      {
        name: 'Talk with alkor for hp pot',
        quest: sdk.quests.TheGoldenBird,
        subId: {
          set: [1],
          not: [0],
        },
        npc: NPC.Alkor,
      },
      {
        name: 'Back to Town with the Lam Esens Tome',
        quest: sdk.quests.LamEsensTome,
        subId: {
          set: [1],
          not: [0],
        },
        npc: NPC.Alkor,
      },

      // act 4
      {
        name: 'talk Tyreal after Izual',
        quest: sdk.quests.TheFallenAngel,
        subId: {
          set: [1], // Talk to tyreal
          not: [0],
        },
        npc: NPC.Tyrael,
      },
      {
        name: 'talk Tyreal after Izual',
        quest: sdk.quests.TheFallenAngel,
        subId: {
          set: [5], // Talk to his soul, aka talk to tyreal (skip it)
          not: [0],
        },
        npc: NPC.Tyrael,
      },
      {
        name: 'talk Tyreal after Diablo',
        quest: sdk.quests.TerrorsEnd,
        subId: {
          set: [0], // 0 & 13: A party member killed Diablo
          not: [9], // 9: I talked to Tyrael (congratulations & if not already, portal to act 5 opened)
        },
        npc: NPC.Tyrael,
        mode: [Mode.XPAC],
        action() {
          let portal = Misc.poll(() => getUnit(2, sdk.units.RedPortalToAct5), 1000, 30);
          if (portal) Pather.usePortal(null, null, getUnit(2, sdk.units.RedPortalToAct5))
          if (!Misc.poll(() => me.area === sdk.areas.Harrogath, 1000, 30)) {
            talkTo(NPC.Tyrael, false);
            Misc.useMenu(sdk.menu.TravelToHarrogath)
          }
          if (!Misc.poll(() => me.area === sdk.areas.Harrogath, 1000, 30)) Pather.useWaypoint(sdk.areas.Harrogath);
        }
      },

      // act 5
      {
        name: 'Get scroll after Anya',
        quest: sdk.quests.PrisonOfIce,
        subId: {
          set: [1], // A party member freed frozen Anya with the potion from Malah
          not: [8], // I talked to Malah to get the Scroll of Resistance (in inventory or on the floor)
        },
        npc: NPC.Malah,
      },
      {
        name: 'Talk with anya for reward and to open portal',
        quest: sdk.quests.PrisonOfIce,
        subId: {
          set: [8], // A party member freed frozen Anya with the potion from Malah
          not: [10], // I talked to the released Anya in town & obtained rare item reward & opened red TP to Nilhatak
        },
        npc: NPC.Anya,
      }
    ];

    if (me.act === 1 && me.inTown && me.getQuest(0, 0) === 0) {
      console.log('Warriv test');

      const warriv = getUnit(1, NPC.Warriv);
      // Do quest talked with warriv
      sendPacket(1, 0x31, 4, warriv.gid, 4, 0x0)
    } else {
      console.log('talked with warriv');
    }

    do {
      let filtered = talkTree.filter(el => {
        const town = getTownForQuest(el.quest);
        if (!Pather.accessToAct(town)) return

        if (typeof el.mode !== 'undefined') {
          if (!el.mode.some(modeTestCallback)) return false;
        }

        let [set, not] = [el.subId?.set || [], el.subId?.not || []];

        return (set.every(sub => me.getQuest(el.quest, sub)) && !not.some(sub => me.getQuest(el.quest, sub)));
      })
        .map(el => ({...el, town: getTownForQuest(el.quest)}))
        .sort((a, b) => a.town - b.town)

      filtered.forEach(el => {
        console.log('Town Stuff:', el.name);
        Town.goToTown(el.town);

        if (typeof el.npc === 'string') {
          console.log('Talking to', el.npc);
          const useMenu = typeof el.useMenu === 'number';
          talkTo(el.npc, !useMenu);
          if (useMenu) Misc.useMenu(el.useMenu);
        }

        if (typeof el.action === 'function') {
          console.log('doing specific action');
          el.action();
        }
      })

      // Aslong we did town shit, repeat all as states might be different again
      // do this with a break to avoid declaring filtered outside of scope without typing
      if (!filtered.length) break;
    } while (true);
  }

  const progress = parseInt(ExperienceData.progress() as string) / 100;
  const myLevel = me.charlvl + progress;

  // Some in between leveling/questing stuff
  const decisionTree: DecisionTree[] = [
    {
      description: 'test',
      level: {
        min: 90,
      },
      children: [
        {
          name: 'Staff',
          do() {
            return !me.getItem(sdk.items.IncompleteStaff) && !me.getItem(sdk.items.FinishedStaff);
          }
        },
        {
          name: 'Amulet',
          do() {
            return !me.getItem(sdk.items.ViperAmulet) && !me.getItem(sdk.items.FinishedStaff);
          }
        },
        {
          name: 'Duriel',
        },
      ],

    },
    {
      description: 'leveling in nightmare',
      difficulty: 'nightmare',
      children: [
        {
          name: 'Countess',
          runFirst: 'Shriner',
          level: {
            min: 40,
            max: 52, // tower lvl 5 = 42 + champion (5) + range (5) = lvl 52
          },
        }
      ]
    },
    {
      description: 'Extras when are healhty',
      gold: {
        min: Town.doChoresGoldNeeded() //Config.LowGold * 1.5,
      },
      children: [
        {
          name: 'Radament',
          depend: sdk.quests.SistersToTheSlaughter,
          skipAfter: sdk.quests.RadamentsLair,
          level: {min: 18},
        },
        /*{
            name: 'Merc',
            mode: [Mode.XPAC],
            do() {
                return (me.diff === 0 && me.getQuest(sdk.quests.SistersBurialGrounds, 0) && CharData.merc.type === 0) ||
                    (Pather.accessToAct(2) && CharData.merc.type !== 2);
            },
        },*/
        {
          name: 'Izual',
          difficulty: 'normal',
          depend: sdk.quests.AbleToGotoActIV,
          skipAfter: sdk.quests.TheFallenAngel,
          do() { // If izual is killed we dont need it
            const build = findActiveBuild();

            // On normal, dont do izual if we are a blizz sorc without cold mastery, as izual got 75% cold res
            // from level 30, we can try. But, if we are still a firesorc we can pwn izual
            if (me.diff === 0) {
              // If we have blizzard but no cold mastery, rather do this later
              if (build.usedSkills.includes(sdk.skills.Blizzard) && !me.getSkill(sdk.skills.ColdMastery, 1)) return false;
            }
            return !me.getQuest(sdk.quests.TheFallenAngel, 0)
          }
        },
        {
          name: 'Izual',
          difficulty: 'nightmare',
          depend: sdk.quests.AbleToGotoActIV,
          skipAfter: sdk.quests.TheFallenAngel,
          level: {
            min: 55,
          }
        },
        {
          name: 'Anya',
          depend: sdk.quests.AbleToGotoActV,
          skipAfter: sdk.quests.PrisonOfIce,
          get do() { // If we free'd her, dont do her
            return me.getQuest(sdk.quests.PrisonOfIce, 8); // after we got the magical scroll
          },
          mode: [Mode.XPAC],
        },
        {
          name: 'DenOfEvil',
          difficulty: 'nightmare',
          skipAfter: sdk.quests.DenOfEvil,
        },
        {
          name: 'LamEssen',
          depend: sdk.quests.AbleToGotoActIII,
          skipAfter: sdk.quests.LamEsensTome,
        }
      ]
    },
    {
      description: 'Hire merc asap.',
      name: 'Merc',
      mode: [Mode.XPAC],
      gold: {
        min: Town.doChoresGoldNeeded()
      },
      do() {
        console.log('merc type; ' + CharData.merc.type)
        return (me.diff === 0 && me.getQuest(sdk.quests.SistersBurialGrounds, 0) && CharData.merc.type === 0) ||
          (Pather.accessToAct(2) && CharData.merc.type !== 2);
      }
    },
    {
      description: 'Act 1',
      skipAfter: sdk.quests.SistersToTheSlaughter,
      children: [
        {
          description: 'Act 1 normal',
          difficulty: 'normal',
          children: [
            {
              name: 'Cave',
              level: {
                max: 6
              },
            },
            {
              name: 'BloodRaven',
              skipAfter: sdk.quests.SistersBurialGrounds,
              level: {
                max: 13
              },
              // either on classic or on hardcore
              //mode: [Mode.CLASSIC, Mode.HARDCORE],
            },
            {
              name: 'Underground',
              do() {
                return !gotWp(sdk.areas.DarkWood);
              }
            },
            {
              name: 'Tristram',
              level: {
                max: 11,
                min: 6,
              },
              runFirst: 'Shriner',
              do() {
                // If we got the right waypoint, and we can do the quest
                return gotWp(sdk.areas.DarkWood) && !me.getQuest(sdk.quests.TheSearchForCain, 14);
              }
            },
            {
              name: 'Countess',
              runFirst: 'Shriner',
              do() {
                return gotWp(sdk.areas.DarkWood);
              },
            },

            {
              name: 'WalkFromBlackMarshToCatacombs',
              level: {
                min: 12, // before this level, it becomes a bit hairy
              },
              do() {
                return !gotWp(sdk.areas.CatacombsLvl2);
              }
            },
            {
              name: 'Andy',
              do() {
                return gotWp(sdk.areas.CatacombsLvl2);
              }
            },
          ],
        },
        {
          difficulty: ['nightmare', 'hell'],
          name: 'Andy',
        }
      ],
    },
    {
      description: 'Special leveling up to lvl 20',
      difficulty: 'normal',
      children: [
        {
          name: 'FarOasis',
          level: {
            max: 20,
          },
          do() {
            return gotWp(sdk.areas.FarOasis)
          },
          runFirst: 'Shriner',
        }
      ]
    },
    {
      description: 'Act 2',
      depend: sdk.quests.SistersToTheSlaughter,
      skipAfter: sdk.quests.AbleToGotoActIII,
      level: {
        min: 18, // Due to teleport
      },
      children: [
        {
          description: 'normal only',
          difficulty: 'normal',
          children: [
            {
              name: 'Staff',
              skipAfter: sdk.quests.TheHoradricStaff,
              gold: {
                min: Config.LowGold,
              },
              do() {
                return haveWp(sdk.areas.CanyonOfMagi) && !me.getItem(sdk.items.IncompleteStaff) && !me.getItem(sdk.items.FinishedStaff);
              }
            },
            {
              name: "Amulet",
              skipAfter: sdk.quests.TheHoradricStaff,
              do() {
                return haveWp(sdk.areas.CanyonOfMagi) && !me.getItem(sdk.items.ViperAmulet) && !me.getItem(sdk.items.FinishedStaff)
              }
            },
            {
              name: 'Cube',
              skipAfter: sdk.quests.TheHoradricStaff,
              gold: {
                min: Config.LowGold,
              },
              do() {
                return haveWp(sdk.areas.CanyonOfMagi)
              }
            },
          ],
        },
        {
          description: 'nightmare, hell only',
          difficulty: ['nightmare', 'hell'],
          children: [
            {
              name: 'Staff',
              skipAfter: sdk.quests.TheHoradricStaff,
              do() {
                return !(me.getItem(sdk.items.IncompleteStaff) || me.getItem(sdk.items.FinishedStaff));
              }
            },
            {
              name: 'Amulet',
              difficulty: ['nightmare', 'hell'],
              depend: sdk.quests.SistersToTheSlaughter,
              skipAfter: sdk.quests.TheTaintedSun,
            },
          ],
        },
        {
          name: 'TheSummoner',
          depend: sdk.quests.TheTaintedSun,
          skipAfter: sdk.quests.TheSevenTombs,
          level: {
            min: 18,
          },
          do() {
            return !haveWp(sdk.areas.CanyonOfMagi);
          }
        },
        {
          name: 'CubeStaff',
          depend: sdk.quests.SistersToTheSlaughter,
          skipAfter: sdk.quests.TheHoradricStaff,
          do() {
            return !!(me.getItem(sdk.items.IncompleteStaff) && me.getItem(sdk.items.ViperAmulet) && me.getItem(sdk.items.cube));
          }
        },
        {
          name: 'Duriel',
          depend: sdk.quests.TheArcaneSanctuary,
          skipAfter: sdk.quests.TheSevenTombs,
          do() {
            return me.getItem(sdk.items.FinishedStaff) || me.getQuest(sdk.quests.TheHoradricStaff, 0);
          }
        },
        // Special leveling shit
        {
          name: 'EarlyLevelAct2',
          difficulty: 'normal',
          level: {
            max: 18,
          },
          depend: sdk.quests.SistersToTheSlaughter,
          skipAfter: sdk.quests.TheArcaneSanctuary,
        },
      ],
    },
    {
      description: 'gaining some xp between lvl 18 and 19',
      name: 'BeetleJuice',
      level: {
        min: 18,
        max: 20,
      },
      // runFirst: 'Shriner',
      do() {
        return haveWp(sdk.areas.CanyonOfMagi);
      }
    },
    {
      description: 'Act 3',
      depend: sdk.quests.AbleToGotoActIII,
      skipAfter: sdk.quests.AbleToGotoActIV,
      children: [
        {
          difficulty: 'normal',
          name: 'RuinedTemples',
          level: {
            max: 24.01,
            min: 19,
          },
          runFirst: 'Shriner',
        },
        {
          name: 'KhalimsWill',
          skipAfter: sdk.quests.KhalimsWill,
          level: {
            min: 24,
          }
        },
        { // Always do meph if we can, it's good for drops
          name: 'Mephisto',
          depend: sdk.quests.KhalimsWill,
          skipAfter: sdk.quests.AbleToGotoActIV, // ToDo; fix that this depends on merc bugging
          runFirst: 'BugMerc',
          do() {
            return me.gold > Config.LowGold;
          }
        },
      ],
    },
    {
      description: 'Act 4',
      depend: sdk.quests.AbleToGotoActIV,
      skipAfter: sdk.quests.TerrorsEnd,
      children: [
        {
          // name: 'Diablo',
          name: 'TerrorsEndGlitch',
          difficulty: 'normal',
          level: {
            min: 24,
          }
        },
        {
          // name: 'Diablo',
          name: 'TerrorsEndGlitch',
          difficulty: "nightmare",
        },
      ]
    },
    { // cows
      mode: [Mode.CLASSIC],
      depend: sdk.quests.TerrorsEnd,
      children: [
        {
          name: 'Cows',
          difficulty: 'normal',
          level: {
            max: 34
          }
        }
      ]
    },
    {
      description: 'Act 5',
      depend: sdk.quests.AbleToGotoActV,
      mode: [Mode.XPAC],
      children: [
        {
          // free ral, ort, tal
          name: "RescueBarbs",
          difficulty: "normal",
          skipAfter: sdk.quests.RescueonMountArreat
        },
        // {
        //     name: 'Eldritch',
        // },
        // {
        //     name: 'Pindleskin',
        //     depend: sdk.quests.PrisonOfIce,
        //     mode: [Mode.SOFTCORE],
        // },
        {
          name: 'WaypointGetterAct5',
          depend: sdk.quests.AbleToGotoActV,
          skipAfter: sdk.quests.RiteOfPassage,
        },
        {
          name: 'Ancients',
          depend: sdk.quests.AbleToGotoActV,
          skipAfter: sdk.quests.RiteOfPassage,
          level: {
            min: 24,
          }
        },

        {
          name: 'Baal',
          depend: sdk.quests.RiteOfPassage,
          level: {
            min: 25,
          }
        },
      ]
    },
    { // If we are below lvl 20, its worth to do early level act 2 stuff to lvl, as pre lvl 20 ruined temple doesnt give that much xp
      name: 'EarlyLevelAct2',
      difficulty: 'normal',
      runFirst: 'Shriner',
      level: {
        max: 18,
      },
      depend: sdk.quests.SistersToTheSlaughter,
    },
    /** If low on gold do some specific shit */
    {
      description: 'LowGold handler',
      gold: {
        max: Config.LowGold,
      },
      children: [
        {
          description: 'Countess if we are leveling in act 2, and we dive under the gold count',
          name: 'Countess',
          skipAfter: sdk.quests.TheSevenTombs,
          depend: sdk.quests.SistersToTheSlaughter,
          gold: {
            max: Config.LowGold,
          },
        },
        {
          description: 'Countess if we are srsly low on gold. Once we did andy, otherwise it messes with original countess script',
          name: 'Countess',
          depend: sdk.quests.SistersToTheSlaughter,
          gold: {
            max: Config.LowGold / 10,
          },
        },
        {
          description: 'Act 3 chesting',
          name: 'Act3Chest',
          depend: sdk.quests.TheSevenTombs,
        }
      ],
    },
  ]

  let decision: DecisionTree & ({ name: string }) | undefined = undefined;

  decisionTree.some(function treeChecker(sq) {
    // Skip if not for this diff
    if (typeof sq.difficulty !== 'undefined') {
      const diffCheck = Array.isArray(sq.difficulty) ? sq.difficulty : [sq.difficulty];
      if (!diffCheck.includes((['normal', 'nightmare', 'hell'] as const)[me.diff])) return decision;
    }

    if (typeof sq.level === 'object' && sq/*!null*/) {
      if (sq.level.hasOwnProperty('max') && myLevel >= (sq.level as { max: number }).max) {
        return decision;
      }
      if (sq.level.hasOwnProperty('min') && myLevel < (sq.level as { min: number }).min) {
        return decision;
      }
    }

    if (typeof sq.gold === 'object' && sq/*!null*/) {
      if (sq.gold.hasOwnProperty('max') && me.gold >= (sq.gold as { max: number }).max) {
        return decision;
      }
      if (sq.gold.hasOwnProperty('min') && me.gold < (sq.gold as { min: number }).min) {
        return decision;
      }
    }

    // sometimes a quest only makes sense before doing another quest
    if ((typeof sq.skipAfter !== 'undefined')) {
      const arr = Array.isArray(sq.skipAfter) ? sq.skipAfter : [sq.skipAfter];
      if (arr.find(quest => me.getQuest(quest, 0))) {
        return decision;
      }
    }

    // if we dont have the actual quest, not much to do
    if (sq.depend && !me.getQuest(sq.depend, 0)) {
      return decision;
    }

    if (!hasChildren(sq) && Script.isDone(sq.name)) return decision;

    if (typeof sq.mode !== 'undefined') {
      if (!sq.mode.some(modeTestCallback)) return decision;
    }

    if (hasChildren(sq)) {
      sq.children.some(treeChecker);
      return decision;
    }

    if (typeof sq.do === 'function') {
      if (!!(sq.do())) decision = sq;
      return decision;
    }
    return decision = sq;
  })
  console.log(decision);
  if (decision) {
    if (typeof decision.runFirst === 'string' && !Script.isDone(decision.runFirst)) {
      console.debug('first run -- ' + decision.runFirst);
      return new Script(decision.runFirst);
    }
    if (typeof decision.description !== 'undefined') console.debug(decision.description)
    else console.debug('It should be ' + decision.name);
    return new Script(decision.name);
  }

  // Legacy, should be converted to decisionTree
  if (me.diff === 0) {

  }

  if (true) Weird: {
    if (true) break Weird;
    console.log('test');
  }

  return undefined;
}
