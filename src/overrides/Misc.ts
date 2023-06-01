import {Override} from "./Override";
import {gameData} from "../lib/CharData";
import sdk from "../sdk";

new Override(Misc, Misc.errorReport, function (original, error, script) {
  var i, date, dateString, msg, oogmsg, filemsg, source, stack,
    stackLog = "";

  date = new Date();
  dateString = "[" + new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, -5).replace(/-/g, '/').replace('T', ' ') + "]";

  if (typeof error === "string") {
    msg = error;
    oogmsg = error.replace(/ÿc[0-9!"+<:;.*]/gi, "");
    filemsg = dateString + " <" + me.profile + "> " + error.replace(/ÿc[0-9!"+<:;.*]/gi, "") + "\n";
  } else {
    source = error.fileName.substring(error.fileName.lastIndexOf("\\") + 1, error.fileName.length);
    msg = "ÿc1Error in ÿc0" + script + " ÿc1(" + source + " line ÿc1" + error.lineNumber + "): ÿc1" + error.message;
    oogmsg = " Error in " + script + " (" + source + " #" + error.lineNumber + ") " + error.message + " (Area: " + me.area + ", Ping:" + me.ping + ", Game: " + me.gamename + ")";
    filemsg = dateString + " <" + me.profile + "> " + msg.replace(/ÿc[0-9!"+<:;.*]/gi, "") + "\n";

    if (error.hasOwnProperty("stack")) {
      stack = error.stack;

      if (stack) {
        stack = stack.split("\n");

        if (stack && typeof stack === "object") {
          stack.reverse();
        }

        for (i = 0; i < stack.length; i += 1) {
          if (stack[i]) {
            stackLog += stack[i].substr(0, stack[i].indexOf("@") + 1) + stack[i].substr(stack[i].lastIndexOf("\\") + 1, stack[i].length - 1);

            if (i < stack.length - 1) {
              stackLog += ", ";
            }
          }
        }
      }
    }

    if (stackLog) {
      filemsg += "Stack: " + stackLog + "\n";
    }
  }

  if (this.errorConsolePrint && oogmsg) {
    D2Bot.printToConsole(oogmsg, 10);
  }

  showConsole();
  print(msg);
  gameData.log.push(msg);

  this.fileAction("logs/ScriptErrorLog.txt", 2, filemsg);

  if (this.screenshotErrors) {
    takeScreenshot();
    delay(500);
  }
})

new Override(Misc, "logItem", function (original, action, unit, keptLine) {
  if (!this.useItemLog) {
    return false;
  }

  var i;

  if (!Config.LogKeys && ["pk1", "pk2", "pk3"].indexOf(unit.code) > -1) {
    return false;
  }

  if (!Config.LogOrgans && ["dhn", "bey", "mbr"].indexOf(unit.code) > -1) {
    return false;
  }

  if (!Config.LogLowRunes && ["r01", "r02", "r03", "r04", "r05", "r06", "r07", "r08", "r09", "r10", "r11", "r12", "r13", "r14"].indexOf(unit.code) > -1) {
    return false;
  }

  if (!Config.LogMiddleRunes && ["r15", "r16", "r17", "r18", "r19", "r20", "r21", "r22", "r23"].indexOf(unit.code) > -1) {
    return false;
  }

  if (!Config.LogHighRunes && ["r24", "r25", "r26", "r27", "r28", "r29", "r30", "r31", "r32", "r33"].indexOf(unit.code) > -1) {
    return false;
  }

  if (!Config.LogLowGems && ["gcv", "gcy", "gcb", "gcg", "gcr", "gcw", "skc", "gfv", "gfy", "gfb", "gfg", "gfr", "gfw", "skf", "gsv", "gsy", "gsb", "gsg", "gsr", "gsw", "sku"].indexOf(unit.code) > -1) {
    return false;
  }

  if (!Config.LogHighGems && ["gzv", "gly", "glb", "glg", "glr", "glw", "skl", "gpv", "gpy", "gpb", "gpg", "gpr", "gpw", "skz"].indexOf(unit.code) > -1) {
    return false;
  }

  for (i = 0; i < Config.SkipLogging.length; i++) {
    if (Config.SkipLogging[i] === unit.classid || Config.SkipLogging[i] === unit.code) {
      return false;
    }
  }

  var lastArea, code, desc, sock, itemObj,
    color = -1,
    name = unit.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<:;.*]|\/|\\/g, "").trim();

  desc = this.getItemDesc(unit);
  color = unit.getColor();

  if (action.match("kept", "i")) {
    lastArea = DataFile.getStats().lastArea;

    if (lastArea) {
      desc += ("\n\\xffc0Area: " + lastArea);
    }
  }

  if (unit.getFlag(0x10)) {
    switch (unit.quality) {
      case 5: // Set
        switch (unit.classid) {
          case 27: // Angelic sabre
            code = "inv9sbu";

            break;
          case 74: // Arctic short war bow
            code = "invswbu";

            break;
          case 308: // Berserker's helm
            code = "invhlmu";

            break;
          case 330: // Civerb's large shield
            code = "invlrgu";

            break;
          case 31: // Cleglaw's long sword
          case 227: // Szabi's cryptic sword
            code = "invlsdu";

            break;
          case 329: // Cleglaw's small shield
            code = "invsmlu";

            break;
          case 328: // Hsaru's buckler
            code = "invbucu";

            break;
          case 306: // Infernal cap / Sander's cap
            code = "invcapu";

            break;
          case 30: // Isenhart's broad sword
            code = "invbsdu";

            break;
          case 309: // Isenhart's full helm
            code = "invfhlu";

            break;
          case 333: // Isenhart's gothic shield
            code = "invgtsu";

            break;
          case 326: // Milabrega's ancient armor
          case 442: // Immortal King's sacred armor
            code = "invaaru";

            break;
          case 331: // Milabrega's kite shield
            code = "invkitu";

            break;
          case 332: // Sigon's tower shield
            code = "invtowu";

            break;
          case 325: // Tancred's full plate mail
            code = "invfulu";

            break;
          case 3: // Tancred's military pick
            code = "invmpiu";

            break;
          case 113: // Aldur's jagged star
            code = "invmstu";

            break;
          case 234: // Bul-Kathos' colossus blade
            code = "invgsdu";

            break;
          case 372: // Grizwold's ornate plate
            code = "invxaru";

            break;
          case 366: // Heaven's cuirass
          case 215: // Heaven's reinforced mace
          case 449: // Heaven's ward
          case 426: // Heaven's spired helm
            code = "inv" + unit.code + "s";

            break;
          case 357: // Hwanin's grand crown
            code = "invxrnu";

            break;
          case 195: // Nalya's scissors suwayyah
            code = "invskru";

            break;
          case 395: // Nalya's grim helm
          case 465: // Trang-Oul's bone visage
            code = "invbhmu";

            break;
          case 261: // Naj's elder staff
            code = "invcstu";

            break;
          case 375: // Orphan's round shield
            code = "invxmlu";

            break;
          case 12: // Sander's bone wand
            code = "invbwnu";

            break;
        }

        break;
      case 7: // Unique
        for (i = 0; i < 401; i += 1) {
          if (unit.code === (getBaseStat("uniqueitems", i, "code") as string).trim() && unit.fname.split("\n").reverse()[0].indexOf(getBaseStat("uniqueitems", i, "index")) > -1) {
            code = getBaseStat("uniqueitems", i, "invfile");

            break;
          }
        }

        break;
    }
  }

  if (!code) {
    if (["ci2", "ci3"].indexOf(unit.code) > -1) { // Tiara/Diadem
      code = unit.code;
    } else {
      code = getBaseStat("items", unit.classid, 'normcode') || unit.code;
    }

    code = code.replace(" ", "");

    if ([10, 12, 58, 82, 83, 84].indexOf(unit.itemType) > -1) {
      code += (unit.gfx + 1);
    }
  }

  sock = unit.getItem();

  if (sock) {
    do {
      if (sock.itemType === 58) {
        desc += "\n\n";
        desc += this.getItemDesc(sock);
      }
    } while (sock.getNext());
  }

  if (keptLine) {
    desc += ("\n\\xffc0Line: " + keptLine);
  }

  desc += "$" + (unit.getFlag(0x400000) ? ":eth" : "");

  itemObj = {
    title: action + " " + name,
    description: desc,
    image: code,
    textColor: unit.quality,
    itemColor: color,
    header: "",
    sockets: this.getItemSockets(unit)
  };

  D2Bot.printToItemLog(itemObj);

  return true;
})

new Override(Skill, 'getManaCost', function (original, skillId) {
  if (skillId < 6) {
    return 0;
  }

  if (this.manaCostList.hasOwnProperty(skillId)) {
    return this.manaCostList[skillId];
  }

  let skillLvl = me.getSkill(skillId, 1),
    effectiveShift = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024],
    lvlmana = getBaseStat("skills", skillId, "lvlmana") === 65535 ? -1 : getBaseStat("skills", skillId, "lvlmana") as number, // Correction for skills that need less mana with levels (kolton)
    ret = Math.max(
      ((getBaseStat("skills", skillId, "mana") as number) + lvlmana * (skillLvl - 1)) * (effectiveShift[getBaseStat("skills", skillId, "manashift")] / 256),
      getBaseStat("skills", skillId, "minmana") as number
    );

  if (!this.manaCostList.hasOwnProperty(skillId)) {
    this.manaCostList[skillId] = ret;
  }

  return ret;
})

new Override(Skill, 'getClass', function (original, skillId) {
  switch (true) {
    case skillId < sdk.skills.MagicArrow: // Everything below the first skill of the ama
      return 7;

    case skillId < sdk.skills.FireBolt: // Everything below the first skill of the sorc
      return sdk.charclass.Amazon; // is an ama skill

    case skillId < sdk.skills.AmplifyDamage: // Everything below the first skill of necro
      return sdk.charclass.Sorceress; // is an sorc skill

    case skillId < sdk.skills.Sacrifice:
      return sdk.charclass.Necromancer; // is an necro skill

    case skillId < sdk.skills.Bash:
      return sdk.charclass.Paladin; // is an pala skill

    case skillId <= sdk.skills.BattleCommand:
      return sdk.charclass.Barbarian; // is an barb skill

    case skillId < sdk.skills.Raven:
      return 8; // monster skills

    case skillId < sdk.skills.FireTrauma:
      return sdk.charclass.Druid; // Druid

    case skillId <= sdk.skills.WakeOfDestructionSentry:
      return sdk.charclass.Assassin
  }
  return 8; // monster skills
})

new Override(Skill, 'getTab', function (original, skillId) {
  for (let char in sdk.skillTabs) {
    for (let tab in sdk.skillTabs[char]) {
      let current = sdk.skillTabs[char][tab];
      if (current.skills.indexOf(skillId) > -1) {
        return current.id;
      }
    }
  }

  return -1; // not found
})

new Override(Skill, Skill.getManaCost, function (original, skillId) {
  if (skillId < 6) {
    return 0;
  }

  if (this.manaCostList.hasOwnProperty(skillId)) {
    return this.manaCostList[skillId];
  }

  var skillLvl = me.getSkill(skillId, 1),
    effectiveShift = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024],
    lvlmana = (getBaseStat("skills", skillId, "lvlmana") === 65535 ? -1 : getBaseStat("skills", skillId, "lvlmana")) as number, // Correction for skills that need less mana with levels (kolton)
    ret = Math.max(((getBaseStat("skills", skillId, "mana") as number) + lvlmana * (skillLvl - 1)) * (effectiveShift[getBaseStat("skills", skillId, "manashift")] / 256), (getBaseStat("skills", skillId, "minmana")) as number);

  if (!this.manaCostList.hasOwnProperty(skillId)) {
    this.manaCostList[skillId] = ret;
  }

  return ret;
})

new Override(Misc, Misc.openChests, function (original, range) {
  // if (me.classid !== 6 && unit.islocked && !me.findItem(543, 0, 3)) {
  let containers = ["chest", "chest3", "armorstand", "weaponrack"];

  if (!range) {
    range = 15;
  }

  // Testing all container code
  /*if (Config.OpenChests === 2) {
      containers = [
          "chest", "loose rock", "hidden stash", "loose boulder", "corpseonstick", "casket", "armorstand", "weaponrack", "barrel", "holeanim", "tomb2",
          "tomb3", "roguecorpse", "ratnest", "corpse", "goo pile", "largeurn", "urn", "chest3", "jug", "skeleton", "guardcorpse", "sarcophagus", "object2",
          "cocoon", "basket", "stash", "hollow log", "hungskeleton", "pillar", "skullpile", "skull pile", "jar3", "jar2", "jar1", "bonechest", "woodchestl",
          "woodchestr", "barrel wilderness", "burialchestr", "burialchestl", "explodingchest", "chestl", "chestr", "groundtomb", "icecavejar1", "icecavejar2",
          "icecavejar3", "icecavejar4", "deadperson", "deadperson2", "evilurn", "tomb1l", "tomb3l", "groundtombl"
      ];
  }*/

  const sortChests = (a, b) => {
    return Math.round(getDistance(me.x, me.y, a.x, a.y)) - Math.round(getDistance(me.x, me.y, b.x, b.y));
  };

  let chests = getUnits(sdk.unittype.Objects)
    .filter(u => u.name && u.mode === 0 &&
      getDistance(me.x, me.y, u.x, u.y) <= range &&
      containers.includes(u.name.toLocaleLowerCase()) &&
      !u.islocked
    )

  while (chests.length > 0) {
    chests.sort(sortChests);
    let chest = chests.shift();
    if (chest && (Pather.useTeleport() || !checkCollision(me, chest, 0x4)) && this.openChest(chest)) {
      Pickit.pickItems();
    }
  }

  return true;
})

new Override(Skill, Skill.cast, function (this: typeof Skill, original, skillId, hand, x, y, item) {
  switch (true) {
    case me.inTown && !this.townSkill(skillId):
    case !item && (this.getManaCost(skillId) > me.mp || !me.getSkill(skillId, 1)):
    case !this.wereFormCheck(skillId):
      return false;
    case skillId === undefined:
      throw new Error("Unit.cast: Must supply a skill ID");
  }

  hand === undefined && (hand = this.getHand(skillId));
  x === undefined && (x = me.x);
  y === undefined && (y = me.y);

  // Check mana cost, charged skills don't use mana
  if (!item && this.getManaCost(skillId) > me.mp) {
    // Maybe delay on ALL skills that we don't have enough mana for?
    if (Config.AttackSkill.concat([sdk.skills.StaticField, sdk.skills.Teleport]).concat(Config.LowManaSkill).includes(skillId)) {
      delay(300);
    }

    return false;
  }

  if (!this.setSkill(skillId, hand, item)) return false;

  if (Config.PacketCasting > 1) {
    switch (typeof x) {
      case "number":
        // @ts-ignore
        Packet.castSkill(hand, x, y);
        delay(250);

        break;
      case "object":
        // @ts-ignore
        Packet.unitCast(hand, x);
        delay(250);

        break;
    }
  } else {
    let [clickType, shift] = (() => {
      switch (hand) {
        case sdk.skills.hand.Left: // Left hand + Shift
          return [sdk.clicktypes.click.map.LeftDown, sdk.clicktypes.shift.Shift];
        case sdk.skills.hand.LeftNoShift: // Left hand + No Shift
          return [sdk.clicktypes.click.map.LeftDown, sdk.clicktypes.shift.NoShift];
        case sdk.skills.hand.RightShift: // Right hand + Shift
          return [sdk.clicktypes.click.map.RightDown, sdk.clicktypes.shift.Shift];
        case sdk.skills.hand.Right: // Right hand + No Shift
        default:
          return [sdk.clicktypes.click.map.RightDown, sdk.clicktypes.shift.NoShift];
      }
    })();

    MainLoop:
      for (let n = 0; n < 3; n += 1) {
        // @ts-ignore
        typeof x === "object" ? clickMap(clickType, shift, x) : clickMap(clickType, shift, x, y);
        delay(20);
        // @ts-ignore
        typeof x === "object" ? clickMap(clickType + 2, shift, x) : clickMap(clickType + 2, shift, x, y);

        for (let i = 0; i < 8; i += 1) {
          // @ts-ignore
          if (me.attacking) {
            break MainLoop;
          }

          delay(20);
        }
      }

    // @ts-ignore
    while (me.attacking) {
      delay(10);
    }
  }

  // account for lag, state 121 doesn't kick in immediately
  if (this.isTimed(skillId)) {
    for (let i = 0; i < 10; i += 1) {
      // @ts-ignore
      if ([sdk.player.mode.GettingHit, sdk.player.mode.Blocking].includes(me.mode) || me.skillDelay) {
        break;
      }

      delay(10);
    }
  }

  return true;
})