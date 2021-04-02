"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var websocket_1 = require("websocket");
var http_1 = require("http");
var client_1 = __importDefault(require("./client"));
var WSServer = /** @class */ (function () {
    function WSServer() {
        this.clients = [];
    }
    WSServer.prototype.startUp = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.server = http_1.createServer(function (request, response) {
                _this.log("RECEIVED REQUEST", "FOR", request.url);
                response.writeHead(404);
                response.end();
            });
            _this.server.listen(process.env.PORT || 80, function () {
                _this.log("LISTEN", "on port " + (process.env.PORT || 80));
                resolve();
            });
            _this.wsServer = new websocket_1.server({
                httpServer: _this.server,
                autoAcceptConnections: false,
            });
            _this.wsServer.on("request", function (req) { return _this._onRequest(req); });
        });
    };
    /**
     * Broadcasts a message to multiple clients
     * @param type the type of command to send
     * @param parameters the parameters to send with the command
     * @param excluding a connection not to send the command to
     */
    WSServer.prototype.broadcast = function (type, parameters, excluding) {
        var _this = this;
        var _a;
        if (excluding === void 0) { excluding = null; }
        var ret = [];
        (_a = this.wsServer) === null || _a === void 0 ? void 0 : _a.connections.filter(function (e) { return excluding === null || e !== excluding; }).forEach(function (e) {
            ret.push(_this.sendMessage(type, parameters, e));
        });
        return ret;
    };
    /**
     * Sends a message to a single client
     * @param type the type of command to send
     * @param parameters the parameters to send with the command
     * @param to the connection to send the command to
     */
    WSServer.prototype.sendMessage = function (type, parameters, to) {
        var cmd = {
            command: type,
            parameters: parameters,
            sent: new Date().getTime(),
            user: {
                name: "server",
                realName: "server",
                team: "",
                host: false
            }
        };
        var encoded = JSON.stringify(cmd);
        this.log("SEND", "type:", type, ", parameters:", JSON.stringify(parameters), ", full: ", encoded);
        to.send(encoded);
        return cmd;
    };
    /**
     * Determines whether an origin should be allowed to connect
     * @param origin
     */
    WSServer.prototype.originAllowed = function (origin) {
        return !!(origin === null || origin === void 0 ? void 0 : origin.match(/(https?:\/\/)?(hsscholarbowl\.github\.io|localhost)(:\d+)?\/?/));
    };
    /**
    * Gets the client with a specific connection
    * @param conn the connection of the client
    * @returns the client
    */
    WSServer.prototype.getClientWithConnection = function (conn) {
        return this.findClient(function (e) { return e.conn === conn; });
    };
    /**
     * Finds a client by using a callback
     * @param filter The filter to run on each client.
     * @returns the first client for which the callback returned `true`
     */
    WSServer.prototype.findClient = function (filter) {
        return this.clients.find(filter);
    };
    /**
     * Gets a client by name
     * @param name the name of the client
     * @returns the first (and only) client with the given name
     */
    WSServer.prototype.getClientWithName = function (name) {
        return this.findClient(function (e) { return e.name === name; });
    };
    /**
     * Throws an error
     * @param err
     */
    WSServer.prototype.error = function (err) {
        console.error("[SERVER]", err);
    };
    /**
     * Logs messages
     * @param type the type of message being logged
     * @param messages the messages to log
     */
    WSServer.prototype.log = function (type) {
        var messages = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            messages[_i - 1] = arguments[_i];
        }
        console.log.apply(console, __spreadArrays(["[SERVER]", type], messages));
    };
    WSServer.prototype._onRequest = function (req) {
        var _this = this;
        if (req.origin && !this.originAllowed(req.origin)) {
            req.reject(401, "Bad origin");
            this.log("REJECT ORIGIN", req.origin);
            return;
        }
        this.log("ACCEPT ORIGIN", req.origin);
        var connection = req.accept("echo-protocol", req.origin);
        this.log("ACCEPT CONNECTION");
        connection.on("message", function (data) {
            return _this.onMessage(data, connection);
        });
        connection.on("close", function (code, desc) {
            _this.onClose(code, desc);
        });
        var client = new client_1.default();
        client.conn = connection;
        this.clients.push(client);
        this.onRequest(req, connection);
    };
    /** Should be overriden by subclasses */
    WSServer.prototype.onRequest = function (req, conn) { };
    /** Should be overriden by subclasses */
    WSServer.prototype.onClose = function (code, desc) { };
    /** Should be overriden by subclasses */
    WSServer.prototype.onMessage = function (message, conn) { };
    return WSServer;
}());
exports.default = WSServer;
