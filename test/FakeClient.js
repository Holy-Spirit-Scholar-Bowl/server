"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var websocket_1 = require("websocket");
var FakeClient = /** @class */ (function () {
    function FakeClient(onMessage, userData) {
        var _this = this;
        this.ws = new websocket_1.w3cwebsocket("ws://localhost:80", "echo-protocol");
        this.opened = false;
        this.onMessage = onMessage;
        this.ws.onmessage = function (ev) {
            _this.onMessage(ev);
        };
        this.userData = userData;
    }
    FakeClient.prototype.startUp = function (onOpen) {
        var _this = this;
        if (onOpen === void 0) { onOpen = function () { }; }
        return new Promise(function (resolve) {
            _this.ws.onopen = function () {
                onOpen();
                resolve();
            };
        });
    };
    FakeClient.prototype.onOpen = function () {
        this.opened = true;
    };
    FakeClient.prototype.waitForMessage = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var currentHandler = _this.onMessage;
            _this.onMessage = function (ev) {
                currentHandler(ev);
                _this.onMessage = currentHandler;
                resolve(ev);
            };
        });
    };
    FakeClient.prototype.onMessage = function (ev) {
    };
    FakeClient.prototype.send = function (message) {
        this.ws.send(message);
    };
    FakeClient.prototype.sendCommand = function (type, parameters) {
        var cmd = {
            command: type,
            parameters: parameters,
            sent: (new Date()).getTime(),
            user: this.userData
        };
        this.send(JSON.stringify(cmd));
        return cmd;
    };
    return FakeClient;
}());
exports.default = FakeClient;
