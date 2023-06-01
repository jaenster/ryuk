import sdk from "../../sdk";

export = function () {

  // Move to the foot of the plato that leads to act 4
  Pather.journeyTo(sdk.areas.DuranceOfHateLvl3);
  Pather.moveTo(17563, 8068);


  const meph = Misc.poll(() => getUnit(1, sdk.monsters.Mephisto));

  if (!meph.dead && getDistance(meph, 17582, 8086) > 10) {
    const lure = [
      {x: 17554, y: 8066},
      {x: 17562, y: 8068},
      {x: 17582, y: 8079},
      {x: 17583, y: 8098},
      {x: 17618, y: 8108},
    ];

    const staticRange = Skill.getRange(sdk.skills.StaticField);
    while (!meph || getDistance(meph, 17582, 8086) > 10) {
      console.log(getDistance(meph, 17582, 8086));
      lure.forEach(({x, y}, idx) => {
        console.log(getDistance(me, meph),)

        if (getDistance(me, meph) < staticRange) Skill.cast(sdk.skills.StaticField, 0, meph);

        Pather[!idx ? 'teleportTo' : 'walkTo'](x, y)
      });
    }
    if (getDistance(me, meph) < 7) Skill.cast(sdk.skills.FrostNova, 0);
    if (getDistance(me, meph) < staticRange) Skill.cast(sdk.skills.StaticField, 0, meph);

  }
  //ToDO; attack him
  console.log('Attack him');
  Pather.teleportTo(17597, 8094)
  Pather.moveTo(17610, 8094);

  while (!meph.dead && !me.dead || checkCollision(me, meph, 0x4)) {

    const [skill] = ClassAttack.decideSkill(meph, [sdk.skills.StaticField]);

    Skill.cast(skill, 0, meph);

    if ({x: 17610, y: 8094}.distance > 5) {
      Pather.moveTo(17610, 8094)
    }
  }

  if (meph.dead) {
    Pather.moveToUnit(meph);
    Pickit.pickItems();
    let tick = getTickCount(), time = 0;

    // Wait until bridge is there
    while (getCollision(me.area, 17601, 8070, 17590, 8068) !== 0 && (time = getTickCount() - tick) < 2000) {
      Pather.moveTo(17590, 8068);  // Activate it
      delay(3);
    }

    // If bridge is there, and we can move to the location
    if (time < 2500 && Pather.moveTo(17601, 8070)) {
      Pather.usePortal(null);
    }
  }
  return (me.act === 4);
};