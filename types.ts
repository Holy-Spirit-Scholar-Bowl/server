import { connection } from "websocket";
import Client from "./client";

export enum SendCommands {
  buzzer = "buzzer",
  chat = "chat",
  name = "name",
  clear = "clear",
  success = "success",
  host = "host",
  buzz = "buzz",
  online = "online",
  team = "team",
}

export enum ReceiveCommands {
  reset = "reset",
  clear = "clear",
  kick = "kick",
  name = "name",
  host = "host",
  ans = "ans",
  buzz = "buzz",
  chat = "chat",
  teams = "teams",
  points = "points",
  restart = "restart",
}

/** No parameters */
export type NullParameters = null;

export type ReceiveHostParameters = {
  host: string;
};
export type ReceiveKickParameters = {
  name: string;
};
export type ReceiveAnsParameters = {
  correct: boolean;
  powerOrNeg: boolean;
};
export type ReceiveChatParameters = {
  message: string;
};
export type ReceiveTeamsParameters = {
  users: {
    name: string;
    team: string;
  }[];
};
export type ReceivePointsParameters = {
  name: string;
  points: number;
};

export type SendBuzzParameters = {
  buzzer: string;
};
export type SendChatParameters = {
  name: string;
  message: string;
};
export type SendHostParameters = ReceiveHostParameters;
export type SendBuzzerParameters = {
  buzzer: string | null;
};
export type SendOnlineParameters = {
  users: {
    user: string;
    points: number;
  }[];
  teams: {
    team: string;
    points: number;
    users: {
      user: string;
      points: number
    }[];
  }[];
};
export type SendTeamParameters = {
  team: string;
};

/** A command */
export type Command<K, T extends string> = {
  /** The type of command */
  command: T;
  /** The parameters included with the command */
  parameters: K;
  /** The time, in milliseconds, the command was sent */
  sent: number;

  user: {
    name: string;
    realName: string;
    team: string;
    host: boolean;
  };
};

// we all love mapped types
export type RecieveCommandsMap = {
  ans: ReceiveAnsParameters;
  buzz: NullParameters;
  chat: ReceiveChatParameters;
  clear: NullParameters;
  host: ReceiveHostParameters;
  kick: ReceiveKickParameters;
  name: NullParameters;
  reset: NullParameters;
  teams: ReceiveTeamsParameters;
  points: ReceivePointsParameters;
  restart: NullParameters;
};

export type ReceiveCommandsKey = keyof typeof ReceiveCommands;
export type ReceiveCommandParameters<
  T extends ReceiveCommandsKey
> = RecieveCommandsMap[T];
export type ReceiveCommand<T extends ReceiveCommandsKey> = Command<
  ReceiveCommandParameters<T>,
  T
>;

export type SendCommandsMap = {
  buzz: SendBuzzParameters;
  buzzer: SendBuzzerParameters;
  chat: SendChatParameters;
  clear: NullParameters;
  host: SendHostParameters;
  name: NullParameters;
  online: SendOnlineParameters;
  success: NullParameters;
  team: SendTeamParameters;
};

export type SendCommandsKey = keyof typeof SendCommands;
export type SendCommandParameters<
  T extends SendCommandsKey
> = SendCommandsMap[T];
export type SendCommand<T extends SendCommandsKey> = Command<
  SendCommandParameters<T>,
  T
>;

export type CommandHandlerParameter<T extends ReceiveCommandsKey> = {
  cmd: ReceiveCommand<T>;
  conn: connection;
  client: Client;
};
