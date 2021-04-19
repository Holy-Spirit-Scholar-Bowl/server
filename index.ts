import { connection, IMessage, request } from "websocket";
import Client from "./client";
import WSServer from "./server";
import {
  ReceiveCommand,
  ReceiveCommands,
  ReceiveCommandsKey,
  CommandHandlerParameter,
  SendOnlineParameters,
} from "./types";
import { performance } from "perf_hooks"

/**
 * A websocket based buzzer server
 */
export default class BuzzerServer extends WSServer {
  clients: Client[];

  activeBuzzer: string | null = null;
  buzzTime: number | null = null;

  /** Creates the server */
  constructor() {
    super();
    this.clients = [];
  }

  /**
   * Runs when a request to connect is made. Handles the request and registers the client
   * @param _request the request object
   */
  onRequest(_request: request, conn: connection) {
    this.sendMessage("name", null, conn);
  }

  /**
   * Fires when a connection is closed
   * @code the close code
   * @desc a description
   */
  onClose(code: number, desc: string) {
    this.log("CLOSE", code, desc);
    this.clients = this.clients.filter((e) => e.conn?.connected);
    this.updateOnline();
  }

  /**
   *
   * Fetches the host
   * @returns the first client with an `isHost` property of `true`
   */
  getHost() {
    return this.clients.find((e) => e.isHost);
  }

  /**
   * Called when a message is received
   * @param message the message object
   * @param conn the connection it came from
   */
  onMessage(message: IMessage, conn: connection) {
    this.log("RECEIVE", message.utf8Data);

    let client = this.getClientWithConnection(conn);

    const msg = message.utf8Data;

    if (!msg) {
      this.error("No message received");
      return;
    }

    if (!client) {
      this.error("Message came from an unknown client");
      return;
    }

    let data: ReceiveCommand<ReceiveCommands> = JSON.parse(msg);
    let { command } = data;

    type CommandAction<T extends ReceiveCommandsKey> = ({
      cmd,
      conn,
      client,
    }: CommandHandlerParameter<T>) => void;
    let actions: {
      [key in keyof typeof ReceiveCommands]: CommandAction<key>;
    } = {
      name: this.onNameCommand,
      host: this.onHost,
      buzz: this.onBuzz,
      chat: this.onChat,
      kick: this.onKick,
      ans: this.onAnsCommand,
      clear: this.onClear,
      reset: this.onReset,
      teams: this.onTeamsCommand,
      points: this.onPointsCommand,
      restart: this.onRestartCommand,
    };

    if (command in ReceiveCommands) {
      // I really shouldn't have to cast here...oh well
      let handler = actions[command] as CommandAction<typeof command>;
      // Something really strange is happening with scoping here. Without using `.call`, `this` is `undefined` in the function
      handler.call(this, { cmd: data, conn, client });
    } else {
      this.error(new Error(`UNKNOWN MESSAGE TYPE: ${msg}`));
    }

    client.addMessageLog(data)
    if (client.overRateLimit) {
      client.conn?.close(4002, "Too many actions");
      this.log("KICK", client.name, "sent 10 messages in ", (client.sentMessageTimes[9] - client.sentMessageTimes[0]) / 1000, "seconds")
    }
  }

  onRestartCommand({} = {}) {
    this.wsServer?.closeAllConnections();
    this.server?.close(() => {
      this.startUp();
    });
  }

  /**
   * Called when a teams command is received
   */
  onTeamsCommand({ cmd }: { cmd: ReceiveCommand<"teams"> }): void {
    for (let user of cmd.parameters.users) {
      let client = this.getClientWithName(user.name);
      if (!client) continue;
      client.team = user.team;
      this.sendMessage(
        "team",
        {
          team: user.team,
        },
        client.conn!
      );
    }
  }

  /**
   * Called when a buzz is cleared
   * @param conn the connection the clear came from
   */
  onClear({ conn }: CommandHandlerParameter<"clear">) {
    this.broadcast("clear", null, conn);
    this.activeBuzzer = null;
    this.buzzTime = Number.MAX_VALUE;
  }

  /**
   * Called when a chat message is sent
   * @param cmd the command the message is contained in
   * @param conn the connection it came from
   */
  onChat({ cmd, conn }: CommandHandlerParameter<"chat">) {
    let { message } = cmd.parameters;
    let name = this.getClientWithConnection(conn)?.name ?? "Unknown";
    this.broadcast(
      "chat",
      {
        name,
        message,
      },
      conn
    );
  }

