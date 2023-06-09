// Declare polyfills
// @ts-ignore
import {BodyLocations, PickitResult, CharClasses, Qualities, StorageLocations, ShopModes, SpecType} from './enums'

declare global {
  interface Array<T> {
    includes(searchElement: T): boolean;

    find(predicate: (value: T, index: number, obj: Int8Array) => boolean, thisArg?: any): T | undefined;

    first(): T | undefined;

    last(): T | undefined;

    findIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number;

    intersection(other: T[]): T[];

    difference(other: T[]): T[];

    symmetricDifference(other: T[]): T[];

    flat(depth?: number): T[];

    compactMap(callback: (value: T, index: number, obj: T[]) => any, thisArg?: any): any[];

    groupBy<K extends (string | symbol)>(
      callback: (value: T, index: number, array: T[]) => K,
      thisArg?: any
    ): { [P in K]: T[] }

    groupByToMap<K>(
      callback: (value: T, index: number, array: T[]) => K,
      thisArg?: any
    ): Map<K, T[]>
  }

  interface ReadonlyArray<T> {
    find(predicate: (value: T, index: number, obj: Int8Array) => boolean, thisArg?: any): T | undefined;
  }

  interface String {
    diffCount(a: string): number

    startsWith(a: string): boolean
  }

  interface ObjectConstructor {
    assign<T, U>(target: T, source: U): T & U;

    assign<T, U, V>(target: T, source1: U, source2: V): T & U & V;

    assign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;

    assign(target: object, ...sources: any[]): any;

    values(source: object): any[];

    entries(source: object): any[][];

    is(o1: any, o2: any): boolean;
  }

  interface Object {
    distance: number,
    path: PathNode[] | undefined;

    setPrototypeOf(obj: object, proto: object)
  }

  interface ObjectUnit extends Unit {
    objtype: number;
  }

  type actType = { initialized: boolean, spot: { [data: string]: [number, number] } };

  interface TownInstance {
    tasks: { Heal: string, Shop: string, Gamble: string, Repair: string, Merc: string, Key: string, CainID: string }[];
    act: [actType, actType, actType, actType],
    ignoredItemTypes: number[];

    doChores(repair?: boolean): void,

    checkQuestItems(): void,

    initNPC(task, reason): false | Monster,

    heal(): void,

    needHealing(): void,

    buyPotions(): void,

    shiftCheck(col, beltSize): boolean,

    checkColumns(beltSize): number[],

    getPotion(npc, type):ItemUnit,

    fillTome(code): void,

    checkScrolls(id): number,

    identify(): void,

    cainID(): void,

    fieldID(): boolean,

    getUnids(): ItemUnit[] | false,

    identifyItem(unit, tome): boolean,

    shopItems(): void,

    gamble(): void,

    needGamble(): void,

    getGambledItem(list): void,

    buyAntidotes(quantity): void,

    buyKeys(): void,

    checkKeys(): void,

    needKeys(): void,

    wantKeys(): void,

    repairIngredientCheck(item): boolean,

    cubeRepair(): void,

    cubeRepairItem(item): void,

    repair(force?: boolean): void,

    needRepair(): void,

    getItemsForRepair(repairPercent, chargedItems): ItemUnit[],

    reviveMerc(): void,

    needMerc(): boolean,

    canStash(item): boolean,

    stash(stashGold): void,

    needStash(): void,

    openStash(): boolean,

    getCorpse(): void,

    checkShard(): void,

    clearBelt(): void,

    clearScrolls(): void,

    clearInventory(): void,

    initialize(): void,

    move(spot): void,

    moveToSpot(spot): boolean,

    goToTown(act?: 1 | 2 | 3 | 4 | 5, wpmenu?: boolean): void,

    visitTown(repair?: boolean): boolean,

    // Additional crap

    emit<S = this>(key: "initNPC", npc?: Monster): this

    on<S = this>(key: "initNPC", handler: (this: S, npc?: Monster) => void): this

    once<S = this>(key: "initNPC", handler: (this: S, npc?: Monster) => void): this

    canTpToTown(): boolean;
  }

  const Town: TownInstance;

  type Config = {};

  const Scripts: { [data: string]: Partial<Config> | boolean };

  const Loader: {
    fileList: string[],
    scriptList: string[],
    scriptIndex: number,
    skipTown: string[],

    init: () => void,
    getScripts: () => void,
    clone: (obj) => void,
    copy: (from, to) => void,
    loadScripts: () => void,
    scriptName: (offset?: number) => void,
  }

  type potType = 'hp' | 'mp' | 'rv';

  const Config: {

    // Time
    StartDelay: number,
    PickDelay: number,
    AreaDelay: number,
    MinGameTime: number,
    MaxGameTime: number,

    // Healing and chicken
    LifeChicken: number,
    ManaChicken: number,
    UseHP: number,
    UseMP: number,
    UseRejuvHP: number,
    UseRejuvMP: number,
    UseMercHP: number,
    UseMercRejuv: number,
    MercChicken: number,
    IronGolemChicken: number,
    HealHP: number,
    HealMP: number,
    HealStatus: boolean,

    // starts town thread

    // uncommented so we dont activate kolbots town chicken by mistake
    // TownCheck: boolean,
    // TownHP: number,
    // TownMP: number,

    // General
    AutoMap: boolean,
    LastMessage: "",
    UseMerc: boolean,
    MercWatch: boolean,
    LowGold: number,
    StashGold: number,
    FieldID: boolean,
    DroppedItemsAnnounce: {
      Enable: boolean,
      Quality: number[],
      LogToOOG: boolean,
      OOGQuality: number[]
    },
    CainID: {
      Enable: boolean,
      MinGold: number,
      MinUnids: number
    },
    Inventory: [
      [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
      [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
      [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
      [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1]
    ],
    LocalChat: {
      Enabled: boolean,
      Toggle: boolean,
      Mode: number
    },
    Silence: boolean,
    PublicMode: boolean,
    PartyAfterScript: boolean,
    Greetings: [],
    DeathMessages: [],
    Congratulations: [],
    ShitList: boolean,
    UnpartyShitlisted: boolean,
    Leader: "",
    QuitList: [],
    QuitListMode: number,
    QuitListDelay: [],
    HPBuffer: number | number[],
    MPBuffer: number | number[],
    RejuvBuffer: number,
    PickRange: 40,
    MakeRoom: boolean,
    ClearInvOnStart: boolean,
    FastPick: 0 | 1 | 2,
    ManualPlayPick: boolean,
    OpenChests: boolean,
    PickitFiles: string[],
    BeltColumn: [potType, potType, potType, potType],
    MinColumn: [0 | 1 | 2 | 3 | 4, 0 | 1 | 2 | 3 | 4, 0 | 1 | 2 | 3 | 4, 0 | 1 | 2 | 3 | 4],
    SkipEnchant: [],
    SkipImmune: [],
    SkipAura: [],
    SkipException: [],
    ScanShrines: [],
    Debug: boolean,

    AutoMule: {
      Trigger: [],
      Force: [],
      Exclude: []
    },

    ItemInfo: boolean,
    ItemInfoQuality: [],

    LogKeys: boolean,
    LogOrgans: boolean,
    LogLowRunes: boolean,
    LogMiddleRunes: boolean,
    LogHighRunes: boolean,
    LogLowGems: boolean,
    LogHighGems: boolean,
    SkipLogging: [],
    ShowCubingInfo: boolean,

    Cubing: boolean,
    CubeRepair: boolean,
    RepairPercent: 40,
    Recipes: [],
    MakeRunewords: boolean,
    Runewords: [number[], string, 0 | 1 | 2][],
    KeepRunewords: [],
    Gamble: boolean,
    GambleItems: [],
    GambleGoldStart: number,
    GambleGoldStop: number,
    MiniShopBot: boolean,
    TeleSwitch: boolean,
    MFSwitchPercent: number,
    PrimarySlot: -1,
    LogExperience: boolean,
    PingQuit: [{ Ping: number, Duration: number }],
    PacketShopping: boolean,

    // Fastmod
    FCR: number,
    FHR: number,
    FBR: number,
    IAS: number,
    PacketCasting: number,
    WaypointMenu: boolean,

    // Anti-hostile
    AntiHostile: boolean,
    RandomPrecast: boolean,
    HostileAction: number,
    TownOnHostile: boolean,
    ViperCheck: boolean,

    // DClone
    StopOnDClone: boolean,
    SoJWaitTime: number,
    KillDclone: boolean,
    DCloneQuit: boolean,

    // Experimental
    FastParty: boolean,
    AutoEquip: boolean,

    // GameData
    ChampionBias: 60,

    // Attack specific
    Dodge: boolean,
    DodgeRange: 15,
    DodgeHP: 100,
    AttackSkill: number[],
    LowManaSkill: number[],
    CustomAttack: {},
    TeleStomp: boolean,
    NoTele: boolean,
    ClearType: number,
    ClearPath: number | { Areas: number[], Range: number, Spectype: number },
    BossPriority: boolean,
    MaxAttackCount: 300,

    // Amazon specific
    LightningFuryDelay: number,
    SummonValkyrie: boolean,

    // Sorceress specific
    UseTelekinesis: boolean,
    CastStatic: number,
    StaticList: [],

    // Necromancer specific
    Golem: number,
    ActiveSummon: boolean,
    Skeletons: number,
    SkeletonMages: number,
    Revives: number,
    ReviveUnstackable: boolean,
    PoisonNovaDelay: 2000,
    Curse: [],
    ExplodeCorpses: number,

    // Paladin speficic
    Redemption: [0, 0],
    Charge: boolean,
    Vigor: boolean,
    AvoidDolls: boolean,

    // Barbarian specific
    FindItem: boolean,
    FindItemSwitch: boolean,

    // Druid specific
    Wereform: number,
    SummonRaven: number,
    SummonAnimal: number,
    SummonVine: number,
    SummonSpirit: number,

    // Assassin specific
    UseTraps: boolean,
    Traps: [],
    BossTraps: [],
    UseFade: boolean,
    UseBoS: boolean,
    UseVenom: boolean,
    UseCloakofShadows: boolean,
    AggressiveCloak: boolean,
    SummonShadow: boolean,

    // Custom Attack
    CustomClassAttack: '', // If set it loads common/Attack/[CustomClassAttack].js

    // Script specific
    MFLeader: boolean,
    Mausoleum: {
      KillBloodRaven: boolean,
      ClearCrypt: boolean
    },
    Eldritch: {
      OpenChest: boolean,
      KillSharptooth: boolean,
      KillShenk: boolean,
      KillDacFarren: boolean
    },
    Pindleskin: {
      UseWaypoint: boolean,
      KillNihlathak: boolean,
      ViperQuit: boolean
    },
    Nihlathak: {
      ViperQuit: boolean
    },
    Pit: {
      ClearPath: boolean,
      ClearPit1: boolean
    },
    Snapchip: {
      ClearIcyCellar: boolean
    },
    Frozenstein: {
      ClearFrozenRiver: boolean
    },
    Rakanishu: {
      KillGriswold: boolean
    },
    AutoBaal: {
      Leader: "",
      FindShrine: boolean,
      LeechSpot: [15115, 5050],
      LongRangeSupport: boolean
    },
    KurastChests: {
      LowerKurast: boolean,
      Bazaar: boolean,
      Sewers1: boolean,
      Sewers2: boolean
    },
    Countess: {
      KillGhosts: boolean
    },
    Baal: {
      DollQuit: boolean,
      SoulQuit: boolean,
      KillBaal: boolean,
      HotTPMessage: "Hot TP!",
      SafeTPMessage: "Safe TP!",
      BaalMessage: "Baal!"
    },
    BaalAssistant: {
      KillNihlathak: boolean,
      FastChaos: boolean,
      Wait: 120,
      Helper: boolean,
      GetShrine: boolean,
      GetShrineWaitForHotTP: boolean,
      DollQuit: boolean,
      SoulQuit: boolean,
      SkipTP: boolean,
      WaitForSafeTP: boolean,
      KillBaal: boolean,
      HotTPMessage: [],
      SafeTPMessage: [],
      BaalMessage: [],
      NextGameMessage: []
    },
    BaalHelper: {
      Wait: 120,
      KillNihlathak: boolean,
      FastChaos: boolean,
      DollQuit: boolean,
      KillBaal: boolean,
      SkipTP: boolean
    },
    Corpsefire: {
      ClearDen: boolean
    },
    Hephasto: {
      ClearRiver: boolean,
      ClearType: boolean
    },
    Diablo: {
      Entrance: boolean,
      SealWarning: "Leave the seals alone!",
      EntranceTP: "Entrance TP up",
      StarTP: "Star TP up",
      DiabloMsg: "Diablo",
      WalkClear: boolean,
      SealOrder: ["vizier", "seis", "infector"]
    },
    DiabloHelper: {
      Wait: 120,
      Entrance: boolean,
      SkipIfBaal: boolean,
      SkipTP: boolean,
      OpenSeals: boolean,
      SafePrecast: boolean,
      SealOrder: ["vizier", "seis", "infector"],
      RecheckSeals: boolean
    },
    MFHelper: {
      BreakClearLevel: boolean
    },
    Wakka: {
      Wait: 1
    },
    BattleOrders: {
      Mode: number,
      Getters: [],
      Idle: boolean,
      QuitOnFailure: boolean,
      SkipIfTardy: boolean,
      Wait: 10
    },
    BoBarbHelper: {
      Mode: -1,
      Wp: 35
    },
    Enchant: {
      Triggers: ["chant", "cows", "wps"],
      GetLeg: boolean,
      AutoChant: boolean,
      GameLength: 20
    },
    IPHunter: {
      IPList: [],
      GameLength: 3
    },
    Follower: {
      Leader: ""
    },
    Mephisto: {
      MoatTrick: boolean,
      KillCouncil: boolean,
      TakeRedPortal: boolean
    },
    ShopBot: {
      ScanIDs: [],
      ShopNPC: "anya",
      CycleDelay: number,
      QuitOnMatch: boolean
    },
    Coldworm: {
      KillBeetleburst: boolean,
      ClearMaggotLair: boolean
    },
    Summoner: {
      FireEye: boolean
    },
    AncientTunnels: {
      OpenChest: boolean,
      KillDarkElder: boolean
    },
    OrgTorch: {
      WaitForKeys: boolean,
      WaitTimeout: boolean,
      UseSalvation: boolean,
      GetFade: boolean,
      MakeTorch: boolean,
      AntidotesToChug: number
    },
    Synch: {
      WaitFor: []
    },
    TristramLeech: {
      Leader: "",
      Wait: 120
    },
    TravincalLeech: {
      Leader: "",
      Helper: boolean,
      Wait: 120
    },
    Tristram: {
      PortalLeech: boolean,
      WalkClear: boolean
    },
    Travincal: {
      PortalLeech: boolean
    },
    SkillStat: {
      Skills: []
    },
    Bonesaw: {
      ClearDrifterCavern: boolean
    },
    ChestMania: {
      Act1: [],
      Act2: [],
      Act3: [],
      Act4: [],
      Act5: []
    },
    ClearAnyArea: {
      AreaList: []
    },
    Rusher: {
      WaitPlayerCount: number,
      Radament: boolean,
      LamEsen: boolean,
      Izual: boolean,
      Shenk: boolean,
      Anya: boolean,
      LastRun: ""
    },
    Rushee: {
      Quester: boolean,
      Bumper: boolean
    },
    AutoSkill: {
      Enabled: boolean,
      Build: [],
      Save: number
    },
    AutoStat: {
      Enabled: boolean,
      Build: [],
      Save: number,
      BlockChance: number,
      UseBulk: boolean
    },
    AutoBuild: {
      Enabled: boolean,
      Template: "",
      Verbose: boolean,
      DebugMode: boolean
    }
  }

  const Misc: {
    screenshotErrors: any;
    errorConsolePrint: any;
    useItemLog: boolean;
    click(button, shift, unit: Unit): void,
    click(button, shift, x, y): void,
    inMyParty(name): void,
    findPlayer(name): Unit,
    getPlayerUnit(name): void,
    getPlayerAct(player): void,
    getNearbyPlayerCount(): void,
    getPlayerCount(): void,
    openChest(unit): boolean,
    openChestsInArea(area?, chestIds?): void,
    openChests(range): void,
    scanShrines(range): void,
    getShrine(unit): void,
    getShrinesInArea(area, type, use): void,
    getItemDesc(unit): void,
    getItemSockets(unit): void,
    itemLogger(action, unit: Unit, text?): void,
    logItem(action, unit, keptLine?): void,
    skipItem(id): void,
    shapeShift(mode): void,
    unShift(): void,
    townCheck(boolean?: boolean): void,
    spy(name): void,
    fileAction(path, mode, msg): void,
    errorReport(error: Error | string, script?: string): void,
    debugLog(msg): void,
    useMenu(id): void,
    clone(obj): void,
    copy(from): void,
    poll<T>(check: () => T, timeout?, sleep?): T,
    getUIFlags(excluded?: []): void,
  }

  const Pather: {
    getWalkDistance(x: number, y: number, area?: number, xx?: number, yy?: number, reductionType?: 0 | 1 | 2, radius?: number)
    wpAreas: number[];
    walkDistance: number;
    teleDistance: number;
    teleport: boolean,
    cancelFlags: number[],
    recursion: boolean,
    lastPortalTick: 0,
    useTeleport(): boolean,
    moveTo(x, y, retry?, clearPath?, pop?): boolean,
    teleportTo(x, y, maxRange?): void,
    walkTo(x, y, minDist?): boolean,
    openDoors(x, y): boolean,
    moveToUnit(unit: PathNode, offX?, offY?, clearPath?, pop?): boolean,
    moveToPreset(area, unitType, unitId, offX?, offY?, clearPath?, pop?): boolean,
    moveToExit(targetArea, use?, clearPath?): void,
    getNearestRoom(area): void,
    openExit(targetArea): void,
    openUnit(type, id): void,
    useUnit(type, id, targetArea): boolean,
    useWaypoint(targetArea: number | null, check?: boolean): boolean
    makePortal(use?): void,
    usePortal(targetArea?, owner?, unit?): boolean,
    getPortal(targetArea, owner?): ObjectUnit | false,
    getNearestWalkable(x, y, range, step, coll, size?): [number, number] | false,
    checkSpot(x, y, coll, cacheOnly, size): void,
    accessToAct(act): boolean,
    getWP(area, clearPath?): boolean,
    journeyTo(area): boolean,
    plotCourse(dest, src): false | { course: number[] },
    areasConnected(src, dest): void,
    getAreaName(area): string,
  }

  const Skill: {

    // Added by ryuk
    getClass(skillId): number
    getTab(skillid): number

    manaCostList: object;
    usePvpRange: boolean;
    getRange: (skillId) => number,
    getHand: (skillId) => number,
    cast(skillId, hand?, x?, y?, item?): boolean,
    cast(skillId, hand?, unit?: Unit): boolean,
    setSkill: (skillId, hand?, item?) => boolean,
    isTimed: (skillId) => boolean,
    wereFormCheck: (skillId) => boolean,
    townSkill: (skillId) => boolean,
    getManaCost: (skillId) => number,
    canUse(skillId: any): Boolean;
  }

  class Line {
    x: number
    y: number
    x2: number
    y2: number
    color: number
    visible: boolean

    constructor(x, y, x2, y2, color: number, visible: boolean)
  }

  interface PickitInstance {
    gidList: number[],
    beltSize: 1 | 2 | 3 | 4,
    ignoreLog: number[], // Ignored item types for item logging

    init: (notify) => void
    checkItem: (unit: Unit) => { result: PickitResult, line: null | number }
    pickItems: (range?: number, once?: boolean) => void
    canMakeRoom: () => boolean
    pickItem: (unit: Unit, status?, keptLine?) => boolean
    itemQualityToName: (quality) => string
    itemColor: (unit: Unit, type?: boolean) => string
    canPick: (unit: Unit) => boolean
    checkBelt: () => boolean
    sortItems: (unitA: Unit, unitB: Unit) => number
    sortFastPickItems: (unitA: Unit, unitB: Unit) => number
    fastPick: () => void

    // Additional crap
    on<S = this>(key: "pickedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    once<S = this>(key: "pickedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    off<S = this>(key: "pickedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    emit<S = this>(key: "pickedItem", item: ItemUnit, result: PickitResult): this


    on<S = this>(key: "pickList", handler: (this: S, item: ItemUnit[]) => void): this

    once<S = this>(key: "pickList", handler: (this: S, item: ItemUnit[]) => void): this

    off<S = this>(key: "pickList", handler: (this: S, item: ItemUnit[]) => void): this

    emit<S = this>(key: "pickList", item: ItemUnit[]): this

    // Additional crap
    on<S = this>(key: "checkItem", handler: (this: S, item: ItemUnit, result: {
      result: PickitResult,
      line: null | number
    }) => void): this

    once<S = this>(key: "checkItem", handler: (this: S, item: ItemUnit, result: {
      result: PickitResult,
      line: null | number
    }) => void): this

    off<S = this>(key: "checkItem", handler: (this: S, item: ItemUnit, result: {
      result: PickitResult,
      line: null | number
    }) => void): this

    emit<S = this>(key: "checkItem", item: ItemUnit, result: { result: PickitResult, line: null | number }): this


    // Additional crap
    on<S = this>(key: "identifiedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    once<S = this>(key: "identifiedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    off<S = this>(key: "identifiedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    emit<S = this>(key: "identifiedItem", item: ItemUnit, result: { result: PickitResult, line: null | number }): this


    on<S = this>(key: "pickedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    once<S = this>(key: "pickedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    off<S = this>(key: "pickedItem", handler: (this: S, item: ItemUnit, result: PickitResult) => void): this

    emit<S = this>(key: "pickedItem", item: ItemUnit, result: PickitResult): this
  }

  const Pickit: PickitInstance;

  function getUnits(type: 1, ...args: any): Monster[];
  function getUnits(type: 4, ...args: any): ItemUnit[];
  function getUnits(type: 2, ...args: any): ObjectUnit[];
  function getUnits(...args: any): Unit[];


  interface Unit { // not really things that normal kolbot have
    readonly name: string;
    readonly spectype: SpecType;
    readonly classid: number;
    readonly attackable: boolean;
    readonly dead: boolean;
    readonly islocked: boolean;
    beendead: boolean;

    on<S = this>(key: "levelUp", handler: (this: S, level: number) => void): this

    once<S = this>(key: "levelUp", handler: (this: S, level: number) => void): this

    emit<S = this>(key: "levelUp", level: number): this

    on<S = this>(key: "canStat", handler: (this: S, amount: number) => void): this

    once<S = this>(key: "canStat", handler: (this: S, amount: number) => void): this

    emit<S = this>(key: "canStat", amount: number): this

    on<S = this>(key: "canSkill", handler: (this: S, amount: number) => void): this

    once<S = this>(key: "canSkill", handler: (this: S, amount: number) => void): this

    emit<S = this>(key: "canSkill", amount: number): this

    on<S = this>(key: "quest", handler: (this: S, no: number, flags: number, old: number) => void): this

    once<S = this>(key: "quest", handler: (this: S, no: number, flags: number, old: number) => void): this

    emit<S = this>(key: "quest", no: number, flags: number, old: number): this
  }

  const Attack: {
    init(): void
    weaponSwitch(slot?): void
    checkSlot(slot?): void
    getPrimarySlot(): number
    getCustomAttack(unit: Unit): void
    getCharges(): void
    checkInfinity(): void
    kill(classId): void
    hurt(classId, percent): void
    getScarinessLevel(unit: Unit): number
    clear(range, spectype?, bossId?, sortfunc?, pickit?): void
    getMob(classid, spectype, range, center): void
    clearList(mainArg, sortFunc?, refresh?): void
    securePosition(x, y, range, timer, skipBlocked?, special?): void
    markRoom(room, color): void
    countUniques(): void
    storeStatistics(area): void
    clearLevel(spectype?): void
    sortMonsters(unitA: Unit, unitB: Unit): void
    validSpot(x: number, y: number): boolean
    openChests(range, x, y): void
    buildMonsterList(): void
    deploy(unit: Unit, distance, spread, range): void
    getMonsterCount(x, y, range, list): void
    buildGrid(xmin, xmax, ymin, ymax, spread): void
    getSkillElement(skillId): void
    getResist(unit: Unit, type): void
    checkResist(unit: Unit, type: "physical" | "fire" | "lightning" | "magic" | "cold" | "poison" | "none", maxres?): boolean
    canAttack(unit: Unit): void
    usingBow(): 'bow' | 'crossbow'
    getIntoPosition(unit: Unit, distance, coll, walk?): boolean
  }

  class Container {
    name: string;
    width: number
    height: number
    location: number
    buffer: []
    itemList: []
    openPositions: number

    Mark(item): void

    IsLocked(item, baseRef): void

    Reset(): void

    CanFit(item): boolean

    FindSpot(item): PathNode | false

    MoveTo(item): boolean

    Dump(): void

    UsedSpacePercent(): void

    Compare(baseRef): ItemUnit[] | false

    toSource(): void
  }

  const Storage: {
    StashY: 4 | 8
    Inventory: Container
    TradeScreen: Container
    Stash: Container
    Belt: Container
    Cube: Container
    InvRef: number[]
    BeltSize(): 1 | 2 | 3 | 4
    Reload(): void
  }

  const NTIP: {
    OpenFile(string, boolean);
    CheckItem(unit: Unit, entryList?: [] | false, verbose?: boolean)

  }


  const Cubing: {
    init(): void
    buildGemList(): void
    getCube(): void
    buildRecipes(): void
    buildLists(): void
    clearSubRecipes(): void
    update(): void
    checkRecipe(recipe): void
    getRecipeNeeds(index): void
    checkItem(unit): boolean
    keepItem(unit): boolean
    validItem(unit, recipe): void
    doCubing(): void
    cursorCheck(): void
    openCube(): void
    closeCube(): boolean
    emptyCube(): void
    makeRevPots(): void
  }

  const Runewords: {
    init(): void
    validItem(item): void
    buildLists(): void
    update(classid, gid): void
    checkRunewords(): void
    checkItem(unit): boolean
    keepItem(unit): boolean
    getBase(runeword, base, ethFlag, reroll): void
    socketItem(base, rune): void
    getScroll(): void
    makeRunewords(): void
    rerollRunewords(): void
  }

  const Item: {
    hasTier(item): void
    canEquip(item): void
    equip(item, bodyLoc): void
    getEquippedItem(bodyLoc): void
    getBodyLoc(item): void
    autoEquipCheck(item): boolean
    autoEquip(): void
  }

  const AutoMule: {
    getInfo(): boolean
    muleCheck(): void
    getMule(): void
    outOfGameCheck(): void
    inGameCheck(): void
    dropStuff(): void
    matchItem(item: ItemUnit, list): void
    getMuleItems(): ItemUnit[]
    utilityIngredient(item: ItemUnit): void
    cubingIngredient(item: ItemUnit): void
    runewordIngredient(item: ItemUnit): void
    dropCharm(dropAnni): void
    getMaster(info): void
    getMuleObject(mode, master): void
    getMuleFilename(mode, master): void
  }

  const DataFile: {
    create(): void
    getObj(): void
    getStats(): any
    updateStats(arg, value?): void
  }

  interface ClassAttackInstance {
    dangerAttack(): void,

    doAttack(unit: Monster, preattack?: boolean),

    afterAttack(any?: any),

    doCast(unit: Monster, timedSkill: number, untimedSkill: number, path?: PathNode[]),

    // Self defined
    decideSkill(unit: Monster, skipSkill?: number[]): [number, number]
  }

  const ClassAttack: ClassAttackInstance;

  const FileTools: {
    readText(filename: string)
    writeText(filename: string, data: string)
    appendText(filename: string, data: string)
    exists(filename: string): Boolean;
  }

  const NPC: {
    Akara: string,
    Gheed: string,
    Charsi: string,
    Kashya: string,
    Warriv: string,
    Fara: string,
    Drognan: string,
    Elzix: string,
    Greiz: string,
    Lysander: string,
    Jerhyn: string,
    Meshif: string,
    Atma: string,
    Ormus: string,
    Alkor: string,
    Hratli: string,
    Asheara: string,
    Jamella: string,
    Halbu: string,
    Tyrael: string,
    Malah: string,
    Anya: string,
    Larzuk: string,
    Qual_Kehk: string,
    Nihlathak: string,
    Cain: string,
  }

  function getCollision(area: number, x: number, y: number, x2: number, y2: number)

  const D2Bot: {
    init(): void
    sendMessage(handle, mode, msg): void
    printToConsole(msg, color?, tooltip?, trigger?): void
    printToItemLog(itemObj): void
    uploadItem(itemObj): void
    writeToFile(filename, msg): void
    postToIRC(ircProfile, recepient, msg): void
    ircEvent(mode): void
    notify(msg): void
    saveItem(itemObj): void
    updateStatus(msg): void
    updateRuns(): void
    updateChickens(): void
    updateDeaths(): void
    requestGameInfo(): void
    restart(keySwap?: boolean): void
    CDKeyInUse(): void
    CDKeyDisabled(): void
    CDKeyRD(): void
    stop(profile?, release?): void
    start(profile): void
    startSchedule(profile): void
    stopSchedule(profile): void
    updateCount(): void
    shoutGlobal(msg, mode): void
    heartBeat(): void
    sendWinMsg(wparam, lparam): void
    ingame(): void
    joinMe(profile, gameName, gameCount, gamePass, isUp): void
    requestGame(profile): void
    getProfile(): void
    setProfile(account, password, character, difficulty, realm, infoTag, gamePath): void
    setTag(tag): void
    store(info): void
    retrieve(): void
    remove(): void
  }

  function getDistance(unit: PathNode, other: PathNode): number;
  function getDistance(unit: PathNode, x: number, y: number): number;

  function clickItemAndWait(...args): void;

  /*************************************
   *          Unit description         *
   *          Needs expansion          *
   *************************************/
  type ItemType = 4;

  class ItemUnit extends Unit {
    readonly charclass: CharClasses;
    readonly identified: boolean;
    readonly quality: Qualities;
    readonly fname: string;
    readonly itemType: number;

    readonly twoHanded: boolean

    readonly code: string
    readonly isEquipped: boolean
    readonly dexreq: number
    readonly strreq: number
    readonly type: ItemType;
    readonly location: StorageLocations;
    readonly sizex: number;
    readonly sizey: number;
    readonly bodylocation: BodyLocations;
    readonly isInInventory: boolean;
    readonly isInBelt: boolean;
    readonly isInStash: boolean;
    readonly isRuneword: boolean;
    readonly ethereal: boolean;
    readonly isQuestItem: boolean;

    getColor(): number;

    getBodyLoc(): number[];

    getFlags(): number;

    getFlag(flag: number): boolean;

    shop(mode: ShopModes): boolean;

    getItemCost(type?: 0 | 1): number;

    sell();

    drop();

    equip(slot?: number);

    buy(shift?: boolean, gamble?: boolean);

    sellOrDrop(): void

    toCursor(): boolean
  }

  type UnitType = 0 | 1 | 2 | 3 | 4 | 5;
  type MonsterType = 1;

  interface Monster extends Unit {

  }

  class Monster extends Unit {
    charlvl: number;
    public type: MonsterType;
    itemcount: number;
    startTrade: (mode) => (any | boolean);

    getEnchant(type: number): boolean;

    openMenu(i?:number): boolean;

    readonly isChampion: boolean;

    readonly isUnique: boolean;

    readonly isMinion: boolean;

    readonly isSuperUnique: boolean;

    readonly isSpecial: boolean;

    readonly isWalking: boolean;

    readonly isRunning: boolean;

    readonly isMoving: boolean;

    readonly isChilled: boolean;

    readonly isFrozen: boolean;

    readonly currentVelocity: number;
  }

  type MissileType = 3;

  class Missile extends Unit {
    public type: MissileType;

    hits(position: PathNode): boolean;
  }

  class MercUnit extends Monster {
    equip(destination: number | undefined, item: ItemUnit)
  }

  class Unit {
    getItemsEx(): ItemUnit[];

    getStatEx(one: number, sub?: number);

    act: any;
    inTown: boolean;
    mode: number;
    idle: boolean;
    type: UnitType;
    hp: number;
    hpmax: number;
    gid: number;
    targetx: number;
    targety: number;
    owner: number;

    getNext(): Unit | false;

    cancel(number?: number): boolean;

    repair(): boolean;

    useMenu(): boolean;

    interact(): boolean;
    interact(area: number): boolean;

    getItem(classId?: number, mode?: number, unitId?: number): ItemUnit | false;
    getItem(name?: string, mode?: number, unitId?: number): ItemUnit | false;

    getItems(...args: any[]): ItemUnit[] | false;

    getItemsEx(...args: any[]): ItemUnit[];

    getMerc(): MercUnit ;

    getMercHP(): number | false;

    // me.getSkill(0-4); //
    getSkill(type: 0 | 1 | 2 | 3 | 4): number;
    getSkill(skillId: number, type: 0 | 1, item?: ItemUnit): number;

    getParent(): Unit | string ;

    overhead(msg: string): void ;

    getStat(index: number, subid?: number, extra?: number): number;

    getState(index: number, subid?: number): number;

    setSkill(skillId: number, hand: 0|1|number, item?: ItemUnit):boolean ;

    move(x: number, y: number) ;

    getQuest(quest: number, subid: number) ;

    getMinionCount(): number ;

    x: number;
    y: number;
    area: number;

    readonly rawStrength: number;
    readonly rawDexterity: number;
  }

  interface MeType extends Unit {
    fps: string;
    windowtitle: string;
    playertype: 0 | 1;
    weaponswitch: 0 | 1;
    gamepassword: string;
    gamestarttime: number;
    gamename: string;
    profile: string;
    mpmax: number;

    equip(destination: number | undefined, item: ItemUnit);

    findItem(arg0?: number | string, arg1?: number, arg2?: number): ItemUnit;

    ping: number;
    itemcount: number;
    gold: number;
    mp: number;
    staminamax: number;
    stamina: number;
    runwalk: number;
    gametype: 0 | 1;
    ingame: boolean;
    diff: 0 | 1 | 2;
    highestAct: 1 | 2 | 3 | 4 | 5;
    staminaDrainPerSec: number;
    staminaTimeLeft: number;
    staminaMaxDuration: number;
    mercrevivecost: number;
    automap: boolean;
    ladder: boolean;

    gameReady: boolean;
    charlvl: number;

    revive(): void;

    getRepairCost(): number;

    findItems(param, number?: number, number2?: number): ItemUnit[];

    readonly itemoncursor: boolean;

    blockMouse: boolean;
  }

  const me: MeType

  type PathNode = { x: number, y: number }

  function getUnit(type: 4, name?: string, mode?: number, unitId?: number): ItemUnit
  function getUnit(type: 4, classId?: number, mode?: number, unitId?: number): ItemUnit
  function getUnit(type: 1, name?: string, mode?: number, unitId?: number): Monster
  function getUnit(type: 1, classId?: number, mode?: number, unitId?: number): Monster
  function getUnit(type?: number, name?: string, mode?: number, unitId?: number): Unit
  function getUnit(type?: number, classId?: number, mode?: number, unitId?: number): Unit

  function getPath(area: number, fromX: number, fromY: number, toX: number, toY: number, reductionType: 0 | 1 | 2, radius: number): PathNode[] | false

  function getCollision(area: number, x: number, y: number)

  function getMercHP(): number

  function getCursorType(type: 1 | 3 | 6): boolean
  function getCursorType(): number

  function getSkillByName(name: string): number

  function getSkillById(id: number): string

  function getLocaleString(id: number)

// Never seen in the wild, not sure about arguments
  function getTextSize(name: string, size: number)

  function getThreadPriority(): number

  function getUIFlag(flag: number): boolean

  function getTradeInfo(mode: 0 | 1 | 2): boolean

  function getWaypoint(id: number): boolean

  class Script {
    getNext(): Script

    running: boolean

    stop()
  }


  function getScript(name?: string): Script | false

  function getScripts(): Script | false

  class Room {
    area: number;
    correcttomb: number;
    x: number;
    xsize: number;
    ysize: number;
    y: number;

    getNext(): Room | false;

    getNearby(): Room[];

    isInRoom(unit: PathNode): boolean
    isInRoom(x: number, y: number): boolean
  }

  function getRoom(area: number, x: number, y: number): Room | false
  function getRoom(x: number, y: number): Room | false
  function getRoom(area: number): Room | false
  function getRoom(): Room | false

  class Party {
    name: string;
    gid: number;
    level: number;
    partyid: number;

    getNext(): Party | false;
  }

  function getParty(unit?: Unit): Party | false

  class PresetUnit {
    id: number;

    getNext(): PresetUnit | false

    roomx: number
    x: number
    roomy: number
    y: number
  }

  function getPresetUnit(area?: number, objType?: number, classid?: number): PresetUnit | false
  function getPresetUnit(area?: number, objType?: 2, classid?: number): PresetUnit | false

  function getPresetUnits(area?: number, objType?: number, classid?: number): PresetUnit[] | false

  interface Exit {
    x: number,
    y: number,
    type: number,
    target: number,
    tileid: number,
  }

  class Area {
    getNext(): Area | false;

    exits: Exit[]
  }

  function getArea(id?: number): Area | false

  function getBaseStat(table: string, row: number, column: string | number): number | string
  function getBaseStat(row: number, column: string): number | string

  class Control {
    getNext(): Control | undefined;

    setText(text: string)

    getText(): string[]

    click(x?: number, y?: number)

    state
    password
    cursorpos
    selectstart
    selectend
    disabled
  }

  function getControl(type?: number, x?: number, y?: number, xsize?: number, ysize?: number): Control | false

  function getControls(type?: number, x?: number, y?: number, xsize?: number, ysize?: number): Control[]

  function getPlayerFlag(meGid: number, otherGid: number, type: number): boolean

  function getTickCount(): number

  function getInteractedNPC(): Monster | false

  function getIsTalkingNPC(): boolean

  function getDialogLines(): ({ handler(), text: string })[] | false

  function print(what: string|number): void

  function stringToEUC(arg): []

  function utf8ToEuc(arg): []

  function delay(ms: number): true

  function load(file: string): boolean

  function isIncluded(file: string): boolean

  function include(file: string): boolean

  function stacktrace(): true

  function rand(from: number, to: number): number

  function copy(what: string): void

  function paste(): string

  function sendCopyData(noIdea: null, handle: number, mode: number, data: string)
  function sendCopyData(noIdea: null, handle: string, mode: number, data: string)

  function sendDDE()

  function keystate()

  type eventName = 'gamepacket' | 'scriptmsg' | 'copydata' | 'keyup' | 'keydown'

  function addEventListener(eventType: 'gamepacket', callback: ((bytes: ArrayBufferLike) => boolean)): void
  function addEventListener(eventType: 'gamepacketsent', callback: ((bytes: ArrayBufferLike) => boolean)): void
  function addEventListener(eventType: 'scriptmsg', callback: ((data: string | object | number) => void)): void
  function addEventListener(eventType: 'copydata', callback: ((mode: number, msg: string) => void)): void
  function addEventListener(eventType: 'itemaction', callback: ((gid: number, mode?: number, code?: string, global?: true) => void)): void
  function addEventListener(eventType: 'keyup' | 'keydown', callback: ((key: number | string) => void)): void
  function addEventListener(eventType: 'chatmsg', callback: ((nick: string, msg: string) => void)): void
  function addEventListener(eventType: eventName, callback: ((...args: any) => void)): void

  function removeEventListener(eventType: 'gamepacket', callback: ((bytes: ArrayBufferLike) => boolean)): void
  function removeEventListener(eventType: 'gamepacketsent', callback: ((bytes: ArrayBufferLike) => boolean)): void
  function removeEventListener(eventType: 'scriptmsg', callback: ((data: string | object | number) => void)): void
  function removeEventListener(eventType: 'copydata', callback: ((mode: number, msg: string) => void)): void
  function removeEventListener(eventType: 'itemaction', callback: ((gid: number, mode?: number, code?: string, global?: true) => void)): void
  function removeEventListener(eventType: 'keyup' | 'keydown', callback: ((key: number) => void)): void
  function removeEventListener(eventType: 'chatmsg', callback: ((nick: string, msg: string) => void)): void
  function removeEventListener(eventType: eventName, callback: ((...args: any) => void)): void

  function clearEvent()

  function clearAllEvents()

  function js_strict()

  function version(): number

  function scriptBroadcast(what: string | object): void

  function sqlite_version()

  function sqlite_memusage()

  function dopen(path: string): false | { create(what: string) }

  function debugLog(text: string): void

  function showConsole(): void

  function hideConsole(): void

// out of game functions

  function login(name?: string): void

//
// function createCharacter())
// this function is not finished

  function selectCharacter()

  function createGame()

  function joinGame()

  function addProfile()

  function getLocation(): number

  function loadMpq()

// game functions that don't have anything to do with gathering data

  function submitItem(): void

  function getMouseCoords()

  function copyUnit<S extends Unit>(unit: S): S

  function clickMap(type: 0 | 1 | 2 | 3, shift: 0 | 1, x: number, y: number)

  function acceptTrade()

  function tradeOk()

  function beep(id?: number)

  function clickItem(where: 0 | 1 | 2, bodyLocation: number)
  function clickItem(where: 0 | 1 | 2, item: ItemUnit)
  function clickItem(where: 0 | 1 | 2, x: number, y: number)
  function clickItem(where: 0 | 1 | 2, x: number, y: number, location: number)
  function clickItem(where: number, x: number, y: number, location: number)

  function getDistance(a: Unit, b: Unit): number
  function getDistance(a: Unit, toX: number, toY: number): number
  function getDistance(fromX: number, fromY: number, b: Unit): number
  function getDistance(fromX: number, fromY: number, toX: number, toY: number): number

  function gold(amount: number, changeType?: 0 | 1 | 2 | 3 | 4): void

  function checkCollision(a: Unit, b: Unit, type: number): boolean

  function playSound(num: number): void

  function quit(): never

  function quitGame(): never

  function say(what: string): void

  function clickParty(player: Party, type: 0 | 1 | 2 | 3 | 4)

  function weaponSwitch(): void

  function transmute(): void

  function useStatPoint(type: number): void

  function useSkillPoint(type: number): void

  function takeScreenshot(): void

  function moveNPC(npc: Monster, x: number, y: number): void

  function getPacket(buffer: ArrayBuffer): void
  function getPacket(...args: { size: number, data: number }[]): void

  function sendPacket(buffer: ArrayBuffer): void
  function sendPacket(...number: number[]): void

  function getIP(): string

  function sendKey(key: number): void

  function revealLevel(unknown: true): void

// hash functions

  function md5(str: string): string

  function sha1(str: string): string

  function sha256(str: string): string

  function sha384(str: string): string

  function sha512(str: string): string

  function md5_file(str: string): string

  function sha1_file(str: string): string

  function sha256_file(str: string): string

  function sha384_file(str: string): string

  function sha512_file(str: string): string

  function checkCollisionBetween(x1: number, y1: number, x2: number, y2: number, size: number, collision: number): number

  function print(any: string): void

  class PacketBuilder {
    float(a: number): this

    dword(a: number): this

    word(a: number): this

    byte(a: number): this

    string(a): this

    send(): this

    spoof(): this
  }

  class console {
    static log(...whatever: any[]);

    static error(...whatever: any[]);

    static debug(...whatever: any[]);

    static warn(...whatever: any[]);
  }

  const Runeword: {
    AncientsPledge: number[];
    Black: number[];
    Fury: number[];
    HolyThunder: number[];
    Honor: number[];
    KingsGrace: number[];
    Leaf: number[];
    Lionheart: number[];
    Lore: number[];
    Malice: number[];
    Melody: number[];
    Memory: number[];
    Nadir: number[];
    Radiance: number[];
    Rhyme: number[];
    Silence: number[];
    Smoke: number[];
    Stealth: number[];
    Steel: number[];
    Strength: number[];
    Venom: number[];
    Wealth: number[];
    White: number[];
    Zephyr: number[];
    Beast: number[];
    Bramble: number[];
    BreathoftheDying: number[];
    CallToArms: number[];
    ChainsofHonor: number[];
    Chaos: number[];
    CrescentMoon: number[];
    Delirium: number[];
    Doom: number[];
    Duress: number[];
    Enigma: number[];
    Eternity: number[];
    Exile: number[];
    Famine: number[];
    Gloom: number[];
    HandofJustice: number[];
    HeartoftheOak: number[];
    Kingslayer: number[];
    Passion: number[];
    Prudence: number[];
    Sanctuary: number[];
    Splendor: number[];
    Stone: number[];
    Wind: number[];
    Brand: number[];
    Death: number[];
    Destruction: number[];
    Dragon: number[];
    Dream: number[];
    Edge: number[];
    Faith: number[];
    Fortitude: number[];
    Grief: number[];
    Harmony: number[];
    Ice: number[];
    Infinity: number[];
    Insight: number[];
    LastWish: number[];
    Lawbringer: number[];
    Oath: number[];
    Obedience: number[];
    Phoenix: number[];
    Pride: number[];
    Rift: number[];
    Spirit: number[];
    VoiceofReason: number[];
    Wrath: number[];
    Bone: number[];
    Enlightenment: number[];
    Myth: number[];
    Peace: number[];
    Principle: number[];
    Rain: number[];
    Treachery: number[];
    Test: number[];
  }

  const Roll: {
    All: 0,
    Eth: 1,
    NonEth: 2
  };

  interface StarterInterface {
    on<S = this>(key: "handle", handler: (this: S, value: number, oldValue: number) => void): this

    once<S = this>(key: "handle", handler: (this: S, value: number, oldValue: number) => void): this

    off<S = this>(key: "handle", handler: (this: S, value: number, oldValue: number) => void): this

    emit<S = this>(key: "handle", value: number): this

    on<S = this>(key: "gameInfo", handler: (this: S, value: number, oldValue: number) => void): this

    once<S = this>(key: "gameInfo", handler: (this: S, value: number, oldValue: number) => void): this

    off<S = this>(key: "gameInfo", handler: (this: S, value: number, oldValue: number) => void): this

    emit<S = this>(key: "gameInfo", value: number): this

    on<S = this>(key: "init", handler: (this: S) => void): this

    once<S = this>(key: "init", handler: (this: S) => void): this

    off<S = this>(key: "init", handler: (this: S) => void): this

    emit<S = this>(key: "init"): this

    gameInfo: {
      error: string,
      crashInfo: {
        currScript: number,
        area: number,
      },
      switchKeys: boolean,
    }
  }

  const Starter: StarterInterface
  const RyukStarter: StarterInterface
  const StarterConfig: {
    MinGameTime: number
    ResetCount: number
    SwitchKeyDelay: number
    ConnectingTimeout: number
    PleaseWaitTimeout: number
    WaitInLineTimeout: number
    GameDoesNotExistTimeout: number
    RealmDownDelay: number
    UnableToConnectDelay: number
    CDKeyInUseDelay: number
  }

  const ControlAction: {
    timeoutDelay(text, time, stopfunc?, arg?): void
    click(type, x, y, xsize, ysize): void
    setText(type, x, y, xsize, ysize, text): void
    getText(type, x, y, xsize, ysize): string
    joinChannel(channel): void
    createGame(name, pass, diff, delay): void
    clickRealm(realm: 0 | 1 | 2 | 3): void
    loginAccount(info): void
    makeAccount(info): void
    findCharacter(info): void
    getCharacters(): void
    getPosition(): void
    loginCharacter(info, startFromTop?: boolean): void
    makeCharacter(info): void
    getGameList(): void
  }

  interface GameTable {

  }

  interface GameTableRunes extends GameTable {
    name: string
    rune: string
    complete: number,
    server: number,
    itype1: number,
    itype2: number,
    itype3: number,
    itype4: number,
    itype5: number,
    itype6: number,
    etype1: number,
    etype2: number,
    etype3: number,
    rune1: number,
    rune2: number,
    rune3: number,
    rune4: number,
    rune5: number,
    rune6: number,
    t1code1: number,
    t1param1: number,
    t1min1: number,
    t1max1: number,
    t1code2: number,
    t1param2: number,
    t1min2: number,
    t1max2: number,
    t1code3: number,
    t1param3: number,
    t1min3: number,
    t1max3: number,
    t1code4: number,
    t1param4: number,
    t1min4: number,
    t1max4: number,
    t1code5: number,
    t1param5: number,
    t1min5: number,
    t1max5: number,
    t1code6: number,
    t1param6: number,
    t1min6: number,
    t1max6: number,
    t1code7: number,
    t1param7: number,
    t1min7: number,
    t1max7: number,
  }

  interface GameTableHireling extends GameTable {
    version: number
    id: number
    class: number
    act: number
    difficulty: number
    seller: number
    gold: number
    level: number
    exp: number
    hp: number
    hpperlevel: number
    defense: number
    def: number
    str: number
    strperlevel: number
    dex: number
    dexperlevel: number
    ar: number
    arperlvl: number
    share: number
    dmg: number
    dmgperlvl: number
    dmgperleve: number
    resist: number
    resistperlevel: number
    defaultchance: number
    head: number
    torso: number
    weapon: number
    shield: number
    skill1: number
    skill2: number
    skill3: number
    skill4: number
    skill5: number
    skill6: number
    chance1: number
    chance2: number
    chance3: number
    chance4: number
    chance5: number
    chance6: number
    chanceperlvl1: number
    chanceperlvl2: number
    chanceperlvl3: number
    chanceperlvl4: number
    chanceperlvl5: number
    chanceperlvl6: number
    mode1: number
    mode2: number
    mode3: number
    mode4: number
    mode5: number
    mode6: number
    level1: number
    level2: number
    level3: number
    level4: number
    level5: number
    level6: number
    lvlperlvl1: number
    lvlperlvl2: number
    lvlperlvl3: number
    lvlperlvl4: number
    lvlperlvl5: number
    lvlperlvl6: number
    hiredesc: number
    namefirst: string
    namelast: string
  }

  interface GameTableProperties extends GameTable {
    code: number,
    set1: number,
    set2: number,
    set3: number,
    set4: number,
    set5: number,
    set6: number,
    set7: number,
    val1: number,
    val2: number,
    val3: number,
    val4: number,
    val5: number,
    val6: number,
    val7: number,
    func1: number,
    func2: number,
    func3: number,
    func4: number,
    func5: number,
    func6: number,
    func7: number,
    stat1: number,
    stat2: number,
    stat3: number,
    stat4: number,
    stat5: number,
    stat6: number,
    stat7: number,
  }

  interface GameTableMissile extends GameTable {
    Missile: 1,
    LastCollide: boolean,
    Explosion: boolean,
    Pierce: boolean,
    CanSlow: boolean,
    CanDestroy: boolean,
    ClientSend: boolean,
    GetHit: boolean,
    SoftHit: boolean,
    ApplyMastery: boolean,
    ReturnFire: boolean,
    Town: boolean,
    SrcTown: boolean,
    NoMultiShot: boolean,
    NoUniqueMod: boolean,
    Half2HSrc: boolean,
    MissileSkill: boolean,
    pCltDoFunc: boolean,
    pCltHitFunc: boolean,
    pSrvDoFunc: boolean,
    pSrvHitFunc: boolean,
    pSrvDmgFunc: boolean,
    TravelSound: number,
    HitSound: boolean,
    ExplosionMissile: number,
    SubMissile1: number,
    SubMissile2: number,
    SubMissile3: number,
    CltSubMissile1: number,
    CltSubMissile2: number,
    CltSubMissile3: number,
    HitSubMissile1: number,
    HitSubMissile2: number,
    HitSubMissile3: number,
    HitSubMissile4: number,
    CltHitSubMissile1: number,
    CltHitSubMissile2: number,
    CltHitSubMissile3: number,
    CltHitSubMissile4: number,
    ProgSound: number,
    ProgOverlay: number,
    Param1: number,
    Param2: number,
    Param3: number,
    Param4: number,
    Param5: number,
    sHitPar1: number,
    sHitPar2: number,
    sHitPar3: number,
    CltParam1: number,
    CltParam2: number,
    CltParam3: number,
    CltParam4: number,
    CltParam5: number,
    cHitPar1: number,
    cHitPar2: number,
    cHitPar3: number,
    dParam1: number,
    dParam2: number,
    SrvCalc1: number,
    CltCalc1: number,
    SHitCalc1: number,
    CHitCalc1: number,
    DmgCalc1: number,
    HitClass: number,
    Range: number,
    LevRange: number,
    Vel: number,
    VelLev: number,
    MaxVel: number,
    Accel: number,
    animrate: number,
    xoffset: number,
    yoffset: number,
    zoffset: number,
    HitFlags: number,
    ResultFlags: number,
    KnockBack: number,
    MinDamage: number,
    MaxDamage: number,
    MinLevDam1: number,
    MinLevDam2: number,
    MinLevDam3: number,
    MinLevDam4: number,
    MinLevDam5: number,
    MaxLevDam1: number,
    MaxLevDam2: number,
    MaxLevDam3: number,
    MaxLevDam4: number,
    MaxLevDam5: number,
    DmgSymPerCalc: number,
    EType: string,
    EMin: number,
    EMax: number,
    MinELev1: number,
    MinELev2: number,
    MinELev3: number,
    MinELev4: number,
    MinELev5: number,
    MaxELev1: number,
    MaxELev2: number,
    MaxELev3: number,
    MaxELev4: number,
    MaxELev5: number,
    EDmgSymPerCalc: number,
    ELen: number,
    ELevLen1: number,
    ELevLen2: number,
    ELevLen3: number,
    CltSrcTown: number,
    SrcDamage: number,
    SrcMissDmg: number,
    Holy: number,
    Light: number,
    Flicker: number,
    Red: number,
    Green: number,
    Blue: number,
    InitSteps: number,
    Activate: number,
    LoopAnim: number,
    CelFile: string,
    AnimLen: number,
    RandStart: number,
    SubLoop: number,
    SubStart: number,
    SubStop: number,
    CollideType: number,
    Collision: number,
    ClientCol: number,
    CollideKill: number,
    CollideFriend: number,
    NextHit: number,
    NextDelay: number,
    Size: number,
    ToHit: number,
    AlwaysExplode: number,
    Trans: number,
    Qty: number,
    SpecialSetup: number,
    Skill: number,
    HitShift: number,
    DamageRate: number,
    NumDirections: number
  }

  interface GameTableGems extends GameTable {
    Name: string,
    Letter: string,
    Transform: number,
    Code: string,
    Nummods: number,
    WeaponMod1: number,
    WeaponMod2: number,
    WeaponMod3: number,
    WeaponMod1Param: number,
    WeaponMod2Param: number,
    WeaponMod3Param: number,
    WeaponMod1Min: number,
    WeaponMod2Min: number,
    WeaponMod3Min: number,
    WeaponMod1Max: number,
    WeaponMod2Max: number,
    WeaponMod3Max: number,
    HelmMod1: number,
    HelmMod2: number,
    HelmMod3: number,
    HelmMod1Param: number,
    HelmMod2Param: number,
    HelmMod3Param: number,
    HelmMod1Min: number,
    HelmMod2Min: number,
    HelmMod3Min: number,
    HelmMod1Max: number,
    HelmMod2Max: number,
    HelmMod3Max: number,
    ShieldMod1: number,
    ShieldMod2: number,
    ShieldMod3: number,
    ShieldMod1Param: number,
    ShieldMod2Param: number,
    ShieldMod3Param: number,
    ShieldMod1Min: number,
    ShieldMod2Min: number,
    ShieldMod3Min: number,
    ShieldMod1Max: number,
    ShieldMod2Max: number,
    ShieldMod3Max: number
  }

  function getTableRow(name: 'runes', idx: number): GameTableRunes;
  function getTableRow(name: 'hireling', idx: number): GameTableHireling;
  function getTableRow(name: 'properties', idx: number): GameTableProperties;
  function getTableRow(name: 'missiles', idx: number): GameTableMissile;
  function getTableRow(name: 'gems', idx: number): GameTableGems;
  function getTableRow(name: string, idx: number): object;

  function getTableSize(name: string);
}
export {};