import {
  server as WebSocketServer,
  connection,
  request,
  IMessage,
} from "websocket";
import { SendCommand, SendCommandParameters, SendCommandsKey } from "./types";
import { createServer, Server } from "http";
import Client from "./client";
import { performance } from "perf_hooks";

export default class WSServer {
  clients: Client[] = [];

  server?: Server;

  wsServer?: WebSocketServer;

  /**
   * Initializes the server. Creates the HTTP server and starts the WS connection.
   */
  startUp(): Promise<void> {
    // TODO look into using async/await rather than pure Promise
    return new Promise(resolve => {
      this.server = createServer((request, response) => {
        this.log("RECEIVED REQUEST", "FOR", request.url);
        response.writeHead(404);
        response.end();
      });

      this.server.listen(process.env.PORT || 80, () => {
        this.log("LISTEN", `on port ${process.env.PORT || 80}`);
        resolve();
      });

      this.wsServer = new WebSocketServer({
        httpServer: this.server,
        autoAcceptConnections: false,
      });
      
      this.wsServer.on("request", (req) => this._onRequest(req));
    })
  }


  /**
   * Broadcasts a message to multiple clients
   * @param type the type of command to send
   * @param parameters the parameters to send with the command
   * @param excluding a connection not to send the command to
   */
  broadcast<T extends SendCommandsKey>(
    type: T,
    parameters: SendCommandParameters<T>,
    excluding: connection | null = null
  ): SendCommand<T>[] {
    let ret: SendCommand<T>[] = [];
    this.wsServer?.connections
      .filter((e) => excluding === null || e !== excluding)
      .forEach((e) => {
        ret.push(this.sendMessage(type, parameters, e));
      });

    return ret!;
  }

  /**
   * Sends a message to a single client
   * @param type the type of command to send
   * @param parameters the parameters to send with the command
   * @param to the connection to send the command to
   */
  sendMessage<T extends SendCommandsKey>(
    type: T,
    parameters: SendCommandParameters<T>,
    to: connection
  ): SendCommand<T> {
    let cmd: SendCommand<T> = {
      command: type,
      parameters,
      sent: performance.now(),
      user: { // It really shouldn't be necessary to do this
        name: "server",
        realName: "server",
        team: "",
        host: false
      }
    };
    let encoded = JSON.stringify(cmd);
    this.log("SEND", "type:", type, ", parameters:", JSON.stringify(parameters), ", full: ", encoded);
    to.send(encoded);

    return cmd;
  }


  /**
   * Determines whether an origin should be allowed to connect
   * @param origin
   */
  originAllowed(origin: string): boolean {
    // Matches any origin from *.github.io or localhost
    return !!origin?.match(
      /(https?:\/\/)?(\w+\.github\.io|localhost)(:\d+)?\/?/
    );
  }

   /**
   * Gets the client with a specific connection
   * @param conn the connection of the client
   * @returns the client
   */
  getClientWithConnection(conn: connection) {
    return this.findClient((e) => e.conn === conn);
  }

  /**
   * Finds a client by using a callback
   * @param filter The filter to run on each client.
   * @returns the first client for which the callback returned `true`
   */
  findClient(filter: (client: Client) => boolean) {
    return this.clients.find(filter);
  }

  /**
   * Gets a client by name
   * @param name the name of the client
   * @returns the first (and only) client with the given name
   */
  getClientWithName(name: string) {
    return this.findClient((e) => e.name === name);
  }

  /**
   * Throws an error
   * @param err 
   */
  error(err: Error | string) {
    console.error("[SERVER]", err);
  }

  /**
   * Logs messages
   * @param type the type of message being logged
   * @param messages the messages to log
   */
  log(type: string, ...messages: any[]) {
    console.log("[SERVER]", type, ...messages);
  }

  private _onRequest(req: request) {
    if (req.origin && !this.originAllowed(req.origin)) {
      req.reject(401, "Bad origin");
      this.log("REJECT ORIGIN", req.origin);
      return;
    }
    this.log("ACCEPT ORIGIN", req.origin);

    // TODO protocol is unnecessary
    let connection = req.accept("echo-protocol", req.origin);
    this.log("ACCEPT CONNECTION");

    connection.on("message", (data: IMessage) =>
      this.onMessage(data, connection);
    );

    connection.on("close", (code, desc) => {
      this.onClose(code, desc);
    });

    let client = new Client();
    client.conn = connection;
    this.clients.push(client);

    this.onRequest(req, connection);
  }

  /** Should be overriden by subclasses */
  onRequest(req: request, conn: connection): void {}

  /** Should be overriden by subclasses */
  onClose(code: number, desc: string): void {}

  /** Should be overriden by subclasses */
  onMessage(message: IMessage, conn: connection): void {}
}
