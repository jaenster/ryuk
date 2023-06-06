import sdk from "../sdk";

export enum BlockBits {
  BlockWall = (1 << 0),

  // Simply put, if the monster should be drawn
  LineOfSight = (1 << 1),

  // Its a bit weird but it seems if this is set if you go out of range to hit a monster
  Ranged = (1 << 2),  //block ranged

  // This naming comes from d2bs, but not sure if its accurate
  PlayerToWalk = (1 << 3),

  // This is some light setting, not usefull. Its mostly around doors and waypoints
  DarkArea = (1 << 4),

  // Is it a cast blocker? Like a stone or whatever. Not 100% accurate
  Casting = (1 << 5),

  // Tell me if you see it!
  Unknown_NeverSeen = (1 << 6),

  // These are always set if you check collision between you and a monster
  Players = (1 << 7),
  Monsters = (1 << 8),  //NPCs & monsters


  Items = (1 << 9),
  Objects = (1 << 10),

  // Between me / spot is a door that is closed
  ClosedDoor = (1 << 11), // Closed doors

  // This one is odd, its nearly always set. But not for monsters that fly over lava for example
  // Blizzard / meteor and prob other skills are only castable on spots with this set
  IsOnFloor = (1 << 12),

  // Flavie, merc.
  FriendlyNPC = (1 << 13),

  Unknown_3 = (1 << 14),
  DeadBodies = (1 << 15),
}

export enum Collision {
  // Collisions that cause a missile to burst
  BLOCK_MISSILE = BlockBits.PlayerToWalk | BlockBits.LineOfSight | BlockBits.ClosedDoor | BlockBits.Ranged | BlockBits.BlockWall,
}

export function getCoordsBetween(x1: number, y1: number, x2: number, y2: number): { x: number, y: number }[] {
  const {abs, min, max, floor} = Math;
  const A = {x: x1, y: y1};
  const B = {x: x2, y: y2};

  if (max(x1, x2) - min(x1, x2) < max(y1, y2) - min(y1, y2)) {
    // noinspection JSSuspiciousNameCombination
    return getCoordsBetween(y1, x1, y2, x2).map(({x, y}) => ({x: y, y: x}));
  }

  function slope(a, b) {
    if (a.x === b.x) return null;
    return (b.y - a.y) / (b.x - a.x);
  }

  function intercept(point, slope) {
    // vertical line
    if (slope === null) return point.x;
    return point.y - slope * point.x;
  }

  let m = slope(A, B);
  let b = intercept(A, m);

  let coordinates = [];
  for (let x = min(A.x, B.x); x <= max(A.x, B.x); x++) {
    const y = m * x + b;
    coordinates.push({x, y});
  }

  return coordinates.map(({x, y}) => ({x: floor(x), y: floor(y)}))
    .filter((el, idx, self) => self.findIndex(other => other.x === el.x && other.y === el.y) === idx);
}

export const convertToCoordArray = (args, caller: string, length = 2) => {
  const coords = []

  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] === 'number' && i < args.length - 1) {
      coords.push({x: args[i], y: args[++i]});
    } else {
      coords.push(args[i]);
    }
  }

  if (coords.length !== length) throw TypeError('Didnt give proper arguments to ' + caller);
  return coords;
}

export function getCollisionBetweenCoords(x1: number, y1: number, x2: number, y2: number);
export function getCollisionBetweenCoords(x1: { x: number, y: number }, x2: number, y2: number);
export function getCollisionBetweenCoords(x1: { x: number, y: number }, y1: { x: number, y: number });
export function getCollisionBetweenCoords(...args: (number | { x: number, y: |number })[]) {
  const [one, two] = convertToCoordArray(args, 'getCollisionBetweenCoords', 2);

  if (getDistance(one, two) > 50) {
    return -1;
  }
  try {
    return getCoordsBetween(one.x, one.y, two.x, two.y)
      .reduce((acc, cur) => {
        return (acc | 0)
          // | (getCollision(me.area, cur.x+1, cur.y-1) | 0)
          // | (getCollision(me.area, cur.x+1, cur.y) | 0)
          // | (getCollision(me.area, cur.x+1, cur.y+1) | 0)
          // | (getCollision(me.area, cur.x, cur.y-1) | 0)
          | (getCollision(me.area, cur.x, cur.y) | 0)
          // | (getCollision(me.area, cur.x, cur.y+1) | 0)
          // | (getCollision(me.area, cur.x-1, cur.y-1) | 0)
          // | (getCollision(me.area, cur.x-1, cur.y) | 0)
          // | (getCollision(me.area, cur.x-1, cur.y+1) | 0)
          ;
      }, 0);
  } catch (e) {
    return -1; // Area not loaded
  }
}

