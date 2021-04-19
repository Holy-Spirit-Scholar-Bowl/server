import { client, connection } from 'websocket';
import { ReceiveCommand, ReceiveCommandsKey } from './types';
import { performance } from "perf_hooks"
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

  sentMessageTimes: number[] = []

  addMessageLog(msg: ReceiveCommand<ReceiveCommandsKey>) {
    this.sentMessageTimes.push(msg.sent);

    while (this.sentMessageTimes.length > 10) {
      this.sentMessageTimes.shift()
    }
  }

  get overRateLimit() {
    return this.sentMessageTimes.length >= 10 && (this.sentMessageTimes[0] + 5000) > this.sentMessageTimes[9];
  }
}