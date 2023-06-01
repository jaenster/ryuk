// @ts-ignore
export enum PickitResult {
  TO_IDENTIFY = -1,
  NONE = 0,
  PICKIT = 1,
  CUBING = 2,
  RUNEWORDS = 3,
  GOLD = 4,
  CRAFTING = 5,
  REPAIR = 6,
  RYUK = 7,
  RYUK_AEQUIP = 'AE',
  RYUK_AEQUIP_MERC = 'AEM',
}

export enum BodyLocations { // Same apply's for merc, but ofcourse with less things available
  None = 0,
  Head = 1,
  Neck = 2,
  Torso = 3, Armor = 3, // Kept on forgetting Torso, so added armor as an alias
  RightArm = 4,
  LeftArm = 5,
  RingRight = 6,
  RingLeft = 7,
  Belt = 8,
  Feet = 9,
  Gloves = 10,
  RightArmSecondary = 11,
  LeftArmSecondary = 12
};

export enum StorageLocations {
  Equipment = 1,
  Belt = 2,
  Inventory = 3,
  TradeWindow = 5, // Unchecked
  Cube = 6,
  Stash = 7,
};

export enum GameLocations {
  InGame = -1,
  None = 0,
  Lobby = 1,
  InLine = 2,
  LobbyChat = 3,
  CreateGame = 4,
  JoinGame = 5,
  Ladder = 6,
  Channel = 7,
  MainMenu = 8,
  Login = 9,
  LoginError = 10,
  UnableToConnect = 11,
  CharSelect = 12,
  RealmDown = 13,
  Disconnected = 14,
  NewChar = 15,
  CharacterSelectWait = 16,
  LostConnection = 17,
  Splash = 18,
  KeyInUse = 19,
  Difficulty = 20,
  MainMenuConnecting = 21,
  InvalidCDKey = 22,
  Connecting = 23,
  ServerDown = 24,
  PleaseWait = 25,
  GameExists = 26,
  Gateway = 27,
  GameDoesNotExist = 28,
  CharacterCreate = 29,
  CharacterCreateAlreadyExists = 30,
  AgreeToTerms = 31,
  CreateNewAccount = 32,
  PleaseRead = 33,
  RegisterEmail = 34,
  Credits = 35,
  Cinematics = 36,
  CharacterChangeRealm = 37,
  GameIsFull = 38,
  OtherMultiplayer = 39,
  TCPIP = 40,
  EnterIP = 41,
  CharacterSelectNoChars = 42,
  CharacterSelectChangeRealm = 43,
  CantConnectTCP = 44,
};

export enum CharClasses {
  Amazon = 0,
  Sorceress = 1,
  Necromancer = 2,
  Paladin = 3,
  Barbarian = 4,
  Druid = 5,
  Assassin = 6,
  All = 255
}

export enum Qualities {
  Low = 1,
  Normal = 2,
  Superior = 3,
  Magic = 4,
  Set = 5,
  Rare = 6,
  Unique = 7,
  Crafted = 8
}

export enum Runes {
  El = 610,
  Eld = 611,
  Tir = 612,
  Nef = 613,
  Eth = 614,
  Ith = 615,
  Tal = 616,
  Ral = 617,
  Ort = 618,
  Thul = 619,
  Amn = 620,
  Sol = 621,
  Shael = 622,
  Dol = 623,
  Hel = 624,
  Io = 625,
  Lum = 626,
  Ko = 627,
  Fal = 628,
  Lem = 629,
  Pul = 630,
  Um = 631,
  Mal = 632,
  Ist = 633,
  Gul = 634,
  Vex = 635,
  Ohm = 636,
  Lo = 637,
  Sur = 638,
  Ber = 639,
  Jah = 640,
  Cham = 641,
  Zod = 642
}

export enum ShopModes {
  // Repair = 0, // not sure ?
  Sell = 1,
  Buy = 2,
  ShiftBuy = 6
}

export enum SpecType {
  All = 0,
  Super = 0x1,
  Champion = 0x2,
  Unique = 0x4,
  Minion = 0x8,
}

export enum MonsterModes {
  Death = 0,
  Standing = 1,
  Walking = 2,
  GettingHit = 3,
  Attacking1 = 4,
  Attacking2 = 5,
  Blocking = 6,
  CastingSkill = 7,
  UsingSkill1 = 8,
  UsingSkill2 = 9,
  UsingSkill3 = 10,
  UsingSkill4 = 11,
  Dead = 12,
  KnockedBack = 13,
  Spawning = 14,
  Running = 15
}