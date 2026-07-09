export class MessageLog {
  private lines: string[] = [];
  private readonly max: number;

  constructor(max = 6) {
    this.max = max;
  }

  add(msg: string): void {
    this.lines.push(msg);
    while (this.lines.length > this.max) this.lines.shift();
  }

  clear(): void {
    this.lines = [];
  }

  getLines(): string[] {
    return [...this.lines];
  }
}
