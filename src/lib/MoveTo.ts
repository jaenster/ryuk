import clear from "./clear";
import sdk from "../sdk";

export const getWalkDistance = function (x, y, area = me.area, xx = me.x, yy = me.y) {
    // distance between node x and x-1
    const path = getPath(area, x, y, xx, yy, 2, 5);
    return path && path.map((e, i, s) => i && getDistance(s[i - 1] as Unit, e as Unit) || 0)
      .reduce((acc, cur) => acc + cur, 0) || Infinity;
};

const skipShrine: number[] = [];
export type SettingsType = {
    allowTeleport: boolean,
    startIndex: number,
    rangeOverride: number,
    callback: () => any,
    allowClearing: boolean,
    clearFilter: (monster: Monster, node: PathNode) => boolean,
};
export type MovingPath = ({ x: number, y: number, index: number, hook?: () => void }[] & { index: number })
export let currentWalkingPath = [];
export default function moveTo(
  target: (PathNode & { hook?: () => void })[] | PathNode,
  givenSettings?: Partial<SettingsType>) {

    const settings = Object.assign({}, {
        allowTeleport: true,
        startIndex: 0,
        rangeOverride: null,
        callback: undefined,
        allowClearing: true,
        clearFilter: (m, n) => getDistance(m, n) <= 14,
    }, givenSettings)

    const shrinesPriority = [
        sdk.shrines.Mana,
        sdk.shrines.Experience,
        sdk.shrines.Skill,
        sdk.shrines.ManaRecharge,
        sdk.shrines.Stamina
    ];

    const stateForShrine = id => {
        if (id >= sdk.shrines.Armor && id <= sdk.shrines.Experience) {
            return id + 122;
        }
        return 0;
    }

    const searchShrine = () => getUnits(2, "shrine")
      .filter(el => el.mode === 0 && shrinesPriority.includes(el.objtype))
      .filter(el => {
          // Dont do anything with shrines we already found
          if (skipShrine.includes(el.gid)) return false;
          let currentIndex = shrinesPriority.findIndex(s => me.getState(stateForShrine(s)));
          let index = shrinesPriority.indexOf(el.objtype);

          if (currentIndex === -1 || index <= currentIndex || stateForShrine(el.objtype) === 0) {
              if (el.objtype !== sdk.shrines.Mana || 100 / me.mpmax * me.mp >= 50) {
                  return true;
              } else {
                  return getDistance(me, el) <= 10;
              }
          }

          return false;
      })
      .filter(el => Pather.getWalkDistance(el.x, el.y, el.area, me.x, me.y, 0, 5) <= 40)
      .sort((a, b) => (shrinesPriority.indexOf(a.objtype) - shrinesPriority.indexOf(b.objtype)) || a.distance - b.distance)
      .first();

    // convert presetunit to x,y target
    if (target instanceof PresetUnit) target = {x: target.roomx * 5 + target.x, y: target.roomy * 5 + target.y};

    // // close node
    // switch (true) {
    //     // @ts-ignore
    //     // case me.inTown:
    //     case getRoom(me.x, me.y).level !== getRoom(target.x, target.y).level:
    //     case getDistance(me, target.x, target.y) < 5:
    //         return Pather.moveTo(target.x, target.y, 3, false);
    // }

    let canTeleport = settings.allowTeleport && Pather.useTeleport();
    /*
        if (canTeleport) {
            if (Array.isArray(target)) {
                target = target.last();
            }
            return Pather.moveTo(target.x, target.y, 4, true);
        }
    */
    let clearPercentage = 100, didSkipTown = false;

    // To fix recursion issues
    let _prevpath = currentWalkingPath;
    try {
        if (!Array.isArray(target)) target = [target];

        const path: MovingPath | undefined = target.map((target, index, self) => {
            // The next node starts with the last node
            let fromx = !index ? me.x : self[index - 1].x,
              fromy = !index ? me.y : self[index - 1].y;

            // avoid d2bs issues
            if (typeof target.hook === 'undefined') target.hook = undefined;

            let path = (getPath(me.area, target.x, target.y, fromx, fromy, 2, 4) || []);
            // sometimes the reduction path messes us that we dont have any path left to take (bugs in arcane)
            if (!path.length) path = (getPath(me.area, target.x, target.y, fromx, fromy, 0, 4) || []);

            return path.map((el, idx) => {

                // last index of the path gets the hook. Since path is in reverse order, last node is idx 0
                if (idx === 0 && target.hook) {
                    console.log('Assign the current hook');
                    return {x: el.x, y: el.y, index: index, hook: target.hook};
                }

                // normal ones dont -> hook: undefined to avoid d2bs issues
                return {x: el.x, y: el.y, index: index, hook: undefined};
            });
        }).reduce((cur, acc) => { // .flat() ?
            // push each node to the list
            cur.forEach(el => acc.push(el));
            return acc;
        }, []) as any;

        if (!path) throw new Error('failed to generate path');

        path.reverse();
        const lines = path.map((node, i, self) => i/*skip first*/ && new Line(self[i - 1].x, self[i - 1].y, node.x, node.y, 0x33, true));

        path.forEach((el, idx) => {
            if (el.hook && idx) {
                console.log('path ', idx, 'has a hook');
            }
        })

        currentWalkingPath = path;
        const pathCopy = path.slice();

        // find where to start (usefull to render a long path with nodes to walk back
        const startIndex = path.findIndex(path => path.index === settings.startIndex);
        if (startIndex > -1) console.log('start idnex');
        let loops = 0, shrine;
        for (let i = startIndex > 1 ? startIndex : 0, node, l = path.length; i < l; loops++) {
            if (settings.allowClearing && settings.clearFilter && canTeleport) {
                let oldI = i;
                let j = i + 1;
                let monsters = getUnits(sdk.unittype.Monsters)
                  .filter(m => m.attackable && settings.clearFilter(m, path[j]));
                while (j < path.length && !path[j].hook && monsters.length === 0 && getWalkDistance(path[j].x, path[j].y) < 30 && settings.allowClearing) {
                    j += 1;
                    monsters = getUnits(sdk.unittype.Monsters)
                      .filter(m => m.attackable && settings.clearFilter(m, path[j]));
                }
                i = Math.min(path.length - 1, j - 1);
                const jumped = i - oldI;
                if (jumped > 0) {
                    console.log('Made node jump of -> ' + jumped)
                }
            }

            node = path[i];
            path.index = i;
            lines.forEach((line, i) => line.color = i < path.index ? 0x99 : 0x7A);

            if (me.inTown && !didSkipTown) {
                didSkipTown = true;
                console.log('Total nodes -> ' + path.length);
                let area, exits: Exit[] = [];
                (area = getArea(me.area)) && (exits = area.exits);

                const target = exits.find(exit => {
                    const closeExitNode = path.findIndex(node => getDistance(node, exit) < 10);

                    if (closeExitNode > -1) {
                        // i = Math.min(closeExitNode-3 , 1);
                        i = closeExitNode;
                        return true;
                    }
                    return false;
                });

                if (!target) {
                    console.log('Walking in town, but cant find any exit to walk to. So, simply walk normally');
                }
            }

            const hookEvent: (() => void) | undefined = node.hook;

            me.overhead('Moving to node (' + i + '/' + l + ') -- ' + Math.round(node.distance * 100) / 100);
            if (node.distance < 5) {
                i++;
                // console.log('Skipping node as its too nearby -> Hook? ', hookEvent);
                hookEvent && hookEvent();
                continue;
            }

            //ToDo; teleport a part if we have enough mana and it saves us a bunch of nodes
            // Like if we can skip by 35 of distance, yet remove a walk path of 60, we rather use a single teleport

            // The path generated is long, we want sub nodes
            // fixme: this will never be true, because we get a path from target by chunks of distance 4, see line 89-91
            // so the distance to next node is always 4
            if (node.distance > 30) {
                const d = getWalkDistance(node.x, node.y);

                // If walking to the node is twice as far as teleporting, we teleport
                if (canTeleport && d * 2 > node.distance) {
                    if (node.distance > 35) {
                        Pather.moveTo(node.x, node.y, 4, settings.allowClearing)
                    } else {
                        Pather.teleportTo(node.x, node.y);
                    }
                } else {
                    console.debug('DONT USE RECURSION HERE WTF?');
                    Pather.moveTo(node.x, node.y);
                }
            }

            // decent fix for this
            me.cancel(0) && me.cancel(0) && me.cancel(0) && me.cancel(0);

            if (node.distance > 2) {
                if (getWalkDistance(node.x, node.y) * 0.9 > node.distance) {
                    Pather.moveTo(node.x, node.y);
                } else {
                    Pather.walkTo(node.x, node.y);
                }
            }

            if (settings.callback && settings.callback()) return;

            // ToDo; only if clearing makes sense in this area due to effort
            let range = 14 / 100 * clearPercentage;
            if (settings.allowClearing) {
                clear({
                    nodes: path,
                    range: settings.rangeOverride || Math.max(4, range),
                    callback: settings.callback,
                    filter: settings.clearFilter
                });
            }

            // Do a dry run of clear, if no attack is wanted, do a pick
            if (clear({
                nodes: path,
                range: settings.rangeOverride || Math.max(4, range),
                callback: settings.callback,
                filter: settings.clearFilter,
                dryRun: true,
            })) {
                Pickit.pickOnPath(path);
                Misc.openChests(8);
            } else {
                console.log('Skip pick due to monsters')
                // Only very near items here
                Pickit.pickItems(3, true);
            }
            // console.log('after pick');


            // if shrine found, click on it
            if ((shrine = searchShrine())) {
                skipShrine.push(shrine.gid);
                const nearestShrine = path.slice().sort((a, b) => getDistance(shrine, a) - getDistance(shrine, b)).first();

                if (nearestShrine) {
                    ((originalHook, shrineId) => {
                        // First run original hook on this spot, if it had any
                        originalHook && originalHook();

                        // once we are near
                        nearestShrine.hook = () => {
                            console.log('Should take shrine')
                            const shrine = getUnits(2, "shrine").filter(el => el.gid === shrineId).first();
                            if (shrine) {
                                // ToDo; use walk near / tk if we got it
                                moveTo([{
                                    x: shrine.x,
                                    y: shrine.y,
                                    hook() {
                                        Misc.getShrine(shrine);
                                    }
                                }]);
                            }
                        }
                    })(typeof nearestShrine.hook !== 'undefined' ? nearestShrine.hook : undefined, shrine.gid);
                }
            }

            // if this wasnt our last node
            if (l - 1 !== i) {

                if (path.index < i) {
                    console.debug('Walked back?');
                    // let nearestNode = pathCopy.filter(el => el.index === node.index).sort((a, b) => a.distance - b.distance).first();
                    i = path.index;
                    hookEvent && hookEvent();
                    continue;
                } else {

                    // Sometimes we go way out track due to clearing,
                    // lets find the nearest node on the path and go from there
                    // but not of the next node path
                    let nearestNode = pathCopy.filter(el => el.index === node.index).sort((a, b) => a.distance - b.distance).first();
                    // let nearestNode = path.slice(Math.min(path.index-10,0), path.index + 30).sort((a, b) => a.distance - b.distance).first();

                    // if the nearest node is still in 95% of our current node, we dont need to reset
                    if (nearestNode.distance > 5 && node.distance > 5 && 100 / node.distance * nearestNode.distance < 95) {

                        console.debug('reseting path to other node');
                        // reset i to the nearest node
                        let newIndex = path.findIndex(node => nearestNode.x === node.x && nearestNode.y === node.y);
                        // Move forward
                        if (newIndex > i) {
                            // Hook all skipped nodes
                            for (let j = i; j < newIndex; j++) {
                                const hookEvent = path[i + j]?.hook;
                                if (hookEvent) {
                                    console.log('Skipped nodes, ')
                                    hookEvent();
                                }
                            }
                            i = newIndex;
                        }
                        hookEvent && hookEvent();
                        continue; // and there for no i++
                    }
                }
                hookEvent && hookEvent();
                i++;
            }
        }
    } finally {
        // reset current path
        currentWalkingPath = _prevpath;
        recursiveMoveTo--;
    }
}

let recursiveMoveTo = 0;
