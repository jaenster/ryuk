import sdk from "../sdk";
import {Runes} from "../enums";
import {MockItem} from "../lib/Mock";
import {test, expect} from "./Expectation";
import {Runewords} from "../lib/Runewords";
import {mercAutoEquip, personalAutoEquip} from "../lib/AutoEquip";
import _missiles from "../lib/data/MissileData";

(() => {
  test("runewords with zod", () => {
    let zod = new MockItem({classid: Runes.Zod, itemType: sdk.itemtype.rune});
    let runewords = Runewords.possibleRunewordsWithItems([zod]).map(r => r.name);
    expect(runewords).arrayEquals(["Breath of the Dying"]);
  });

  test("runewords with ral and tal", () => {
    let ral = new MockItem({classid: Runes.Ral, itemType: sdk.itemtype.rune});
    let tal = new MockItem({classid: Runes.Tal, itemType: sdk.itemtype.rune});
    let runewords = Runewords.possibleRunewordsWithItems([ral, tal]).map(r => r.name);
    expect(runewords).arrayEquals(["Ancient's Pledge", "Holy Thunder", "Insight"]);
  });

  test("Insight", () => {
    let ral = new MockItem({classid: Runes.Ral, itemType: sdk.itemtype.rune});
    let tir = new MockItem({classid: Runes.Tir, itemType: sdk.itemtype.rune});
    let tal = new MockItem({classid: Runes.Tal, itemType: sdk.itemtype.rune});
    let sol = new MockItem({classid: Runes.Sol, itemType: sdk.itemtype.rune});
    let runewords = Runewords.possibleRunewordsWithItems([ral, tir, tal, sol]).map(r => r.name);
    expect(runewords).arrayEquals(["Insight"]);
  });

  test("Can't make Insight in wrong base", () => {
    let weapon = Runewords.mockWeapon(0, 4, sdk.itemtype.axe) // normal hand axe 4 sox
    let ral = new MockItem({classid: Runes.Ral, itemType: sdk.itemtype.rune});
    let tir = new MockItem({classid: Runes.Tir, itemType: sdk.itemtype.rune});
    let tal = new MockItem({classid: Runes.Tal, itemType: sdk.itemtype.rune});
    let sol = new MockItem({classid: Runes.Sol, itemType: sdk.itemtype.rune});
    let runewords = Runewords.possibleRunewordsWithItems([weapon, ral, tir, tal, sol]).map(r => r.name);
    expect(runewords.length).toBe(0);
  });

  test("runewords with 2 sockets body armor", () => {
    let armor = Runewords.mockBodyArmor(373, 2) // normal mage plate 2 socks
    let runewords = Runewords.possibleRunewordsWithItems([armor]).map(r => r.name);
    expect(runewords).arrayEquals(["Prudence", "Smoke", "Stealth"]);
  });

  test("Spirit in crystal sword", () => {
    let weapon = Runewords.mockWeapon(29, 4, sdk.itemtype.sword) // normal crystal sword 4 sox
    let tal = new MockItem({classid: Runes.Tal, itemType: sdk.itemtype.rune});
    let thul = new MockItem({classid: Runes.Thul, itemType: sdk.itemtype.rune});
    let ort = new MockItem({classid: Runes.Ort, itemType: sdk.itemtype.rune});
    let amn = new MockItem({classid: Runes.Amn, itemType: sdk.itemtype.rune});
    let runewords = Runewords.possibleRunewordsWithItems([weapon, tal, thul, ort, amn]).map(r => r.name);
    expect(runewords).arrayEquals(["Spirit"]);
  });

  test("Spirit in monarch", () => {
    let shield = Runewords.mockShield(447, 4, sdk.itemtype.shield) // normal monarch 4 sox
    let tal = new MockItem({classid: Runes.Tal, itemType: sdk.itemtype.rune});
    let thul = new MockItem({classid: Runes.Thul, itemType: sdk.itemtype.rune});
    let ort = new MockItem({classid: Runes.Ort, itemType: sdk.itemtype.rune});
    let amn = new MockItem({classid: Runes.Amn, itemType: sdk.itemtype.rune});
    let runewords = Runewords.possibleRunewordsWithItems([shield, tal, thul, ort, amn]).map(r => r.name);
    expect(runewords).arrayEquals(["Spirit"]);
  });

  test("Spirit in zakarum", () => {
    let shield = Runewords.mockShield(501, 4, sdk.itemtype.auricshields) // normal zakarum shield 4 sox
    let tal = new MockItem({classid: Runes.Tal, itemType: sdk.itemtype.rune});
    let thul = new MockItem({classid: Runes.Thul, itemType: sdk.itemtype.rune});
    let ort = new MockItem({classid: Runes.Ort, itemType: sdk.itemtype.rune});
    let amn = new MockItem({classid: Runes.Amn, itemType: sdk.itemtype.rune});
    let runewords = Runewords.possibleRunewordsWithItems([shield, tal, thul, ort, amn]).map(r => r.name);
    expect(runewords).arrayEquals(["Spirit"]);
  });

  test("Steel runeword stats", () => {
    let sword = Runewords.mockWeapon(49, 2, sdk.itemtype.sword);
    let tir = new MockItem({classid: Runes.Tir, itemType: sdk.itemtype.rune});
    let el = new MockItem({classid: Runes.El, itemType: sdk.itemtype.rune});
    let steel = Runewords.possibleRunewordsWithItems([sword, tir, el]).map(r => r.mock).first();
    let mockSteel = new MockItem({...sword, ...steel});
    console.log(mockSteel.overrides.stats);
    expect(mockSteel.getStat(sdk.stats.EnhancedDamage, 0, 0xAB)).toBe(20);
    expect(mockSteel.getStat(sdk.stats.SecondaryMindamage, 0, 0xAB)).toBe(3);
    expect(mockSteel.getStat(sdk.stats.SecondaryMaxdamage, 0, 0xAB)).toBe(3);
    expect(mockSteel.getStat(sdk.stats.Openwounds, 0, 0xAB)).toBe(50);
    expect(mockSteel.getStat(sdk.stats.Fasterattackrate, 0, 0xAB)).toBe(25);
    // tir rune stat
    expect(mockSteel.getStat(sdk.stats.Manaafterkill)).toBe(2);
    // el rune stats
    expect(mockSteel.getStat(sdk.stats.Attackrate)).toBe(50);
    expect(mockSteel.getStat(sdk.stats.Lightradius)).toBe(1);
  });

  test("Stealth runeword stats", () => {
    let armor = Runewords.mockBodyArmor(313, 2) // normal quilted armor 2 sox
    let tal = new MockItem({classid: Runes.Tal, itemType: sdk.itemtype.rune});
    let eth = new MockItem({classid: Runes.Eth, itemType: sdk.itemtype.rune});
    let stealth = Runewords.possibleRunewordsWithItems([armor, tal, eth]).map(r => r.mock).first();
    let mockStealth = new MockItem({...armor, ...stealth});
    expect(mockStealth.getStat(sdk.stats.MagicDamageReduction)).toBe(3);
    expect(mockStealth.getStat(sdk.stats.Dexterity)).toBe(6);
    expect(mockStealth.getStat(sdk.stats.Maxstamina)).toBe(15);
    expect(mockStealth.getStat(sdk.stats.Fastermovevelocity)).toBe(25);
    expect(mockStealth.getStat(sdk.stats.Fastercastrate)).toBe(25);
    expect(mockStealth.getStat(sdk.stats.Fastergethitrate)).toBe(25);
    // tal rune stat
    expect(mockStealth.getStat(sdk.stats.Poisonresist)).toBe(30);
    // eth rune stats
    expect(mockStealth.getStat(sdk.stats.Manarecoverybonus)).toBe(15);
    expect(mockStealth.getStat(sdk.stats.Levelreq)).toBe(17);
  });

  test("Enigma level req", () => {
    let eni = Runewords.mockEnigma();
    expect(eni.getStat(sdk.stats.Levelreq)).toBe(65);
  })

  test("Nadir", () => {
    let nadir = Runewords.mockNadir();
    console.log(personalAutoEquip.formula(nadir));
    console.log(mercAutoEquip.formula(nadir));
    console.log(nadir.overrides.stats);
  })
})();