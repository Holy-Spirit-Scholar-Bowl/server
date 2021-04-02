import { IMessageEvent } from "websocket";
import WSServer from "../server"
import FakeClient from "./FakeClient";

describe("the FakeClient class", () => {
  let server: WSServer;
  let fakeClient: FakeClient;

  let defaultUserData = { name: "test", realName: "test", team: "test", host: false };
  let noop = () => {};

  beforeEach(async (done) => {
    server = new WSServer();
    await server.startUp();
    done();
  })

  it("opens a connection", async (done) => {
    fakeClient = new FakeClient(noop, defaultUserData);
    await fakeClient.startUp();
    done();
  });

  it("receives messages", async (done) => {
    let messageHandlerMock = jest.fn();
    fakeClient = new FakeClient(messageHandlerMock, defaultUserData);
    await fakeClient.startUp();
    fakeClient.waitForMessage().then(() => {
      expect(messageHandlerMock).toHaveBeenCalled();
      done();
    });
    setImmediate(() => {
      server.clients[0].sendMessage("test");
    });
  });

  it("sends messages", async (done) => {
    let messageHandlerMock = jest.fn();
    server.onMessage = messageHandlerMock;

    fakeClient = new FakeClient(noop, defaultUserData);
    await fakeClient.startUp();
    setTimeout(() => {
      expect(messageHandlerMock).toHaveBeenCalled();
      done();
    }, 100);
    fakeClient.send("test");
  });

  it("can send commands", async (done) => {
    let messageHandlerMock = jest.fn();
    server.onMessage = messageHandlerMock;

    fakeClient = new FakeClient(noop, defaultUserData);
    await fakeClient.startUp();
    fakeClient.sendCommand("test", {})
    setTimeout(() => {
      expect(messageHandlerMock).toHaveBeenCalled();
      done();
    }, 100);
  });

  it("can await messages", (done) => {
    fakeClient = new FakeClient(noop, defaultUserData);
    fakeClient.waitForMessage().then((data) => {
      expect(data.data).toEqual("test");
      done();
    });
    fakeClient.onMessage({ data: "test" });
  });

  afterEach((done) => {
    if (server) {
      server.server?.close();
      server.wsServer?.closeAllConnections();
      setTimeout(done, 500)
    } else {
      done();
    }
  });
})