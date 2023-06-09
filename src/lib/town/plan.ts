import {Npcs, NpcStats} from "./npcs";
import {ShopTask} from "./task";
import {acts} from "./act";
import {Npc, Urgency} from "./enums";

type Node = {act: number, x: number, y: number, npc: Npc, tasks: ShopTask[], d: number};

type Writeable<T> = {
  -readonly [P in keyof T]: T[P];
};

class Route {

  public readonly totalDistance: number

  constructor(
    public readonly nodes: ReadonlyArray<Node>,
    extraDistance: number = 0,
  ) {
    this.totalDistance = (extraDistance|0) + nodes.reduce((acc,cur) => acc+cur.d, 0);
  }

}

export class Plan {
  public readonly level: Urgency;
  public route: Route;
  public readonly endGoal: 'waypoint' | 'portal' | 'exit' = 'waypoint';

  constructor(
    public readonly tasks: ShopTask[],
  ) {
    this.level = this.tasks.reduce((acc, {urgency}) => urgency > acc ? urgency : 0, Urgency.Not)
  }

  townNeeded() {
    // If any action is something that needs town
    return this.tasks.some(task => task.isTownNeeded())
  }

  calculate() {
    let startAct = me.act;

    const urgencies = this.tasks.groupBy(el => String(el.urgency)) as { [P in Urgency]?: ShopTask[] };

    const needed = urgencies[Urgency.Needed];
    if (!needed) {
      console.log('No shop needed');
      return this;
    }

    console.log('Want to '+needed.map(el => el.action.type).join(','));
    const neededFlags = needed.reduce((acc,cur) => acc | cur.action.npcFlag, 0);
    // Get all possible npc combinations
    let groups = Npcs.getGroups(neededFlags);

    const routes = [] as Route[];

    console.log('Calculating all routes. Having '+groups.length+' options');

    for(const group of groups) {
      let current: Node = {act: me.act, x: me.x, y: me.y, npc: undefined as Npc, tasks: [] as ShopTask[], d: 0};
      const nodes = [] as Node[];

      const didTasks = new Set<ShopTask>();
      for(const npc of group) {
        const actOfNpc = Npcs.actOf(npc) - 1;
        const distance = acts[actOfNpc].getDistance(current, npc);
        const [x,y] = acts[actOfNpc].getLocationRelative(npc);

        // ToDo; stop here if distance is already bigger as current lowest

        // Get tasks to be done here
        const tasks = needed.filter(el => (el.action.npcFlag & NpcStats[npc]) === el.action.npcFlag && !didTasks.has(el));
        nodes.push(current = {
          act: Npcs.actOf(npc),
          npc: npc,
          tasks,
          x,
          y,
          d: distance,
        });

        tasks.forEach(task => {
          task.npc.npc = current.npc;
          task.npc.act = current.act;
          didTasks.add(task)
        });
      }

      // ToDo make it possible to have another endpoint as waypoint itself
      const wpDistance = acts[current.act-1].getDistance(current, 'waypoint');
      const route = new Route(nodes, wpDistance)
      routes.push(route);
    }

    // Rewrite to a distance search thing instead of sorting all possibilities
    routes.sort((a,b) => a.totalDistance-b.totalDistance);

    // ToDo remove for debug
    // for(const route of routes) console.log('Group '+Math.round(route.totalDistance)+ ' -- '+route.nodes.map(el => el.npc).join(', '));

    const route = routes[0];
    if (!route) return this;

    // Set route
    this.route = route;

    // Insert Convenience shops if we visit the shop anyway
    for(const task of urgencies[Urgency.Convenience] ?? []) {
      const flags = task.action.npcFlag;

      const node = route.nodes.find(el => (NpcStats[el.npc] & flags) === flags)
      if (!node) continue;
      console.log('  Will '+task.action.type+' since we visit '+node.npc+' anyway');

      task.npc.npc = node.npc;
      task.npc.act = node.act;
      node.tasks.push(task);
    }

    // Print plan
    console.log('Planned town visit. Plan:\n  '+route.nodes.map(node => node.npc + ' (' + node.tasks.map(el => el.action.type).join(', ') + ')').join('\n  ')+'\n  end goal: '+this.endGoal);

    return this;
  }

  execute() {
    if (!this.route) {
      return;
    }

    // if anything needs town, might as well go to town
    if (this.townNeeded()) {
      Town.goToTown();
    }

    for (const node of this.route.nodes) {
      for(const task of node.tasks) {
        console.log('Running - ' + task.action.type+' at '+task.npc.npc+' in act'+task.npc.act);
        if (!task.run()) {
          break;
        }
      }
    }
    return this;
  }

  executeIf(level: Urgency) {
    if (level >= this.level) {
      this.execute();
    }
    return this;
  }
}