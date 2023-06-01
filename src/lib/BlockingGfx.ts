import Worker from "../lib/worker";
import sdk from "../sdk";
import {BlockBits, getCollisionBetweenCoords} from "./Coords";

export const BlockingUnit: number[] = [1, 155];

interface Text {
};

class UpdateableText {
  private hooks: (() => string)[];
  private x: number;
  private y: number;
  private elements: any[];

  constructor(settings: {
    hooks: (() => string)[],
    x: number, y: number,
  }) {
    this.hooks = settings.hooks;
    this.x = settings.x;
    this.y = settings.y;
    // @ts-ignore
    this.elements = settings.hooks.map((callback, idx) => {
      console.debug(this.x)
      // @ts-ignore
      return new Text(callback(), this.x + 15, this.y + (10 * idx), 0, 12, 0)
    });
    Worker.runInBackground('myHooks', this.update.bind(this));
  }

  private update() {
    this.hooks.forEach((hook, idx) => {
      this.elements[idx].text = hook();
      this.elements[idx].visible = true; //ToDo; make ti callable
    })
    return true; // keep on updating
  }
}


const hooks = [];
for (let i = 0; i < 16; i++) {
  (i => hooks.push(() => {
    const gottenUnit = getUnit.apply(null, BlockingUnit);
    const collision = gottenUnit ? getCollisionBetweenCoords(gottenUnit, me) : 0;
    let bit = (1 << i);

    if (!gottenUnit) return '?';
    return (collision & bit) ? 'Blocked By: ' + (BlockBits[bit]) : '';

  }))(i);

}


// @ts-ignore
if (getScript(true).name.toLowerCase() === 'default.dbj') {
  // new UpdateableText({hooks, x: 600, y: 0,});
}