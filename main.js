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
    let startCTA = new GameObject({ asset: (new Text({ text: "PRESS SPACE TO BEGIN", font: "Press Start", size: 40, alignH: "center", alignV: "middle", fill: "#ffffff" })), x: Game.width / 2, y: Game.height * 4 / 5 });

    backgroundLayer.assign(startBDG);
    hudLayer.assign(startHeader, startCTA);
    state = "start";
};

// ---- WIN SCREEN ---- //

let chooseEnding = function() {
    let endings = ["WIN", "FINISH", "DONE", "COMPLETE", "CACTUS CACTUS CACTUS CACTUS CACTUS CACTUS CACTUS CACTUS"];
    let choice = Math.floor(Math.random() * 5);
    return endings[choice];
};

let showWinScreen = function() {
    Layer.purgeAll();
    let goHeader = new GameObject({ asset: (new Text({ text: "CACTUS", font: "Press Start", size: 40, alignH: "center", alignV: "middle", fill: "#ffffff" })), x: Game.width / 2, y: Game.height / 5 });
    let goStatus = new GameObject({ asset: (new Text({ text: chooseEnding(), font: "Press Start", size: 120, alignH: "center", alignV: "middle", fill: "#ffffff" })), x: Game.width / 2, y: Game.height / 2 });
    let goCTA = new GameObject({ asset: (new Text({ text: "PRESS SPACE TO MENU", font: "Press Start", size: 40, alignH: "center", alignV: "middle", fill: "#ffffff" })), x: Game.width / 2, y: Game.height * 4 / 5 });

    hudLayer.assign(goHeader, goStatus, goCTA);
    state = "win";
};

// ---- GAME SCREEN ---- //

let currentMap;
let currentMapNumber;
let winAnimation;
let winProperty;
let gravity = 3; // Setup game globals
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
let levelText = new GameObject({ asset: (new Text({ text: "LEVEL ", size: 40, font: "Press Start", fill: "#ffffff", alignH: "center", alignV: "middle" })), x: Game.width / 2, y: Game.height / 4, w: 0, h: 0 });

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
let testOnce = true;
cactusBro.position(...Asset.center(Game.width / 2, Game.height / 2, gameScale, gameScale));
let holyDroplet = new GameObject({ asset: new Asset({ image: "png/holydroplet.png" }) });

let dropletXPos = 0;
let dropletYPos = 0;

