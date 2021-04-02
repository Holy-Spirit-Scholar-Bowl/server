"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = __importDefault(require("../client"));
describe("the Client class", function () {
    var dummy = new client_1.default();
    dummy.name = "dummy";
    beforeEach(function () {
        dummy.realName = "";
        dummy.team = "";
        client_1.default.resetPoints();
    });
    it("properly gets and sets points with real name", function () {
        dummy.realName = "test";
        dummy.points += 5;
        expect(dummy.points).toEqual(5);
    });
    it("does not remember points when real name is changed", function () {
        dummy.realName = "test1";
        dummy.points += 5;
        dummy.realName = "test2";
        dummy.points += 5;
        expect(dummy.points).toEqual(5);
    });
    it("syncs scores when 2+ clients have same real name", function () {
        dummy.realName = "test";
        var dummy2 = new client_1.default();
        dummy2.name = "dummy2";
        dummy2.realName = "test";
        dummy.points += 5;
        expect(dummy.points).toEqual(5);
        expect(dummy2.points).toEqual(5);
        dummy2.points += 5;
        expect(dummy.points).toEqual(10);
        expect(dummy2.points).toEqual(10);
    });
    it("syncs scores when 2+ clients are on the same team, regardless on real name", function () {
        var dummy2 = new client_1.default();
        dummy2.name = "dummy2";
        dummy2.realName = "test";
        dummy.realName = "test";
        dummy.team = "team1";
        dummy2.team = "team1";
        dummy.points += 5;
        expect(dummy.points).toEqual(5);
        expect(dummy2.points).toEqual(5);
        dummy2.points += 5;
        expect(dummy.points).toEqual(10);
        expect(dummy2.points).toEqual(10);
        dummy2.realName = "test2";
        dummy.points += 5;
        expect(dummy.points).toEqual(15);
        expect(dummy2.points).toEqual(15);
        dummy2.points += 5;
        expect(dummy.points).toEqual(20);
        expect(dummy2.points).toEqual(20);
    });
    it("does not sync scores for clients with the same real name if they are on different teams", function () {
        var dummy2 = new client_1.default();
        dummy2.name = "dummy2";
        dummy2.realName = "test";
        dummy.realName = "test";
        dummy.team = "team1";
        dummy.points += 5;
        expect(dummy.points).toEqual(5);
        expect(dummy2.points).toEqual(0);
        dummy2.points += 10;
        expect(dummy.points).toEqual(5);
        expect(dummy2.points).toEqual(10);
    });
    it("resets real name and team scores properly", function () {
        dummy.realName = "test";
        expect(dummy.points).toEqual(0);
        dummy.points += 5;
        expect(dummy.points).toEqual(5);
        client_1.default.resetPoints();
        expect(dummy.points).toEqual(0);
        dummy.team = "team1";
        expect(dummy.points).toEqual(0);
        dummy.points += 5;
        expect(dummy.points).toEqual(5);
        client_1.default.resetPoints();
        expect(dummy.points).toEqual(0);
    });
});
