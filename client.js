"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Client = /** @class */ (function () {
    function Client() {
        this.conn = null;
        this.isHost = false;
        this.name = '';
        this.realName = '';
        this.team = '';
        this.sentMessageTimes = [];
    }
    Client.prototype.sendMessage = function (message) {
        var _a;
        (_a = this.conn) === null || _a === void 0 ? void 0 : _a.send(message);
    };
    Object.defineProperty(Client.prototype, "points", {
        get: function () {
            var _a;
            return (_a = Client.points[this.realName]) !== null && _a !== void 0 ? _a : 0;
        },
        set: function (value) {
            Client.points[this.realName] = value;
        },
        enumerable: false,
        configurable: true
    });
    Client.resetPoints = function () {
        for (var _i = 0, _a = Object.keys(Client.points); _i < _a.length; _i++) {
            var key = _a[_i];
            Client.points[key] = 0;
        }
    };
    Client.prototype.addMessageLog = function (msg) {
        this.sentMessageTimes.push(msg.sent);
        while (this.sentMessageTimes.length > 10) {
            this.sentMessageTimes.shift();
        }
    };
    Object.defineProperty(Client.prototype, "overRateLimit", {
        get: function () {
            return this.sentMessageTimes.length >= 10 && (this.sentMessageTimes[0] + 5000) > this.sentMessageTimes[9];
        },
        enumerable: false,
        configurable: true
    });
    Client.points = {};
    return Client;
}());
exports.default = Client;
