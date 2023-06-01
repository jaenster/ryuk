import CharData from "../../lib/CharData"

import Mercs, {mercPacket} from "../../lib/MercLib";


export = function () {

  let typeOfmerc: 1 | 2 = (!Pather.accessToAct(2) && me.diff === 0 ? 1 : 2);

  // Got a merc of the proper type
  if (CharData.merc.type === typeOfmerc) return;


  try {
    Town.goToTown(typeOfmerc);
    console.log('Getting merc?')
    addEventListener('gamepacket', mercPacket)
    console.log('Going to npc');
    Town.initNPC("Merc", "getMerc");
    console.log('At npc?');

    const wantedMerc = Mercs
      .filter(merc => merc.skills.some(skill => skill?.name === (typeOfmerc === 1 ? 'Cold Arrow' : "Defiance")))
      .sort(({level: a}, {level: b}) => b - a).first();

    if (wantedMerc) {
      let oldGid = me.getMerc()?.gid;

      console.log('Hire a merc');
      wantedMerc?.hire();
      const newMerc = Misc.poll(() => {
        const merc = me.getMerc();
        if (!merc) return false;
        if (oldGid && oldGid === merc.gid) return false;
        return merc;
      })

      console.log('Hired a merc?');
      if (newMerc) {
        console.log('Yep');
        CharData.merc = {
          type: typeOfmerc,
          ...wantedMerc
        };
      }
      me.cancel() && me.cancel() && me.cancel();
      while (getInteractedNPC()) {
        delay(me.ping || 5);
        me.cancel();
      }
    }

  } finally {
    removeEventListener('gamepacket', mercPacket);
  }

}