let levels = [ // Level Design
    {
        assets: {
            "O": (new Asset({ image: "png/desert/fill.png" })),
            "T": (new Asset({ image: "png/desert/top.png" })),
            "A": (new Asset({ image: "png/desert/left.png" })),
            "B": (new Asset({ image: "png/desert/right.png" })),
            "I": (new Asset({ image: "png/desert/insidel.png" })),
            "J": (new Asset({ image: "png/desert/insider.png" })),
            "K": (new Asset({ image: "png/desert/insetl.png" })),
            "L": (new Asset({ image: "png/desert/insetr.png" })),
            "R": (new Asset({ image: "png/desert/bottom.png" })),
            "M": (new Asset({ image: "png/desert/cornertl.png" })),
            "N": (new Asset({ image: "png/desert/cornertr.png" })),
            "P": (new Asset({ image: "png/desert/cornerbl.png" })),
            "Q": (new Asset({ image: "png/desert/cornerbr.png" })),
            "D": (new Asset({ image: "png/desert/floatl.png" })),
            "E": (new Asset({ image: "png/desert/floatc.png" })),
            "F": (new Asset({ image: "png/desert/floatr.png" })),
        
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
            "OOOOB---------------------------------------------------------AOOOOOOOOOOOOOOOOOOOOB--AOOOO","OOOOB---------------------------------------------------------AOOOOOOOOOOOOOOOOOOOOB--AOOOO","OOOOB---------------------------------------------------------AOOOOOOOOOOOOOOOOOOOOB--AOOOO","OOOOB---------------------------------------------------------AOOOOOOOOOOOOOOOOOOOOB--AOOOO","OOOOB---------------------------------------------------------AOOOOOOOOOOOOOOOOOOOOB--AOOOO",
            "OOOOB---------------------------------------------------------AOOOOOOOOOOOOOOOOOOOOB--AOOOO",
            "OOOOB---------------------------------------------------------AOOOOOOOOOOOOOOOOOOOOB--AOOOO",
            "OOOOB---------------------------------------------------------AOOOOOOOOOOOOOOOOOOOOB--AOOOO",
            "OOOOB---------------------------------------------------------PRRRRRRRRRRRRRRRRRRRRQ--AOOOO",
            "OOOOB---------------------------------------------------------------------------------AOOOO",
            "OOOOB---------------------------------------------------------------------------------AOOOO",
            "OOOOB----------------------mno------------fg-----------------------wx-----------------AOOOO",
            "OOOOB----------------------pqr-------MTTTTTTTTN----d------y---MTTTTTTTTTTN---MTTTTTTTJLOOOO",
            "OOOOB---------------------DEEEEEF----AOOOOOOOOB---DEEEF--DEEF-AOOOOOOOOOOB---AOOOOOOOOOOOOO",
            "OOOOB-b---y------y----b------------MJLOOOOOOOOKNz-------------AOOOOOOOOOOB---AOOOOOOOOOOOOO",
            "OOOOKITTTTTTTTTTTTTTTTTTTTTTTTTTTTJLOOOOOOOOOOOKITN-------MTTJLOOOOOOOOOOB---AOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOB-------AOOOOOOOOOOOOOOB---AOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOB-------AOOOOOOOOOOOOOOB---AOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOB-------AOOOOOOOOOOOOOOB---AOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOB-------AOOOOOOOOOOOOOOB---AOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOB-------AOOOOOOOOOOOOOOB---AOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOB-------AOOOOOOOOOOOOOOB---AOOOOOOOOOOOOO",
        ],
        start: {
            x: gameScale * 6, 
            y: gameScale * 14, 
            size: gameScale
        },
        win: {
            requirements: {
                x: gameScale * 82
            },
            animation: (value, delta) => {
                if (value < 1500) {
                    currentMap.x += ((1500 - value) / 1500) * speed * maxSpeed * (delta / 1000);
                } else if (value > 3000) {
                    currentMap.y -= ((value - 3000) / 2000) * speed * maxSpeed * 1.5 * (delta / 1000);
                }
            },
            duration: 5000
        }
    },
    {
        assets: {
            "H": (new Asset({ image: "png/pipe/pipeh.png" })),
            "V": (new Asset({ image: "png/pipe/pipev.png" })),
            "M": (new Asset({ image: "png/pipe/cornertl.png" })),
            "N": (new Asset({ image: "png/pipe/cornertr.png" })),
            "P": (new Asset({ image: "png/pipe/cornerbl.png" })),
            "Q": (new Asset({ image: "png/pipe/cornerbr.png" })),
        },
        map: [
            "----------------V---------V-----V-------------V--------------------V-------------V--V------",
            "----------------V---------V-----V-------------V--------------------V-------------V--V------",
            "----------------V---------V-----V-------------V--------------------V-------------V--V------",
            "----------------V---------V-----V-------------V--------------------V-------------V--V------",
            "----------------V---------V-----V-------------V--------------------V-------------V--V------",
            "----------------V---------V-----V-------------V--------------------V-------------V--V------",
            "----------------V---------V-----V-------------V--------------------V-------------V--V------",
            "----------------V---------V-----V-------------V--------------------V-------------V--V------",
            "----------------V---------V-----V-------------V--------------------PHHHHHHHHHHHHHQ--V------",
            "HHHHHHN---------V---------PHHHHHHHHHHHHHHHHHHHQ-------------------------------------V------",
            "------V---------V---------------V---------------------------------------------------V------",
            "HHHHN-V---------V---------------V--------------------------MHHHHHHHHHHHHHHHHHHHHHHHHVHHHHHH",
            "----V-V---------PHHHHHHHHHHHHHHHQ--------------------------V------------------------V------",
            "----V-V---------------------------------MHHHHHHHHHHHHHN----V------MHHHHHHHHHHHN-----V------",
            "----V-PHHHHHHN--------------------------V-------------V----V------V-----------V-----V------",
            "----PHN------V-------------------MHHHHHHVHHHHHHHHHN---PHHHHHHHHHHHHHHHHHHHHHHHHHHHHHV------",
            "------V------V-------------------V------V---------V--------V------------------------V------",
            "------V------V--------MHHHHHHHHHHHHHHHHHVHHHHHHHN-V----MHHHHHHHHHHN-----------------V------",
            "------V------V--------V----------V------V-------V-V----V---V------PHHHHHHHHHHHHHHHHHVHHHHHH",
            "------V------VHHHN----V------MHHHHHHHHHHQ-MHHHHHVHHHHHHVHHHQ------------------------V------",
            "------V------V---V----V------V---PHHHHHHHHQ-----V------V----------------------------V--MHHH",
            "HHHHHHVHHHHHHQ---V---MHHHHHHHQ------------------PHHHHHHQ----------------------------V--V---",
            "------V----------V---VV------------------------------------------MHHHHHHN-----------V--V---",
            "------VHHHHHHHHHHHN--PQ-----MHHHHHHHHN---------------------------V------V----MHHHHHHQ--V---",
            "------V----------VV---------V--------V----MHN-------------MHHHN--V------V----V---------V---",
            "------VHHHHHHHHHHHVHHHHHN---V----MHHHQ----V-V----MHHHHHN--V---V--V------V----V---------V---",
            "------V----------VV-----V---V----V------MHVHHHN--V-----PHHVHHHVHHHHHHHHHQ----V------MHHQ---",
            "HHHHHHVHHHHHHHHHHQV--MHHVHHHQ----V------V-V-V-V--V--------V---V--V-----------V------V------",
            "------V-----------V--V--V--------PHHHHHHHHHHVHQ--V--------V---V--V-----------V------V------",
            "------V-----------V--V--V---------------V-V-V----PHHHHHHN-V---V--V-----------PHHHHHHVHHHHHH",
            "------V-----------V--V--V---------------V-V-V-----------V-V---V--V------------------V------",
            "------V-----------V--V--V---------------V-V-V-----------V-V---V--V------------------V------",
        ],
        start: {
            x: gameScale * 81, 
            y: gameScale * 22, 
            size: gameScale
        },
        win: {
            requirements: {
                x: gameScale * 80,
                y: gameScale * 13
            },
            animation: (value, delta) => {
                if (value < 1500) {
                    currentMap.x += ((1500 - value) / 1500) * speed * maxSpeed * (delta / 1000);
                } else if (value > 3000) {
                    currentMap.y -= ((value - 3000) / 2000) * speed * maxSpeed * 1.5 * (delta / 1000);
                }
            },
            duration: 5000
        }
    },
    {
        assets: {
            "O": (new Asset({ image: "png/cloud/fill.png" })),
            "A": (new Asset({ image: "png/cloud/left.png" })),
            "B": (new Asset({ image: "png/cloud/right.png" })),
            "T": (new Asset({ image: "png/cloud/top.png" })),
            "R": (new Asset({ image: "png/cloud/bottom.png" })),
            "M": (new Asset({ image: "png/cloud/corner-tl.png" })),
            "N": (new Asset({ image: "png/cloud/corner-tr.png" })),
            "P": (new Asset({ image: "png/cloud/corner-bl.png" })),
            "Q": (new Asset({ image: "png/cloud/corner-br.png" })),
            "X": (new Asset({ image: "png/cloud/floatl.png" })),
            "Y": (new Asset({ image: "png/cloud/floatc.png" })),
            "Z": (new Asset({ image: "png/cloud/floatr.png" })),
        },
        map: [
            "----------------------------------------------------------------------------------------------------------------------------------",
            "------------------------------------------------------XYYYYYYYZ-------------------------------------------------------------------",
            "----------------------------------------------------------------------------------------------------------------------------------",
            "---------------------------------------XYYYYZ-------------------------------------------------------------------------------------",
            "---------------------XYYYYYYYZ----------------------------------------------------------------------------------------------------",
            "-----------------------------------------------------------MTTTTTN--XYYYYYZ----XYYZ-----XYYYYZ---XYYYYYYYYYYYYYYYZ----------------",
            "----------XYYYYYZ-------------------------------MTTTTTN----PRRRRRQ----------------------------------------------------------------",
            "-------------------------------------MTTTTTN----PRRRRRQ---------------------------------------------------------------------------",
            "--------------------------MTTTTTN----PRRRRRQ--------------------------------------------------------------------------------------",
            "---------------MTTTTTN----AOOOOOB-------------------------------------------------------------------------------------------------",
            "---------------AOOOOOB----PRRRRRQ-------------------------------------------------------------------------------------------------",
            "---------------PRRRRRQ------------------------------------------------------------------------------------------------------------",
            "----------------------------------------------------------------------------------------------------------------------------------",
            "----------------------------------------------------------------------------------------------------------------------------------",
            "----------------------------------------------------------------------------------------------------------------------------------",
            "----------------------------------------------------------------------------------------------------------------------------------",
        ],
        start: {
            x: gameScale * 19, 
            y: gameScale * 9, 
            size: gameScale
        },
        win: {
            requirements: {
                x: gameScale * 110
            },
            animation: (value, delta) => {
                if (value < 1500) {
                    currentMap.x += ((1500 - value) / 1500) * speed * maxSpeed * (delta / 1000);

                    let dropletX = 21660;
                    let dropletY = 840;
                    if (Math.abs(dropletX - currentMap.x) <= (Game.width / 2) + (gameScale / 2) && Math.abs(dropletY - currentMap.y) <= (Game.height / 2) + (gameScale / 2)) {
                        dropletXPos = Game.width / 2 + (dropletX - currentMap.x);
                        dropletYPos = Game.height / 2 + (dropletY - currentMap.y);
                        let coords = Asset.center(dropletXPos, dropletYPos, gameScale, gameScale);
                        holyDroplet.position(...coords);
                    }
                } else if (value > 3000 && value < 5000) {
                    currentMap.y -= ((value - 3000) / 2000) * speed * maxSpeed * 1.5 * (delta / 1000);
                } else if (value > 6000 && value < 8000) {
                    let amount = Math.pow(((value - 6000) * 9 / 2000) + 1, 4) / 10000;
                    let scale = gameScale + (amount * gameScale * 4);
                    cactusBro.position(...Asset.center(Game.width / 2, Game.height / 2, scale, scale));
                    holyDroplet.position(...Asset.center(dropletXPos, dropletYPos, gameScale * (1 - (amount * 0.97)), gameScale * (1 - (amount * 0.97))))
                }
            },
            duration: 10000
        },
        load: function() {
            mapLayer.assign(holyDroplet);
            holyDroplet.position(-100, -100, 20, 20);
        },
        tick: function(_stamp, _delta, phys) {
            if (!phys) { return; }
            let dropletX = 21660;
            let dropletY = 840;
            if (Math.abs(dropletX - currentMap.x) <= (Game.width / 2) + (gameScale / 2) && Math.abs(dropletY - currentMap.y) <= (Game.height / 2) + (gameScale / 2)) {
                let coords = Asset.center(Game.width / 2 + (dropletX - currentMap.x), Game.height / 2 + (dropletY - currentMap.y), gameScale, gameScale);
                holyDroplet.position(...coords);
            }
        }
    }
]

