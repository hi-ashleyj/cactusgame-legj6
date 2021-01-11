Game.create({ width: 1920, height: 1080 }); // Initialize the game

new Asset.Font("Press Start", "ttf/pressstart.ttf"); // Preload Assets 

let gameScale = 192; // Setup global stuff
let state = "loading";
let loading = true;

let backgroundLayer = new Layer("background", { level: 0 }); // Prepare Layers
let mapLayer = new Layer("map", { level: 1 });
let detailsLayer = new Layer("details", { level: 2 });
let hudLayer = new Layer("hud", { level: 3 });

// ---- LOADING SCREEN ---- //

let loadingAnimateProperty;
let loadingSpinner = new Asset.Primitive({ type: "arc", fill: "#ffffff", angleFrom: 0, angleTo: 180 });

let loadingScreen = function() {
    Layer.purgeAll();
    backgroundLayer.assign((new GameObject({ asset: new Asset.Primitive({ type: "rectangle", fill: "#222222" }), x: 0, y: 0, w: Game.width, h: Game.height })));
    hudLayer.assign(new GameObject({ asset: loadingSpinner, x: Game.width / 2, y: Game.height / 2, w: 200, h: 200 }));

    loadingAnimateProperty = new Animate.property(1000, {0: 0, 1: 360}, Infinity);
};

// ---- START SCREEN ---- //

let loadStartScreen = function() {
    Layer.purgeAll();
    let startBDG = new GameObject({ asset: (new Asset({ image: "png/start.png" })), x: 0, y: 0, w: Game.width, h: Game.height });
    let startHeader = new GameObject({ asset: (new Text({ text: "CACTUS", font: "Press Start", size: 100, alignH: "center", alignV: "middle", fill: "#ffffff" })), x: Game.width / 2, y: Game.height / 4 });
    let startCTA = new GameObject({ asset: (new Text({ text: "PRESS START TO BEGIN", font: "Press Start", size: 40, alignH: "center", alignV: "middle", fill: "#ffffff" })), x: Game.width / 2, y: Game.height * 4 / 5 });

    backgroundLayer.assign(startBDG);
    hudLayer.assign(startHeader, startCTA);
    state = "start";
};

// ---- GAME SCREEN ---- //

let currentMap;
let gravity = 2; // Setup game globals
let acceleration = 4;
let friction = 4;
let maxSpeed = 1.8;
let speed = gameScale * 2;
let moveX = 0;
let moveY = 0;
let doPhysics = true;
let touchingGround = false;

let levelBackground = new GameObject({ asset: (new Asset({ image: "png/bg.png"})), x: 0, y: 0, w: Game.width, h: Game.height}); // Setup resources
let mapAliveBush = new TileMap({ image: "png/decoration/alivebush.png", scaleX: 32, scaleY: 32, size: 2});
let mapBones = new TileMap({ image: "png/decoration/bones.png", scaleX: 32, scaleY: 32, size: 2});
let mapBigtree = new TileMap({ image: "png/decoration/bigtree.png", scaleX: 32, scaleY: 32, size: 6});

let cactusAnimation = new Animate.Sequence({ 
    idle: {
        duration: 1000,
        sequence: (new TileMap({ image: "png/character/cactus-idle-tile.png", scaleX: 32, scaleY: 32, size: 2})).map
    },
    run: {
        duration: 1000,
        sequence: (new TileMap({ image: "png/character/cactus-run-tile.png", scaleX: 32, scaleY: 32, size: 5})).map
    }
}, "idle");
let cactusBro = new GameObject({ asset: cactusAnimation });

cactusBro.position(...Asset.center(Game.width / 2, Game.height / 2, gameScale, gameScale));

