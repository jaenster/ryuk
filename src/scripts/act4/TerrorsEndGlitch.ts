/**
 *    @filename    TerrorsEndGlitch.js
 *    @author        jaenster
 *    @desc        glitch diablo
 */

import clear from "../../lib/clear";
import sdk from "../../sdk";
import {getClosestSpot, getMedianSpot, spotOnDistance} from "../util";
import Diablo from "./Diablo";
import moveTo from "../../lib/MoveTo";

export = function () {
  function glitch() {
    // Make sure we got enough mana pots to teleport all the way
    Town.visitTown();
    Pather.moveTo(7795, 5548);

    let tick = getTickCount();

    Pather.teleDistance = 80; // unrealistic
    glitch.path.forEach(path => Pather.moveTo.apply(Pather, path));

    let seal = getUnit(2, 395);
    if (getDistance(seal, me) > 15) {
      Pather.moveToUnit(seal);
    }
    Pather.teleDistance = 40;

    Skill.cast(sdk.skills.Telekinesis, 0, seal);
    print('Time: ' + Math.round((getTickCount() - tick) / 100) / 10 + ' seconds');

    Diablo.pwnDia();

    print('move back to entrance');
    Pather.moveTo(7794, 5564);

    glitch.path.slice(0, -2).forEach(path => {
      Pather.moveTo.apply(Pather, path);
      Pickit.pickItems(50);
      Town.fieldID();
    });
  }

  // Path
  glitch.path = [
    // entrance
    [7796, 5548], // entrance start
    [7796, 5510],
    [7796, 5477],
    [7796, 5430],
    [7796, 5413],
    [7796, 5367],
    [7819, 5321],

    // east
    [7848, 5287],

    // north
    [7800, 5259],

    // west
    [7760, 5291],

    // west #2
    [7714, 5300],

    // move near seal (both layouts)
    [7666, 5315],
  ];

  Config.PacketCasting = 0;
  me.inTown && Town.doChores();
  let vizLayout: 0 | 1, seisLayout: 0 | 1, infLayout: 0 | 1;

  Pather.journeyTo(sdk.areas.ChaosSanctuary); // load this area up
  // Diablo.pwnDia();

  const getLayout = function (seal, value) {
    const sealPreset = getPresetUnit(108, 2, seal);
    if (!seal || !sealPreset) throw new Error("Seal preset not found");
    return (sealPreset.roomy * 5 + sealPreset.y === value || sealPreset.roomx * 5 + sealPreset.x === value) ? 0 : 1
  };
  vizLayout = getLayout(396, 5275);
  seisLayout = getLayout(394, 7773);
  infLayout = getLayout(392, 7893);

  print('infLayout:' + infLayout);
  print('seisLayout:' + seisLayout);
  print('vizLayout:' + vizLayout);

  type RunSettings = {
    start: PathNode,
    end: PathNode | PathNode[],
    openSealFrom: { [data: number]: PathNode },
    precastFrom: PathNode,
    spawnPoint: PathNode,
    boss: string,
    sort?: number[],
  };

  const generateRunner = function (settings: RunSettings) {
    return () => {
      Pather.moveToUnit(settings.start);
      moveTo(settings.end, {allowTeleport: false});
      const keys = Object.keys(settings.openSealFrom).map(el => parseInt(el));
      if (typeof settings.sort !== 'undefined') {
        keys.sort((a, b) => settings.sort.indexOf(a) - settings.sort.indexOf(b));
      }

      keys.forEach((sealId: string | number, index, self) => {
        // Object keys are always converted to strings
        sealId = parseInt(sealId as string);
        console.log(sealId);

        if (self.length - 1 === index) {
          console.log('Active seal, first precast once');
          Pather.moveToUnit(settings.precastFrom);
          Skill.cast(sdk.skills.Blizzard, 0, settings.spawnPoint.x, settings.spawnPoint.y)
          Skill.cast(sdk.skills.GlacialSpike, 0, settings.spawnPoint.x, settings.spawnPoint.y)
          Skill.cast(sdk.skills.GlacialSpike, 0, settings.spawnPoint.x, settings.spawnPoint.y)
        } else {
          console.log('Inactive seal');
        }
        const {x, y} = settings.openSealFrom[sealId];
        Pather.moveTo(x, y);
        const seal = getUnit(2, sealId);
        //ToDo; fail handeling
        Skill.cast(sdk.skills.Telekinesis, 0, seal);
      });

      Pather.moveToUnit(settings.precastFrom);
      const bossUnit = Misc.poll(() => {
        Skill.cast(sdk.skills.GlacialSpike, 0, settings.spawnPoint.x, settings.spawnPoint.y);
        Skill.cast(sdk.skills.Blizzard, 0, settings.spawnPoint.x, settings.spawnPoint.y)
        return getUnit(1, settings.boss);
      }, 6000, 3);

      if (bossUnit) {
        Attack.clear(30, 0, settings.boss);
      } else {
        print('unit not found =O');
      }
    }
  }
  const seiz = generateRunner({
    start: [
      {x: 7767, y: 5148},
      {x: 7821, y: 5147},
    ][seisLayout],

    end: [
      {x: 7774, y: 5221},
      [
        {x: 7781, y: 5153},
        {x: 7768, y: 5191},
        {x: 7795, y: 5187}
      ]
    ][seisLayout],

    openSealFrom: [
      {394: {x: 7777, y: 5158}},
      {394: {x: 7811, y: 5161}},
    ][seisLayout],

    precastFrom: [
      {x: 7774, y: 5194},
      {x: 7811, y: 5161},
    ][seisLayout],

    spawnPoint: [
      {x: 7771, y: 5234},
      {x: 7776, y: 5187}
    ][seisLayout],

    boss: getLocaleString(2852),
  });

  const viz = generateRunner({
    start: [
      {x: 7646, y: 5282},

      {x: 7647, y: 5267},
    ][vizLayout],

    end: [
      [
        {x: 7652, y: 5272},
        {x: 7669, y: 5273},
        {x: 7694, y: 5293},
        {x: 7659, y: 5318},
        {x: 7649, y: 5319},
      ],
      [ // clear multiple nodes (we walk in a L)
        {x: 7658, y: 5312},
        {x: 7702, y: 5315},
      ]
    ][vizLayout],

    openSealFrom: [
      {
        396: {x: 7659, y: 5267}, // active seal
        // 395: {x: 7665, y: 5300}, // inactive
      },
      {
        // 395: {x: 7662, y: 5289},
        396: {x: 7661, y: 5302},
      },
    ][vizLayout],

    precastFrom: [
      {x: 7659, y: 5267},
      {x: 7662, y: 5289},
    ][vizLayout],

    spawnPoint: [
      {x: 7681, y: 5295},
      {x: 7673, y: 5321},
    ][vizLayout],

    boss: getLocaleString(2851),

    sort: [395, 396],
  });

  const inf = generateRunner({
    start: [
      {x: 7907, y: 5267},
      {x: 7907, y: 5320},
    ][infLayout],

    end: [
      [ // multiple nodes because this shape of vizier is weird
        {x: 7907, y: 5267},
        {x: 7942, y: 5284},
        {x: 7903, y: 5304},
        {x: 7869, y: 5289},
      ],
      [ // clear multiple nodes (we walk in a L)
        {x: 7941, y: 5320},
        {x: 7942, y: 5282},
        {x: 7919, y: 5279},
        {x: 7892, y: 5277},
      ]
    ][infLayout],

    openSealFrom: [
      {
        393: {x: 7909, y: 5294}, // inactive
        392: {x: 7883, y: 5299},
      },
      {
        392: {x: 7913, y: 5304},
        393: {x: 7922, y: 5292},
      },
    ][infLayout],

    precastFrom: [
      {x: 7883, y: 5299},
      {x: 7913, y: 5304},
    ][infLayout],

    spawnPoint: [
      {x: 7907, y: 5291},
      {x: 7909, y: 5277},
    ][infLayout],

    boss: getLocaleString(2853),

    // javascript automatically sort numeric keys
    sort: [393, 392],
  });


  print('move to entrance to glitch');
  // // Entrance
  // {
  //     const arr = [];
  //
  //     let room = getRoom() || undefined;
  //     if (room) do {
  //         arr.push(new Line(room.x * 5, room.y * 5, room.x * 5, room.y * 5 + room.ysize, 0x83, true));
  //         arr.push(new Line(room.x * 5, room.y * 5, room.x * 5 + room.xsize, room.y * 5, 0x83, true));
  //         arr.push(new Line(room.x * 5 + room.xsize, room.y * 5, room.x * 5 + room.xsize, room.y * 5 + room.ysize, 0x83, true));
  //         arr.push(new Line(room.x * 5, room.y * 5 + room.ysize, room.x * 5 + room.xsize, room.y * 5 + room.ysize, 0x83, true));
  //     } while (room.getNext());
  // }

  inf();
  seiz();
  viz();
  glitch();
}