let levelMaps = [];

for (let i = 0; i < levels.length; i++) {
    levelMaps.push(new LevelMap(levels[i].assets, levels[i].map, levels[i].start)); // Pre create all the LevelMap's
}

let loadLevel = function(number) {
    Layer.purgeAll();
    currentMapNumber = number;
    currentMap = levelMaps[number];
    currentMap.position(levels[number].start.x, levels[number].start.y);
    moveX = 0;
    moveY = 0;
    levelText.asset.text = "LEVEL " + (number + 1);
    backgroundLayer.assign(levelBackground);
    mapLayer.assign(currentMap);
    cactusBro.position(...Asset.center(Game.width / 2, Game.height / 2, gameScale, gameScale));
    detailsLayer.assign(cactusBro);
    hudLayer.assign(levelText);
    Game.wait(() => { hudLayer.remove(levelText) }, 1000);
    state = "game";
    doPhysics = true;
    cactusAnimation.switch("idle");
    if (levels[number].load) {
        levels[number].load();
    }
};

// Movement/Physics/Collision Setup
collisionPoints = {
    xn: -(gameScale / 2),
    xp: (gameScale / 2),
    yn: -(gameScale / 2),
    yp: (gameScale / 2),
}

let dielol = function() {
    state = "";
    Layer.purgeAll();
    Game.wait(() => { loadLevel(currentMapNumber); }, 500)
};

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
    moveY = Math.min(maxSpeed, moveY + (gravity * (delta / 1000)));

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

