import Client from "../client";

describe("the Client class", () => {
  let dummy = new Client();
  dummy.name = "dummy";

  beforeEach(() => {
    dummy.realName = "";
    dummy.team = "";
    Client.resetPoints();
  });

  it("properly gets and sets points with real name", () => {
    dummy.realName = "test";
    dummy.points += 5;
    expect(dummy.points).toEqual(5);
  });

  it("does not remember points when real name is changed", () => {
    dummy.realName = "test1";
    dummy.points += 5;
    dummy.realName = "test2";
    dummy.points += 5;
    expect(dummy.points).toEqual(5);
  });

  it("syncs scores when 2+ clients have same real name", () => {
    dummy.realName = "test";

    let dummy2 = new Client();
    dummy2.name = "dummy2";
    dummy2.realName = "test";

    dummy.points += 5;
    expect(dummy.points).toEqual(5);
    expect(dummy2.points).toEqual(5);

    dummy2.points += 5;
    expect(dummy.points).toEqual(10);
    expect(dummy2.points).toEqual(10);
  });

  it("syncs scores when 2+ clients are on the same team, regardless on real name", () => {
    let dummy2 = new Client();
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

  it("does not sync scores for clients with the same real name if they are on different teams", () => {
    let dummy2 = new Client();
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

  it("resets real name and team scores properly", () => {
    dummy.realName = "test";
    expect(dummy.points).toEqual(0);

    dummy.points += 5;
    expect(dummy.points).toEqual(5);

    Client.resetPoints();
    expect(dummy.points).toEqual(0);

    dummy.team = "team1";
    expect(dummy.points).toEqual(0);

    dummy.points += 5;
    expect(dummy.points).toEqual(5);

    Client.resetPoints();
    expect(dummy.points).toEqual(0);
  });
})