let levels = [ // Level Design
    {
        assets: {
            "O": (new Asset({ image: "png/world/fill.png" })),
            "T": (new Asset({ image: "png/world/top.png" })),
            "A": (new Asset({ image: "png/world/left.png" })),
            "B": (new Asset({ image: "png/world/right.png" })),
            "I": (new Asset({ image: "png/world/insidel.png" })),
            "J": (new Asset({ image: "png/world/insider.png" })),
            "K": (new Asset({ image: "png/world/insetl.png" })),
            "L": (new Asset({ image: "png/world/insetr.png" })),
        
            "y": (new Asset({ image: "png/decoration/grassy.png" })),
            "b": (new Asset({ image: "png/decoration/grassb.png" })),
            "z": (new Asset({ image: "png/decoration/rock.png" })),
            "f": mapAliveBush.map[0],
            "g": mapAliveBush.map[1],
            "d": (new Asset({ image: "png/decoration/deadbush.png" })),
            "w": mapBones.map[0],
            "x": mapBones.map[1],
            "m": mapBigtree.map[0],
            "n": mapBigtree.map[1],
            "o": mapBigtree.map[2],
            "p": mapBigtree.map[3],
            "q": mapBigtree.map[4],
            "r": mapBigtree.map[5],
        },
        map: [
            "OOOOB-------------------------AOOOOO",
            "OOOOB-------------------------AOOOOO",
            "OOOOB-------------------------AOOOOO",
            "OOOOB-----------mno-----------AOOOOO",
            "OOOOB-y---b-d-z-pqr-fg--wx----AOOOOO",
            "OOOOKITTTTTTTTTTTTTTTTTTTTTTTJLOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
        ],
        start: {
            x: gameScale * 6, 
            y: gameScale * 4, 
            size: gameScale
        }
    }
]

let levelMaps = [];

for (let i = 0; i < levels.length; i++) {
    levelMaps.push(new LevelMap(levels[i].assets, levels[i].map, levels[i].start)); // Pre create all the LevelMap's
}

let loadLevel = function(number) {
    Layer.purgeAll();
    currentMap = levelMaps[number];
    currentMap.position(levels[number].start.x, levels[number].start.y);
    moveX = 0;
    moveY = 0;
    backgroundLayer.assign(levelBackground);
    mapLayer.assign(currentMap);
    detailsLayer.assign(cactusBro);
    state = "game";
    cactusAnimation.switch("idle");
};

// Movement/Physics/Collision Setup
collisionPoints = {
    xn: -(gameScale / 2),
    xp: (gameScale / 2),
    yn: -(gameScale / 2),
    yp: (gameScale / 2),
}

