"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiveCommands = exports.SendCommands = void 0;
var SendCommands;
(function (SendCommands) {
    SendCommands["buzzer"] = "buzzer";
    SendCommands["chat"] = "chat";
    SendCommands["name"] = "name";
    SendCommands["clear"] = "clear";
    SendCommands["success"] = "success";
    SendCommands["host"] = "host";
    SendCommands["buzz"] = "buzz";
    SendCommands["online"] = "online";
    SendCommands["team"] = "team";
})(SendCommands = exports.SendCommands || (exports.SendCommands = {}));
var ReceiveCommands;
(function (ReceiveCommands) {
    ReceiveCommands["reset"] = "reset";
    ReceiveCommands["clear"] = "clear";
    ReceiveCommands["kick"] = "kick";
    ReceiveCommands["name"] = "name";
    ReceiveCommands["host"] = "host";
    ReceiveCommands["ans"] = "ans";
    ReceiveCommands["buzz"] = "buzz";
    ReceiveCommands["chat"] = "chat";
    ReceiveCommands["teams"] = "teams";
    ReceiveCommands["points"] = "points";
    ReceiveCommands["restart"] = "restart";
})(ReceiveCommands = exports.ReceiveCommands || (exports.ReceiveCommands = {}));
