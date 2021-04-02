import Client from "../client";
import Server from "../index";
import { SendCommand, SendCommandsKey } from "../types";
import FakeClient from "./FakeClient";

describe("the Server class", () => {
  let server: Server = new Server();

  beforeAll(async (done) => {
    await server.startUp()
    done();
  })

  let defaultUserData = { name: "test", realName: "test", team: "test", host: false };

  let noop = () => {};

  it("handles registration correctly", async (done) => {
    let hasReceivedName = false;
    let hasReceivedBuzzer = false;
    let hasReceivedSuccess = false;

    let client: FakeClient = new FakeClient((ev) => {
      let { command } = JSON.parse(ev.data.toString());
      if (command === "name") {
        hasReceivedName = true;
        client.sendCommand("name", null);
      } else if (command === "success") {
        expect(hasReceivedName).toBe(true);
        hasReceivedSuccess = true;
      } else if (command === "buzzer") {
        expect(hasReceivedSuccess).toBe(true);
        hasReceivedBuzzer = true;
      } else if (command === "online") {
        expect(hasReceivedBuzzer).toBe(true);

        expect(server.clients.length).toBeGreaterThan(0);
        expect(server.clients[server.clients.length - 1].name).toEqual(defaultUserData.name);
        expect(server.clients[server.clients.length - 1].realName).toEqual(defaultUserData.realName);
        expect(server.clients[server.clients.length - 1].team).toEqual(defaultUserData.team);
        expect(server.clients[server.clients.length - 1].isHost).toEqual(defaultUserData.host);

        done();
      }
    }, defaultUserData);
    await client.startUp();
  });

  it("can find the host", () => {
    let isHost = new Client()
    isHost.isHost = true;

    let notHost = new Client();
    notHost.isHost = false;

    server.clients = [isHost, notHost];

    expect(server.getHost()).toStrictEqual(isHost);

    server.clients = [notHost, isHost];
    expect(server.getHost()).toStrictEqual(isHost);
  });

  afterAll((done) => {
    server.wsServer?.closeAllConnections();
    server.server?.close(done);
  })
})