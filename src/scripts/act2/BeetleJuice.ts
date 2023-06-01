import {getExit, toPackOfMonsters} from "../util";
import sdk from "../../sdk";
import {Collision, getCollisionBetweenCoords} from "../../lib/Coords";
import moveTo, {getWalkDistance} from "../../lib/MoveTo";

export = function () {

  const areaOrder = [
    sdk.areas.TalRashasTomb4,
    sdk.areas.TalRashasTomb3,
    sdk.areas.TalRashasTomb2,
    sdk.areas.TalRashasTomb1,
    sdk.areas.TalRashasTomb5,
    sdk.areas.TalRashasTomb6,
    sdk.areas.TalRashasTomb7,
  ];


  const pwnBeetles = () => {
    const packs = toPackOfMonsters(getUnits(1)
      .filter(el =>
        !el.dead &&
        (el.classid === 92 ||
          el.classid === 94 || // Bone Scarab
          el.classid === 26 || // brute
          el.classid === 187 // Gorebelly
        )
      ));

    const lines = packs.map(({x, y}) => new Line(x, y, me.x, me.y, 0x9B, true));

    packs.sort((a, b) => getWalkDistance(a.x, a.y) - getWalkDistance(b.x, b.y));

    packs.forEach((pack) => {

      const path = getPath(me.area, me.x, me.y, pack.x, pack.y, 2, 5);
      if (!path) return;

      // find the first node that is on a distance of 40 and proper check collision
      const node = path.find(node => {
        // if there isn't any nice collision path
        if (node.distance < 15) return true;

        // If a spot if found where we are on a distance 40 and without collisions, stand here
        return node.distance < 40 && !(getCollisionBetweenCoords(node, pack) & Collision.BLOCK_MISSILE);
      });

      if (!node) return;
      Pather.moveTo(node.x, node.y);

      // walk and clear this monster pack
      moveTo(pack, {
        callback() {
          pack.monsters.length && pack.monsters.every(monster => monster?.dead);
        }
      });
    });
  }

  areaOrder.forEach(area => {
    Pather.journeyTo(sdk.areas.CanyonOfMagi);
    const exit = getExit(sdk.areas.CanyonOfMagi, area);
    if (!exit) return;
    const path = getPath(me.area, me.x, me.y, exit.x, exit.y, 0, 40);
    if (!path) return;
    path.forEach(node => {
      Pather.moveTo(node.x, node.y);
      pwnBeetles();
    });
    Pather.moveToExit(area, true)
    pwnBeetles();
    Pather.moveToExit(sdk.areas.CanyonOfMagi, true)
  })
}
