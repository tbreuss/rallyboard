QUnit.module("update()", hooks => {
    hooks.beforeEach(() => {
        // Force known defaults regardless of settings persisted in
        // localStorage from manually testing index.html (same origin).
        pointsToWin = 11;
        setsToWin = 3;
        reset();
    });

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
    hooks.beforeEach(() => {
        // Force known defaults regardless of settings persisted in
        // localStorage from manually testing index.html (same origin).
        pointsToWin = 11;
        setsToWin = 3;
        reset();
    });

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
    hooks.beforeEach(() => {
        // Force known defaults regardless of settings persisted in
        // localStorage from manually testing index.html (same origin).
        pointsToWin = 11;
        setsToWin = 3;
        reset();
    });

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

    QUnit.test("switches server every 5 points under the 21-point rule", assert => {
        pointsToWin = 21;
        reset();
        assert.strictEqual(server, "p1", "p1 serves first");
        for (let i = 0; i < 4; i++) update("p1", 1); // 4:0
        assert.strictEqual(server, "p1", "still p1 after 4 points");
        update("p1", 1); // 5:0
        assert.strictEqual(server, "p2", "p2 serves after 5 points");
    });

    QUnit.test("switches server every single point once both reach 20 under the 21-point rule", assert => {
        pointsToWin = 21;
        reset();
        for (let i = 0; i < 20; i++) update("p1", 1);
        for (let i = 0; i < 19; i++) update("p2", 1); // 20:19
        update("p2", 1); // 20:20
        const serverAt20_20 = server;
        update("p1", 1); // 21:20
        assert.notStrictEqual(server, serverAt20_20, "server alternates every point in deuce");
    });
});

QUnit.module("swapSides()", hooks => {
    hooks.beforeEach(() => {
        // Force known defaults regardless of settings persisted in
        // localStorage from manually testing index.html (same origin).
        pointsToWin = 11;
        setsToWin = 3;
        reset();
    });

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
    hooks.beforeEach(() => {
        // Force known defaults regardless of settings persisted in
        // localStorage from manually testing index.html (same origin).
        pointsToWin = 11;
        setsToWin = 3;
        reset();
    });

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

QUnit.module("settings persistence", hooks => {
    // tests/index.html shares its origin (and thus localStorage) with the
    // real app, so back up whatever was already stored there and restore it
    // afterward instead of just deleting it.
    let originalStoredSettings;

    hooks.beforeEach(() => {
        originalStoredSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
        pointsToWin = 11;
        setsToWin = 3;
        reset();
    });

    hooks.afterEach(() => {
        if (originalStoredSettings === null) {
            localStorage.removeItem(SETTINGS_STORAGE_KEY);
        } else {
            localStorage.setItem(SETTINGS_STORAGE_KEY, originalStoredSettings);
        }
    });

    QUnit.test("saveSettings() writes the current settings to localStorage", assert => {
        pointsToWin = 21;
        setsToWin = 4;
        saveSettings();
        const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
        assert.strictEqual(stored.pointsToWin, 21);
        assert.strictEqual(stored.setsToWin, 4);
    });

    QUnit.test("loadSettings() applies previously saved settings", assert => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ pointsToWin: 21, setsToWin: 2 }));
        loadSettings();
        assert.strictEqual(pointsToWin, 21);
        assert.strictEqual(setsToWin, 2);
    });

    QUnit.test("loadSettings() is a no-op when nothing is stored", assert => {
        loadSettings();
        assert.strictEqual(pointsToWin, 11);
        assert.strictEqual(setsToWin, 3);
    });
});

QUnit.module("updateConfigButtons()", hooks => {
    hooks.beforeEach(() => {
        pointsToWin = 11;
        setsToWin = 3;
        reset();
        updateConfigButtons();
    });

    QUnit.test("marks the buttons matching the current settings as selected", assert => {
        pointsToWin = 21;
        setsToWin = 2;
        updateConfigButtons();
        assert.true(document.querySelector('[data-points="21"]').classList.contains('selected'));
        assert.false(document.querySelector('[data-points="11"]').classList.contains('selected'));
        assert.true(document.querySelector('[data-sets="2"]').classList.contains('selected'));
        assert.false(document.querySelector('[data-sets="3"]').classList.contains('selected'));
    });
});

QUnit.module("menu dropdown", hooks => {
    hooks.beforeEach(() => {
        document.getElementById("menu-dropdown").classList.remove("active");
    });

    QUnit.test("btn-menu toggles the dropdown open and closed", assert => {
        document.getElementById("btn-menu").click();
        assert.true(document.getElementById("menu-dropdown").classList.contains("active"), "opens on first click");
        document.getElementById("btn-menu").click();
        assert.false(document.getElementById("menu-dropdown").classList.contains("active"), "closes on second click");
    });

    QUnit.test("clicking outside the menu closes the dropdown", assert => {
        document.getElementById("btn-menu").click();
        assert.true(document.getElementById("menu-dropdown").classList.contains("active"));
        document.body.click();
        assert.false(document.getElementById("menu-dropdown").classList.contains("active"));
    });

    QUnit.test("selecting an action closes the dropdown", assert => {
        document.getElementById("btn-menu").click();
        document.getElementById("btn-reset").click();
        assert.false(document.getElementById("menu-dropdown").classList.contains("active"));
    });
});
