"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = __importDefault(require("./client"));
var server_1 = __importDefault(require("./server"));
var types_1 = require("./types");
/**
 * A websocket based buzzer server
 */
var BuzzerServer = /** @class */ (function (_super) {
    __extends(BuzzerServer, _super);
    /** Creates the server */
    function BuzzerServer() {
        var _this = _super.call(this) || this;
        _this.activeBuzzer = null;
        _this.buzzTime = null;
        _this.clients = [];
        return _this;
    }
    /**
     * Runs when a request to connect is made. Handles the request and registers the client
     * @param _request the request object
     */
    BuzzerServer.prototype.onRequest = function (_request, conn) {
        this.sendMessage("name", null, conn);
    };
    /**
     * Fires when a connection is closed
     * @code the close code
     * @desc a description
     */
    BuzzerServer.prototype.onClose = function (code, desc) {
        this.log("CLOSE", code, desc);
        this.clients = this.clients.filter(function (e) { var _a; return (_a = e.conn) === null || _a === void 0 ? void 0 : _a.connected; });
        this.updateOnline();
    };
    /**
     *
     * Fetches the host
     * @returns the first client with an `isHost` property of `true`
     */
    BuzzerServer.prototype.getHost = function () {
        return this.clients.find(function (e) { return e.isHost; });
    };
    /**
     * Called when a message is received
     * @param message the message object
     * @param conn the connection it came from
     */
    BuzzerServer.prototype.onMessage = function (message, conn) {
        this.log("RECEIVE", message.utf8Data);
        var client = this.getClientWithConnection(conn);
        var msg = message.utf8Data;
        if (!msg) {
            this.error("No message received");
            return;
        }
        if (!client) {
            this.error("Message came from an unknown client");
            return;
        }
        var data = JSON.parse(msg);
        var command = data.command;
        var actions = {
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
        if (command in types_1.ReceiveCommands) {
            // I really shouldn't have to cast here...oh well
            var handler = actions[command];
            handler.call(this, { cmd: data, conn: conn, client: client });
        }
        else {
            this.error(new Error("UNKNOWN MESSAGE TYPE: " + msg));
        }
    };
    BuzzerServer.prototype.onRestartCommand = function (_a) {
        var _this = this;
        var _b, _c;
        _a = {};
        (_b = this.wsServer) === null || _b === void 0 ? void 0 : _b.closeAllConnections();
        (_c = this.server) === null || _c === void 0 ? void 0 : _c.close(function () {
            _this.startUp();
        });
    };
    /**
     * Called when a teams command is received
     */
    BuzzerServer.prototype.onTeamsCommand = function (_a) {
        var cmd = _a.cmd;
        for (var _i = 0, _b = cmd.parameters.users; _i < _b.length; _i++) {
            var user = _b[_i];
            var client = this.getClientWithName(user.name);
            if (!client)
                continue;
            client.team = user.team;
            this.sendMessage("team", {
                team: user.team
            }, client.conn);
        }
    };
    /**
     * Called when a buzz is cleared
     * @param conn the connection the clear came from
     */
    BuzzerServer.prototype.onClear = function (_a) {
        var conn = _a.conn;
        this.broadcast("clear", null, conn);
        this.activeBuzzer = null;
        this.buzzTime = Number.MAX_VALUE;
    };
    /**
     * Called when a chat message is sent
     * @param cmd the command the message is contained in
     * @param conn the connection it came from
     */
    BuzzerServer.prototype.onChat = function (_a) {
        var _b, _c;
        var cmd = _a.cmd, conn = _a.conn;
        var message = cmd.parameters.message;
        var name = (_c = (_b = this.getClientWithConnection(conn)) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "Unknown";
        this.broadcast("chat", {
            name: name,
            message: message,
        }, conn);
    };
    /**
     * Called when the scoreboard is reset
     */
    BuzzerServer.prototype.onReset = function (_a) {
        client_1.default.resetPoints();
        this.updateOnline();
    };
    /**
     * Called when a buzz is received
     * @param cmd the command containing the buzz
     * @param conn the connection it came from
     */
    BuzzerServer.prototype.onBuzz = function (_a) {
        var _b;
        var cmd = _a.cmd, conn = _a.conn;
        // If command sent before current buzz or if no current buzz
        if (cmd.sent < ((_b = this.buzzTime) !== null && _b !== void 0 ? _b : Number.MAX_VALUE)) {
            this.activeBuzzer = cmd.user.name;
            this.buzzTime = cmd.sent;
            this.broadcast("buzz", {
                buzzer: this.activeBuzzer
            }, conn);
        }
    };
    /**
     * Called when a user is kicked
     * @param cmd the command the kick is contained in
     */
    BuzzerServer.prototype.onKick = function (_a) {
        var _b, _c;
        var cmd = _a.cmd;
        var target = (_b = this.getClientWithName(cmd.parameters.name)) === null || _b === void 0 ? void 0 : _b.conn;
        // Close the connection
        target === null || target === void 0 ? void 0 : target.close(4000, "You have been kicked by the host, " + ((_c = this.getHost()) === null || _c === void 0 ? void 0 : _c.name));
        // Update the online list
        this.updateOnline();
    };
    /**
     * Called when a user is made host
     * @param cmd the command
     * @param conn the connection it came from
     */
    BuzzerServer.prototype.onHost = function (_a) {
        var cmd = _a.cmd, conn = _a.conn;
        if (this.getHost()) {
            this.getHost().isHost = false;
        }
        var newHost = this.getClientWithName(cmd.parameters.host);
        if (newHost) {
            newHost.isHost = true;
        }
        // Update everyone
        this.broadcast("host", {
            host: cmd.parameters.host,
        }, conn);
    };
    /**
     * Called when a user gives the handshake
     * @param cmd the command containing the info
     * @param connection the connection it came from
     * @param client the corresponding client
     */
    BuzzerServer.prototype.onNameCommand = function (_a) {
        var _b;
        var cmd = _a.cmd, conn = _a.conn, client = _a.client;
        var _c = cmd.user, name = _c.name, realName = _c.realName, shouldBeHost = _c.host, team = _c.team;
        // If name in use, send an error and close
        if (this.clients.some(function (e) { return e.name === name; })) {
            (_b = client.conn) === null || _b === void 0 ? void 0 : _b.close(4001, "Someone else is using the name " + name + ". Please try a different name and reconnect");
            return;
        }
        client.name = name;
        client.realName = realName;
        client.team = team;
        if (shouldBeHost) {
            this.clients.forEach(function (e) { return (e.isHost = false); });
            client.isHost = true;
            this.broadcast("host", {
                host: name,
            }, conn);
        }
        this.sendMessage("success", null, conn);
        // Tell them who the host and buzzer are
        if (this.getHost()) {
            this.sendMessage("host", {
                host: this.getHost().name,
            }, conn);
        }
        this.sendMessage("buzzer", {
            buzzer: this.activeBuzzer,
        }, conn);
        this.updateOnline();
    };
    /**
     * Called when the scoreboard should be updated
     * @param cmd the command containing the info
     */
    BuzzerServer.prototype.onAnsCommand = function (_a) {
        var cmd = _a.cmd;
        if (!this.activeBuzzer || !this.getClientWithName(this.activeBuzzer))
            return;
        var _b = cmd.parameters, correct = _b.correct, powerOrNeg = _b.powerOrNeg;
        var basePoints = correct ? 10 : 0;
        basePoints += powerOrNeg ? (correct ? 5 : -5) : 0;
        var client = this.getClientWithName(this.activeBuzzer);
        if (client)
            client.points += basePoints;
        this.updateOnline();
    };
    BuzzerServer.prototype.onPointsCommand = function (_a) {
        var cmd = _a.cmd;
        var client = this.getClientWithName(cmd.parameters.name);
        if (client) {
            client.points = cmd.parameters.points;
            this.updateOnline();
        }
    };
    /**
     * Updates the online list and sends it out
     */
    BuzzerServer.prototype.updateOnline = function () {
        var list = this.clients.map(function (e) {
            return {
                name: e.name,
                points: e.points,
            };
        });
        this.broadcast("online", {
            online: list,
        });
    };
    return BuzzerServer;
}(server_1.default));
exports.default = BuzzerServer;
var s = new BuzzerServer();
s.startUp();