let movementGameLoop = function(delta) {
    if (delta > 50) { return; }
    let forceX = 0;
    let sprint = 1;
    if (Controller.isPressed("key_a")) { forceX -= 1 }
    if (Controller.isPressed("key_d")) { forceX += 1 }
    if (forceX == 0 && Math.abs(moveX) > 0.001) { 
        if (moveX > friction * (delta / 1000) ) { moveX -= friction * (delta / 1000); }
        else if (moveX < friction * (delta / 1000) * -1 ) { moveX += friction * (delta / 1000); }
        else { moveX = 0 }
    }
    // if (Controller.isPressed("key_shift")) { sprint = 2 }

    moveX = Math.max(-maxSpeed, Math.min(maxSpeed, moveX + (forceX * acceleration * (delta / 1000))));
    if (Math.abs(moveX) < 0.001) { moveX = 0}
    moveY = Math.max(-maxSpeed, Math.min(maxSpeed, moveY + (gravity * (delta / 1000))));

    currentMap.move(moveX * speed * sprint * (delta / 1000), moveY * speed * (delta / 1000));

    if (Math.abs(moveX) > 0.05) { 
        cactusAnimation.use("run");
    } else {
        cactusAnimation.use("idle");
    }

    let left = currentMap.x + collisionPoints.xn;
    let right = currentMap.x + collisionPoints.xp;
    let top = currentMap.y + collisionPoints.yn;
    let bottom = currentMap.y + collisionPoints.yp;

    let tileLeft = Math.floor(left / currentMap.size);
    let tileRight = Math.floor(right / currentMap.size);
    let tileTop = Math.floor(top / currentMap.size);
    let tileBottom = Math.floor(bottom / currentMap.size);

    let collision = { l: false, r: false, t: false, b: false }

    if (currentMap.map[tileBottom][tileLeft].toLowerCase() !== currentMap.map[tileBottom][tileLeft]) {
        if (moveY > 0 && currentMap.map[tileBottom - 1][tileLeft].toLowerCase() == currentMap.map[tileBottom - 1][tileLeft]) {
            collision.b = true;
        } else if (moveX < 0 && currentMap.map[tileBottom][tileLeft + 1].toLowerCase() == currentMap.map[tileBottom][tileLeft + 1]) {
            collision.l = true;
        }
    }
    if (currentMap.map[tileBottom][tileRight].toLowerCase() !== currentMap.map[tileBottom][tileRight]) {
        if (moveY > 0 && currentMap.map[tileBottom - 1][tileRight].toLowerCase() == currentMap.map[tileBottom - 1][tileRight]) {
            collision.b = true;
        } else if (moveX > 0 && currentMap.map[tileBottom][tileRight - 1].toLowerCase() == currentMap.map[tileBottom][tileRight - 1]) {
            collision.r = true;
        }
    }

    if (currentMap.map[tileTop][tileLeft].toLowerCase() !== currentMap.map[tileTop][tileLeft]) {
        if (moveY < 0 && currentMap.map[tileTop + 1][tileLeft].toLowerCase() == currentMap.map[tileTop + 1][tileLeft]) {
            collision.t = true;
        } else if (moveX < 0 && currentMap.map[tileTop][tileLeft + 1].toLowerCase() == currentMap.map[tileTop][tileLeft + 1]) {
            collision.l = true;
        }
    }
    if (currentMap.map[tileTop][tileRight].toLowerCase() !== currentMap.map[tileTop][tileRight]) {
        if (moveY < 0 && currentMap.map[tileTop + 1][tileRight].toLowerCase() == currentMap.map[tileTop + 1][tileRight]) {
            collision.t = true;
        } else if (moveX > 0 && currentMap.map[tileTop][tileRight - 1].toLowerCase() == currentMap.map[tileTop][tileRight - 1]) {
            collision.r = true;
        }
    }

    if (collision.b) {
        moveY = 0;
        currentMap.position(null, (tileBottom * currentMap.size) - (currentMap.size / 2));
    }

    if (collision.t) {
        moveY = 0;
        currentMap.position(null, ((tileTop + 1) * currentMap.size) + (currentMap.size / 2));
    }

    if (collision.l) {
        moveX = 0;
        currentMap.position(((tileLeft + 1) * currentMap.size) + (currentMap.size / 2), null);
    }

    if (collision.r) {
        moveX = 0;
        currentMap.position((tileRight * currentMap.size) - (currentMap.size / 2), null);
    }

    touchingGround = collision.b;
}

// --- GAME LOOP LOGIC --- //

Game.on("loop", ({ stamp, delta }) => {
    switch (state) {
        case ("loading"): {
            let value = loadingAnimateProperty.value();
            loadingSpinner.angleFrom = value;
            loadingSpinner.angleTo = value + 180;

            if (Asset.loading.length == 0 && loading) {
                loading = false;
                Game.wait(loadStartScreen, 1000);
            }
            break;
        }
        case ("start"): {
            
        }
        case ("game"): {
            if (doPhysics) {
                movementGameLoop(delta);
            }

            break;
        }
    }
});

Controller.on("press", "key_ ", () => {
    if (state == "game" && touchingGround) {
        moveY = -maxSpeed;
    } else if (state == "start") {
        Layer.purgeAll()
        Game.wait(loadLevel, 500);
        state = "";
    }
})

loadingScreen();

Game.start();