export function isBlockedBetween(x1: number, y1: number, x2: number, y2: number);
export function isBlockedBetween(x1: { x: number, y: number }, x2: number, y2: number);
export function isBlockedBetween(x1: { x: number, y: number }, y1: { x: number, y: number });
export function isBlockedBetween(...args: (number | { x: number, y: |number })[]) {
  const collision = getCollisionBetweenCoords.apply(null, args);
  return !!(collision & (0
      | BlockBits.LineOfSight
      | BlockBits.Ranged
      | BlockBits.Casting
      | BlockBits.ClosedDoor
      // | BlockBits.BlockMonsters
      | BlockBits.Objects
    )
  )
}

Room.prototype.isInRoom = function (...args) {
  const [[x, y]] = convertToCoordArray(args, 'isInRoom', 1);

  return this && x >= this.x * 5 && x < this.x * 5 + this.xsize && y >= this.y * 5 && y < this.y * 5 + this.ysize;
};


type MinimalMonster = PathNode & { area: number };

export function findCastingSpotSkill(skill: number, unit: MinimalMonster, minRange: number = 5, thickness: number = 5, collision: number = Collision.BLOCK_MISSILE): PathNode {
  const range = Skill.getRange(skill);
  const tick = getTickCount()
  const spot = findCastingSpotRange(range, unit, minRange, thickness, collision);
  print(getTickCount()-tick+' ms');
  return spot;
}


export function findCastingSpotRange(range: number, unit: MinimalMonster, minRange: number = 5, thickness: number = 5, collision: number = Collision.BLOCK_MISSILE): PathNode {
  const spots = getSpotsFor(collision, thickness, unit)
    .sort((a, b) => {
      if (checkCollisionBetween(a.x, a.y, me.x, me.y, 7, BlockBits.BlockWall)) return 1;
      return a.distance - b.distance;
    })
  return spots.find(a => {
    const dist = getDistance(unit.x, unit.y, a.x, a.y);
    return dist < range && dist > minRange;
  });
}

const lines = [];

export function getSpotsFor(collision: number, thickness: number, unit: MinimalMonster) {
  let spots: (PathNode&{n: number})[] = [];

  const fieldSize = 50;

  for (let oX = -fieldSize; oX < fieldSize; oX+=3) {
    for (let oY = -fieldSize; oY < fieldSize; oY+=3) {
      const [x, y] = [unit.x + oX, unit.y + oY];

      if (getDistance(unit.x, unit.y, x, y) > 40) continue;
      let isCol = !!(getCollision(unit.area, x, y) & collision);

      for (let i = -2; i < 2 && !isCol; i++) {
        for (let j = -2; j < 2 && !isCol; j++) {
          isCol = isCol && !!(getCollision(unit.area, x + i, y + j) & collision);
        }
      }
      // if it isnt a collision to start with
      if (!isCol) {
        spots.push({x, y, n: 0});
      }
    }
  }

  spots = spots.filter(el => !checkCollisionBetween(el.x, el.y, unit.x, unit.y, thickness, collision))

  // Calculate the far edge spots (todo: Improve speed?)
  const all = [];
  for(const spot of spots) {
    for(const other of spots) {
      if (spot === other) continue;
      const d = getDistance(spot, other);
      if (d < 5) {
        spot.n += 1;
      }
    }
    all.push(spot.n);
  }
  const avg = all.reduce((acc, cur) => acc+cur, 0) / all.length

  lines.splice(0, lines.length);
  spots = spots.filter(({x, y, n}) => {
    if (n < avg) { // below avg
      lines.push(new Line(x + 1, y + 1, x, y, 0x62, true))
      return false;
    } else { // not below avg
      lines.push(new Line(x + 1, y + 1, x, y, 0x84, true))
      return true;
    }
  });
  return spots;

}