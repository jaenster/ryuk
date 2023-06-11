import sdk from "../../sdk";
import {Npc} from "./enums";

// Diablo's get distance don't work with negative and thus relative values
const getDist = (x1: number, y1: number, x2: number, y2: number) => {
  const a = x1 - x2;
  const b = y1 - y2;

  return Math.sqrt( a*a + b*b );
}

export const acts = (() => {
  type Spot = 'stash' | 'portal' | 'waypoint' | 'palace' | 'sewers' | Npc;

  let i = 0;
  let act1wp: [number, number];
  let act1fireUnit: [number, number];

  const spots = [{
    stash: [-7, -12],
    [Npc.Warriv]: [-5, -2],
    [Npc.Cain]: [+6, -5],
    [Npc.Kashya]: [+14, -4],
    [Npc.Akara]: [+56, -30],
    [Npc.Charsi]: [-39, -25],
    [Npc.Gheed]: [-34, +36],
    portalspot: [+10, +18],
    // Guesstimated, waypoint is in general between charsi and akara. Todo fix actually
    waypoint: [-50, -0],
  }, {
    [Npc.Fara]: [5124, 5082],
    [Npc.Cain]: [5124, 5082],
    [Npc.Lysander]: [5118, 5104],
    [Npc.Greiz]: [5033, 5053],
    [Npc.Elzix]: [5032, 5102],
    palace: [5088, 5153],
    sewers: [5221, 5181],
    [Npc.Meshif]: [5205, 5058],
    [Npc.Drognan]: [5097, 5035],
    [Npc.Atma]: [5137, 5060],
    [Npc.Warriv]: [5152, 5201],
    portalspot: [5168, 5060],
    stash: [5124, 5076],
    waypoint: [5070, 5083],
  }, {
    [Npc.Meshif]: [5118, 5168],
    [Npc.Hratli]: [5223, 5048, 5127, 5172],
    [Npc.Ormus]: [5129, 5093],
    [Npc.Asheara]: [5043, 5093],
    [Npc.Alkor]: [5083, 5016],
    [Npc.Cain]: [5148, 5066],
    stash: [5144, 5059],
    portalspot: [5150, 5063],
    waypoint: [5158, 5050],
  }, {
    [Npc.Cain]: [5027, 5027],
    [Npc.Halbu]: [5089, 5031],
    [Npc.Tyrael]: [5027, 5027],
    [Npc.Jamella]: [5088, 5054],
    stash: [5022, 5040],
    portalspot: [5045, 5042],
    waypoint: [5043, 5018],
  }, {
    stash: [5129, 5061],
    [Npc.Larzuk]: [5141, 5045],
    [Npc.Malah]: [5078, 5029],
    [Npc.Cain]: [5119, 5061],
    [Npc.Qual_Kehk]: [5066, 5083],
    [Npc.Anya]: [5112, 5120],
    portal: [5118, 5120],
    waypoint: [5113, 5068],
    [Npc.Nihlathak]: [5071, 5111],
  }] as Record<Spot,[number, number]>[];

  type UnitData = Pick<Unit, 'x' | 'y' | 'act'>

  class Act {
    public readonly spots: Record<Spot, [number, number]>;
    public init: boolean = false;

    constructor(public readonly act: number) {
      this.spots = spots[act-1]
    }

    get area() {
      switch(this.act) {
        case 1:
          return sdk.areas.RogueEncampment;
        case 2:
          return sdk.areas.LutGholein;
        case 3:
          return sdk.areas.KurastDocktown;
        case 4:
          return sdk.areas.PandemoniumFortress;
        case 5:
          return sdk.areas.Harrogath;
      }
    }

    toRelative(x: number, y: number, act: number) {
      if (x > 1000 && act === 1 && act1fireUnit) {
        this.initialize();
        x -= act1fireUnit[0];
        y -= act1fireUnit[1];
      }
      return [x,y];
    }

    getDistance(from: UnitData, spot: Spot) {
      const [fromx, fromy] = this.toRelative(from.x, from.y, from.act);
      // Translate to relative paths to actual paths in act 1

      const fromAct = acts[from.act-1];
      if (fromAct === this) {
        // Simply from here to npc
        const [x,y] = this.getLocationRelative(spot);
        return getDist(fromx, fromy, x, y);
      }

      // Inter-act
      // ToDo; calculate shortcuts via warriv travel, messif, tyreal whatever
      const [wpX,wpY] = fromAct.getLocationRelative('waypoint');
      let distance = getDist(fromx, fromy, wpX, wpY);

      // Distance from waypoint to npc
      const [selfWpX, selfWpY] = this.getLocationRelative('waypoint');
      const [toSpotX, toSpotY] = this.getLocationRelative(spot);
      distance += getDist(selfWpX, selfWpY, toSpotX, toSpotY);

      return distance;
    }

    getLocation(spot: Spot): [number, number] {
      return this.translateXY(...this.getLocationRelative(spot));
    }


    goTo(spot: Spot) {
      if (this.act !== me.act) {
        //ToDo; make smart moves about going to specific npc via traveling and whatever
        Town.goToTown(this.act as any);
      }

      const [x,y] = this.getLocation(spot);
      console.log('Moving to '+x+','+y);

      // ToDo; poll until when it sees the npc
      Pather.moveTo(x,y);
    }

    getLocationRelative(spot: Spot): [number, number] {
      if (this.spots[spot]) {
        return this.spots[spot]
      }
      return [Infinity, Infinity];
    }

    moveTo(from: UnitData, spot: Spot) {
      const other = acts[from.act];
      if (other === this) {
        // Simply move to this unit
        const [x,y] = this.translateXY(...this.getLocationRelative(spot));

        Pather.moveTo(x,y);
      } else {
        // Go to other act
        // ToDo; calculate shortest path via warriv travel etc
        Pather.useWaypoint(other.area);

        // Now that we are in the correct act, call that one
        other.moveTo(from, spot);
      }
    }

    // Act 1 coords are relative, this translates it to literal
    private translateXY(x: number, y: number): [number, number] {
      if (me.act === 1 && me.inTown) {
        this.initialize();
        if (x < 1000) {
          return act1fireUnit ? [act1fireUnit[0] + x, act1fireUnit[1] + y] : [x,y];
        }
      }

      return [x,y];
    }

    private initialize() {
      if (!this.init && me.act === 1) {
        const fire = getPresetUnit(me.area, 2,39 /* fire thing*/)
        const wp = getPresetUnit(me.area,2 ,119 /* wp */)

        act1fireUnit = fire && [fire.roomx * 5 + fire.x, fire.roomy * 5 + fire.y];
        act1wp = wp && [wp.x, wp.y]
        this.init = true;
      }
    }
  }

  const acts = [
    new Act(1),
    new Act(2),
    new Act(3),
    new Act(4),
    new Act(5),
  ] as const
  return acts;
})()