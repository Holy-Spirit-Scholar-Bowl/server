import { connection } from 'websocket';
export default class Client {
  conn: connection | null = null;

  sendMessage(message: string) {
    this.conn?.send(message);
  }

  isHost: boolean = false;

  name: string = '';

  realName: string = '';

  team: string = '';

  get points() {
    return Client.points[this.realName] ?? 0;
  }

  set points(value: number) {
    Client.points[this.realName] = value;
  }

  static points: Record<string, number> = {};

  static resetPoints() {
    for (let key of Object.keys(Client.points)) {
      Client.points[key] = 0;
    }
  }
}