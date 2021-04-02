"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Client = /** @class */ (function () {
    function Client() {
        this.conn = null;
        this.isHost = false;
        this.name = '';
        this.realName = '';
        this.team = '';
    }
    Client.prototype.sendMessage = function (message) {
        var _a;
        (_a = this.conn) === null || _a === void 0 ? void 0 : _a.send(message);
    };
    Object.defineProperty(Client.prototype, "points", {
        get: function () {
            var _a, _b;
            if (this.team) {
                return (_a = Client.points["team_" + this.team]) !== null && _a !== void 0 ? _a : 0;
            }
            return (_b = Client.points[this.realName]) !== null && _b !== void 0 ? _b : 0;
        },
        set: function (value) {
            if (this.team) {
                Client.points["team_" + this.team] = value;
            }
            else {
                Client.points[this.realName] = value;
            }
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
    Client.points = {};
    return Client;
}());
exports.default = Client;
