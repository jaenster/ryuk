export abstract class Decision {
  type: string;
  private static doneMap: { [data: string]: true } = {};

  public abstract run();

  constructor(type?: string) {
    this.type = type;
  }

  static isDone(type: string): boolean {
    return Decision.doneMap.hasOwnProperty(type);
  }

  markAsDone() {
    Decision.doneMap[this.type] = true;
  }

}