  /**
   * Called when the scoreboard is reset
   */
  onReset({}: CommandHandlerParameter<"reset">) {
    Client.resetPoints();
    this.updateOnline();
  }

  /**
   * Called when a buzz is received
   * @param cmd the command containing the buzz
   * @param conn the connection it came from
   */
  onBuzz({ cmd, conn }: CommandHandlerParameter<"buzz">) {
    // If command sent before current buzz or if no current buzz
    if (cmd.sent < (this.buzzTime ?? Number.MAX_VALUE)) {
      this.activeBuzzer = cmd.user.name;
      this.buzzTime = cmd.sent;

      this.broadcast(
        "buzz",
        {
          buzzer: this.activeBuzzer,
        },
        conn
      );
    }
  }

  /**
   * Called when a user is kicked
   * @param cmd the command the kick is contained in
   */
  onKick({ cmd }: CommandHandlerParameter<"kick">) {
    let target = this.getClientWithName(cmd.parameters.name)?.conn;
    // Close the connection
    target?.close(
      4000,
      `You have been kicked by the host, ${this.getHost()?.name}`
    );
    // Update the online list
    this.updateOnline();
  }

  /**
   * Called when a user is made host
   * @param cmd the command
   * @param conn the connection it came from
   */
  onHost({ cmd, conn }: CommandHandlerParameter<"host">) {
    if (this.getHost()) {
      this.getHost()!.isHost = false;
    }

    let newHost = this.getClientWithName(cmd.parameters.host);
    if (newHost) {
      newHost.isHost = true;
    }

    // Update everyone
    this.broadcast(
      "host",
      {
        host: cmd.parameters.host,
      },
      conn
    );
  }

  /**
   * Called when a user gives the handshake
   * @param cmd the command containing the info
   * @param connection the connection it came from
   * @param client the corresponding client
   */
  onNameCommand({ cmd, conn, client }: CommandHandlerParameter<"name">) {
    let { name, realName, host: shouldBeHost, team } = cmd.user;

    // If name in use, send an error and close
    if (this.clients.some((e) => e.name === name)) {
      client.conn?.close(
        4001,
        `Someone else is using the name ${name}. Please try a different name and reconnect`
      );
      return;
    }
    client.name = name;
    client.realName = realName;
    client.team = team;

    if (shouldBeHost) {
      this.clients.forEach((e) => (e.isHost = false));
      client.isHost = true;

      this.broadcast(
        "host",
        {
          host: name,
        },
        conn
      );
    }

    this.sendMessage("success", null, conn);

    // Tell them who the host and buzzer are
    if (this.getHost()) {
      this.sendMessage(
        "host",
        {
          host: this.getHost()!.name,
        },
        conn
      );
    }

    this.sendMessage(
      "buzzer",
      {
        buzzer: this.activeBuzzer,
      },
      conn
    );

    this.updateOnline();
  }

  /**
   * Called when the scoreboard should be updated
   * @param cmd the command containing the info
   */
  onAnsCommand({ cmd }: CommandHandlerParameter<"ans">) {
    if (!this.activeBuzzer || !this.getClientWithName(this.activeBuzzer))
      return;
    let { correct, powerOrNeg } = cmd.parameters;

    let basePoints = correct ? 10 : 0;
    basePoints += powerOrNeg ? (correct ? 5 : -5) : 0;

    let client = this.getClientWithName(this.activeBuzzer);
    if (client) client.points += basePoints;

    this.updateOnline();
  }

  onPointsCommand({ cmd }: CommandHandlerParameter<"points">) {
    let client = this.getClientWithName(cmd.parameters.name);
    if (client) {
      client.points = cmd.parameters.points;
      this.updateOnline();
    }
  }

  /**
   * Updates the online list and sends it out
   */
  updateOnline() {
    let noTeam = this.clients.filter((client) => client.team === "").map((client) => {
      return { user: client.name, points: client.points }
    })

    let onTeam = this.clients.filter((client) => client.team !== "")
    let teams = Array.from(new Set(onTeam.map((client) => client.team)))

    let teamPoints: SendOnlineParameters["teams"] = teams.map((team) => {
      let clients = onTeam.filter((client) => client.team === team)
      return {
        team,
        points: clients.reduce((prev, curr) => prev + curr.points, 0),
        users: clients.map((client) => {
          return {
            points: client.points,
            user: client.name
          }
        })
      }
    })

    let params: SendOnlineParameters = {
      users: noTeam,
      teams: teamPoints
    }
    this.broadcast("online", params)
  }
}

let s = new BuzzerServer();
s.startUp();