let checkDeath = function() {
    if (currentMap.y + (Game.height / 2) > currentMap.sizeY * gameScale) {
        dielol();
    }
};

let checkWin = function() {
    let yes = true;
    if (levels[currentMapNumber].win.requirements.x && currentMap.x < levels[currentMapNumber].win.requirements.x) {
        yes = false;
    }

    if (levels[currentMapNumber].win.requirements.y && currentMap.y > levels[currentMapNumber].win.requirements.y) {
        yes = false;
    }

    if (yes) {
        doPhysics = false;
        winAnimation = levels[currentMapNumber].win.animation;

        winProperty = new Animate.property(levels[currentMapNumber].win.duration, {0: 0, 1: levels[currentMapNumber].win.duration}, 1);

        Game.wait(() => {
            Layer.purgeAll();
            winAnimation = null;
            state = "";
            Game.wait(() => {
                if (currentMapNumber + 1 < levels.length) {
                    loadLevel(currentMapNumber + 1);
                } else {
                    showWinScreen();
                }
            }, 500);
        }, levels[currentMapNumber].win.duration);
    }
};

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
            break;
        }
        case ("game"): {
            if (winAnimation) {
                winAnimation(winProperty.value(), delta);
            }
            
            if (doPhysics) {
                movementGameLoop(delta);
                checkDeath();
                checkWin();
            }

            if (currentMapNumber && levels[currentMapNumber] && levels[currentMapNumber].tick) {
                levels[currentMapNumber].tick(stamp, delta, doPhysics);
            }

            break;
        }
    }
});

Controller.on("press", "key_ ", () => {
    if (state == "game" && touchingGround) {
        moveY = maxSpeed * -1.5;
    } else if (state == "start") {
        Layer.purgeAll()
        Game.wait(() => { loadLevel(0); }, 500);
        state = "";
    } else if (state == "win") {
        Layer.purgeAll()
        Game.wait(() => { loadStartScreen(); }, 500);
        state = "";
    }
})

loadingScreen();

Game.start();