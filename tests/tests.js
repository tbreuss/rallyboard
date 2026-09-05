QUnit.module("update()", hooks => {
    hooks.beforeEach(() => reset());

    QUnit.test("increments the correct player's points", assert => {
        update("p1", 1);
        assert.strictEqual(p1.points, 1, "p1 gained a point");
        assert.strictEqual(p2.points, 0, "p2 untouched");

        update("p2", 1);
        assert.strictEqual(p2.points, 1, "p2 gained a point");
    });

    QUnit.test("never drops points below 0", assert => {
        update("p1", -1);
        assert.strictEqual(p1.points, 0, "stays at 0, does not go negative");
    });

    QUnit.test("reflects the new score in the DOM", assert => {
        update("p1", 1);
        assert.strictEqual(document.getElementById("points-p1").innerText, "1");
    });

    QUnit.test("is ignored once the match is over", assert => {
        matchOver = true;
        update("p1", 1);
        assert.strictEqual(p1.points, 0, "point is not counted while matchOver is true");
    });
});

QUnit.module("checkSet() / newSet()", hooks => {
    hooks.beforeEach(() => reset());

    QUnit.test("wins a set at 11:0 and resets points", assert => {
        for (let i = 0; i < 11; i++) update("p1", 1);
        assert.strictEqual(p1.sets, 1, "p1 won the set");
        assert.strictEqual(p1.points, 0, "points reset after the set");
        assert.strictEqual(p2.points, 0, "points reset after the set");
    });

    QUnit.test("requires a 2-point lead at 10:10 (deuce)", assert => {
        for (let i = 0; i < 10; i++) update("p1", 1);
        for (let i = 0; i < 10; i++) update("p2", 1);
        update("p1", 1); // 11:10 – not enough lead yet
        assert.strictEqual(p1.sets, 0, "no set won at 11:10");
        assert.strictEqual(p1.points, 11, "points keep counting past 11 in deuce");

        update("p1", 1); // 12:10 – 2-point lead
        assert.strictEqual(p1.sets, 1, "set won at 12:10");
    });

    QUnit.test("swaps sides after a non-deciding set", assert => {
        const before = direction;
        for (let i = 0; i < 11; i++) update("p1", 1);
        assert.notStrictEqual(direction, before, "direction flipped");
    });

    QUnit.test("ends the match and shows the overlay after 3 sets", assert => {
        for (let s = 0; s < 3; s++) {
            for (let i = 0; i < 11; i++) update("p1", 1);
        }
        assert.true(matchOver, "matchOver is true");
        assert.true(document.getElementById("overlay").classList.contains("active"), "overlay shown");
        assert.true(document.getElementById("btn-reset").disabled, "Reset disabled");
        assert.true(document.getElementById("btn-switch").disabled, "Tauschen disabled");
    });
});

QUnit.module("calculateServer()", hooks => {
    hooks.beforeEach(() => reset());

    QUnit.test("switches server every 2 points before 10:10", assert => {
        assert.strictEqual(server, "p1", "p1 serves first");
        update("p1", 1); // 1:0
        assert.strictEqual(server, "p1", "still p1 after 1 point");
        update("p1", 1); // 2:0
        assert.strictEqual(server, "p2", "p2 serves after 2 points");
    });

    QUnit.test("switches server every single point once both reach 10", assert => {
        for (let i = 0; i < 10; i++) update("p1", 1);
        for (let i = 0; i < 9; i++) update("p2", 1); // 10:9, still p1's rules? both must be >=10
        update("p2", 1); // 10:10
        const serverAt10_10 = server;
        update("p1", 1); // 11:10
        assert.notStrictEqual(server, serverAt10_10, "server alternates every point in deuce");
    });
});

QUnit.module("swapSides()", hooks => {
    hooks.beforeEach(() => reset());

    QUnit.test("toggles direction and the field's flex-direction", assert => {
        assert.strictEqual(direction, "normal");
        swapSides();
        assert.strictEqual(direction, "reversed");
        assert.strictEqual(document.getElementById("field").style.flexDirection, "row-reverse");

        swapSides();
        assert.strictEqual(direction, "normal");
        assert.strictEqual(document.getElementById("field").style.flexDirection, "row");
    });
});

QUnit.module("reset()", hooks => {
    hooks.beforeEach(() => reset());

    QUnit.test("restores initial state after a finished match", assert => {
        for (let s = 0; s < 3; s++) {
            for (let i = 0; i < 11; i++) update("p1", 1);
        }
        reset();

        assert.strictEqual(p1.points, 0);
        assert.strictEqual(p1.sets, 0);
        assert.strictEqual(p2.points, 0);
        assert.strictEqual(p2.sets, 0);
        assert.strictEqual(direction, "normal");
        assert.false(matchOver, "matchOver reset to false");
        assert.false(document.getElementById("overlay").classList.contains("active"), "overlay hidden");
        assert.false(document.getElementById("btn-reset").disabled, "Reset re-enabled");
        assert.false(document.getElementById("btn-switch").disabled, "Tauschen re-enabled");
    });
});
