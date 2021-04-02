import WSServer from "../server";
import { Command } from "../types";
import FakeClient from "./FakeClient";

describe("the WSServer class", () => {
  let server = new WSServer();
  let fakeClients: FakeClient[] = [];

  let noop = () => {};

  beforeAll(async (done) => {
    await server.startUp();
    done();
  });

  async function setupClients() {
    server.wsServer?.closeAllConnections();
    server.clients = [];

    for (let i = 0; i < 3; i++) {
      let clientData = {
        name: `client${i}`,
        realName: `client_${i}`,
        host: false,
        team: ""
      };
  
      fakeClients[i] = new FakeClient(noop, clientData);
    }
  
    await Promise.all(fakeClients.map(fakeClient => fakeClient.startUp()));
  }

  it("logs properly", () => {
    expect(() => { server.log("test log", "message1", "message2 ")}).not.toThrow();
    expect(() => { server.error("not really an error") }).not.toThrow();
  });

  it("properly accepts and rejects origins", () => {
    let goodOrigins = ["https://hsscholarbowl.github.io/hssb", "http://hsscholarbowl.github.io/hssb", "localhost:8080"];
    let badOrigins = ["https://google.com", "230.9.4.123"]
    for (let goodOrigin of goodOrigins) {
      expect(server.originAllowed(goodOrigin)).toBe(true);
    }

    for (let badOrigin of badOrigins) {
      expect(server.originAllowed(badOrigin)).toBe(false);
    }
  });

  it("can find clients", async (done) => {
    await setupClients();
    expect(server.clients.length).toBeGreaterThan(0);

    server.clients[0].name = "client0"
    expect(server.getClientWithName("client0")).toEqual(server.clients[0]);

    expect(server.getClientWithConnection(server.clients[0].conn!)).toEqual(server.clients[0]);

    server.clients[0].realName = "client_0"
    expect(server.findClient((client) => client.realName === "client_0")).toEqual(server.clients[0]);

    done();
  });

  it("can send a command to a client", async (done) => {
    await setupClients();
    expect(server.clients.length).toBe(3);

    let cmd: Command<null, "clear"> | null = null;
    cmd = server.sendMessage("clear", null, server.clients[0].conn!);

    fakeClients[0].waitForMessage().then((ev) => {
      expect(ev.data).toEqual(JSON.stringify(cmd));
      done();
    });

  });

  it("can broadcast a message to all clients", async (done) => {
    await setupClients();
    
    let msgs: string[] = [];
    for (let i = 0; i < fakeClients.length; i++) {
      fakeClients[i].onMessage = (ev) => {
        msgs[i] = ev.data.toString();
      }
    }

    let cmds = server.broadcast("clear", null);
    setTimeout(() => {
      for (let i = 0; i < msgs.length; i++) {
        expect(msgs[i]).toEqual(JSON.stringify(cmds[i]));
      }
      done();
    }, 100);
  });

  afterAll((done) => {
    server.wsServer?.closeAllConnections();
    server.server?.close(done);
  })
})