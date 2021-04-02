import { IMessageEvent, w3cwebsocket as WebSocket } from "websocket";
export default class FakeClient {
  ws: WebSocket = new WebSocket("ws://localhost:80", "echo-protocol");

  opened = false;


  constructor(onMessage: (ev: IMessageEvent) => void, userData: { name: string, realName: string, team: string, host: boolean }) {
    this.onMessage = onMessage;
    this.ws.onmessage = (ev: IMessageEvent) => {
      this.onMessage(ev);
    }

    this.userData = userData;
  }

  startUp(onOpen: () => void = () => {}): Promise<void> {
    return new Promise(resolve => {
      this.ws.onopen = () => {
        onOpen();
        resolve();
      }
    })
  }

  onOpen() {
    this.opened = true;
  }

  waitForMessage(): Promise<IMessageEvent> {
    return new Promise(resolve => {
      let currentHandler = this.onMessage;
      this.onMessage = (ev: IMessageEvent) => {
        currentHandler(ev);
        this.onMessage = currentHandler;
        resolve(ev);
      }
    })
  }

  onMessage(ev: IMessageEvent) {

  }

  send(message: string) {
    this.ws.send(message);
  }

  userData: { name: string, realName: string, team: string, host: boolean };

  sendCommand<T>(type: string, parameters: T): { command: string, parameters: T, sent: number, user: { name: string, realName: string, team: string, host: boolean }} {
    let cmd = {
      command: type,
      parameters,
      sent: (new Date()).getTime(),
      user: this.userData
    };

    this.send(JSON.stringify(cmd));

    return cmd;
  }
}