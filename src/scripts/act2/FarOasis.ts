import {haveWp, spotOnDistance} from "../util";
import sdk from "../../sdk";
import moveTo, {getWalkDistance} from "../../lib/MoveTo";

function getRooms() {
  const room = (getRoom() || undefined)
  const rooms = [];
  do {
    rooms.push({
      x: room.x * 5 + room.xsize / 2,
      y: room.y * 5 + room.xsize / 2,
      n: room.getNearby().length,
    })
  } while (room.getNext());
  return rooms;
}

export = function () {
  if (!haveWp(sdk.areas.FarOasis)) {
    return;
  }
  revealLevel(true);

  // Don't use the classic way to clear an entire area as its slow as fuck.
  // Find the 3 rooms that are the furthest away from everything, and kill those

  Pather.journeyTo(sdk.areas.FarOasis);

  const plot = [];

  plot.push({x: me.x, y: me.y})

  // ToDo; make dynamic until closest room isn't further as range say 40
  for (let i = 0; i < 4; i++) {
    const rooms = getRooms();

    // Find the room, that is furthest from all plotted room
    const farAway = rooms.sort((a, b) => {
      const nodeA = plot.slice().sort((pa, pb) => getDistance(pa.x, pa.y, a.x, a.y) - getDistance(pb.x, pb.y, a.x, a.y)).first();
      const nodeB = plot.slice().sort((pa, pb) => getDistance(pa.x, pa.y, b.x, b.y) - getDistance(pb.x, pb.y, b.x, b.y)).first();
      const distA = getDistance(nodeA.x, nodeA.y, a.x, a.y);
      const distB = getDistance(nodeB.x, nodeB.y, b.x, b.y);
      return distB - distA;
    }).first();

    let [x, y] = Pather.getNearestWalkable(farAway.x, farAway.y, 40, 3, 0x1 | 0x4 | 0x800 | 0x1000) as [number, number];

    console.log('Node got ' + farAway.n + ' neighbours')
    // Avoid pathering deep in the corner of the map
    if (farAway.n < 7) {
      console.log('edge less')
      const spot = spotOnDistance({x, y}, 25);
      x = spot.x;
      y = spot.y;
    }

    plot.push({x, y});
  }
  plot.shift(); // remove me

  plot.sort((a, b) => {
    return getWalkDistance(a.x, a.y) - getWalkDistance(b.x, b.y)
  })
  console.log(plot);
  moveTo(plot, {
    clearFilter(monster, node) {

      const result = monster.spectype > 0
        // beetles give a ton of xp
        || [91 /* dung soldier*/, 92 /* death beetle*/].includes(monster.classid)
        || getDistance(node, monster) < 6 // those that are close
      console.log(monster.name, result)
      return result;
    },
    rangeOverride: 35,
  });

}
