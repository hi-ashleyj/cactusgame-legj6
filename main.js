Game.create({ width: 1920, height: 1080 });

let LevelMap = function(tileMap, levelMap, position) {
    this.x = position.x;
    this.y = position.y;
    this.size = position.size;
    this.tiles = tileMap;
    this.sizeY = levelMap.length;
    this.sizeX = levelMap[0].length;
    this.map = (new Array(this.sizeY));
    for (let i = 0; i < this.sizeY; i ++) {
        this.map[i] = levelMap[i].split("");
    }
};

LevelMap.prototype.draw = function(layer) {
    let xPos = Game.width / 2; // Calculates remaining pixels to fill
    let fromX = Math.floor(this.x / this.size); // Calculates which tile the player is standing in
    xPos -= this.x % this.size; // Aligns xPos to the left side of that tile

    fromX -= Math.ceil(xPos / this.size); // calculates number of remaining tiles to fill the screen, then remembers that index
    xPos -= (Math.ceil(xPos / this.size) * this.size); // Calcuates position of that tile relative to screen space

    let yPos = Game.height / 2; // For Y axis
    let fromY = Math.floor(this.y / this.size); 
    yPos -= this.y % this.size; 

    fromY -= Math.ceil(yPos / this.size); 
    yPos -= (Math.ceil(yPos / this.size) * this.size);

    // --- Prepare for heck

    let localY = 0 + yPos;
    let tileY = 0 + fromY;

    while (localY < Game.height) {
        let localX = 0 + xPos;
        let tileX = 0 + fromX;

        while (localX < Game.width) {
            if (this.map[tileY] && this.map[tileY][tileX] && this.map[tileY][tileX] !== "-") {
                this.tiles[this.map[tileY][tileX]].draw(layer, localX, localY, this.size, this.size);
            }

            localX += this.size;
            tileX += 1;
        }

        localY += this.size;
        tileY += 1;
    }
};

LevelMap.prototype.move = function(x, y, size) {
    if (typeof x == "number") { this.x += x; };
    if (typeof y == "number") { this.y += y; };
    if (typeof size == "number") { this.size += size; };
}

LevelMap.prototype.position = function(x, y, size) {
    if (typeof x == "number") { this.x = x; };
    if (typeof y == "number") { this.y = y; };
    if (typeof size == "number") { this.size = size; };
}

let gameScale = 192;
let state = "loading";

let backgroundLayer = new Layer("background", { level: 0 });
let mapLayer = new Layer("map", { level: 1 });
let detailsLayer = new Layer("details", { level: 2 });
let hud = new Layer("hud", { level: 3 });

let cactusAnimation = new Animate.Sequence({ 
    idle: {
        duration: 1000,
        sequence: (new TileMap({ image: "png/character/cactus-idle-tile.png", scaleX: 128, scaleY: 128, size: 2})).map
    },
    run: {
        duration: 1000,
        sequence: (new TileMap({ image: "png/character/cactus-run-tile.png", scaleX: 128, scaleY: 128, size: 5})).map
    }
}, "idle");
let cactusBro = new GameObject({ asset: cactusAnimation });

cactusBro.position(...Asset.center(Game.width / 2, Game.height / 2, gameScale, gameScale));

let levelBackground = new GameObject({ asset: (new Asset({ image: "png/bg.png"})), x: 0, y: 0, w: Game.width, h: Game.height});
backgroundLayer.assign(levelBackground);

let aliveBush = new TileMap({ image: "png/decoration/alivebush.png", scaleX: 128, scaleY: 128, size: 2});
let deadBush = new TileMap({ image: "png/decoration/deadbush.png", scaleX: 128, scaleY: 128, size: 2});
let bones = new TileMap({ image: "png/decoration/bones.png", scaleX: 128, scaleY: 128, size: 2});
let bigtree = new TileMap({ image: "png/decoration/bigtree.png", scaleX: 128, scaleY: 128, size: 6});

let levelAssets = {
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
    "f": aliveBush.map[0],
    "g": aliveBush.map[1],
    "i": deadBush.map[0],
    "j": deadBush.map[1],
    "w": bones.map[0],
    "x": bones.map[1],
    "m": bigtree.map[0],
    "n": bigtree.map[1],
    "o": bigtree.map[2],
    "p": bigtree.map[3],
    "q": bigtree.map[4],
    "r": bigtree.map[5],
};

let currentMap = new LevelMap(levelAssets, [
    "OOOOB-------------------------AOOOOO",
    "OOOOB-------------------------AOOOOO",
    "OOOOB-------------------------AOOOOO",
    "OOOOB-----------mno-----------AOOOOO",
    "OOOOB-y---bij-z-pqr-fg--wx----AOOOOO",
    "OOOOKITTTTTTTTTT----TTTTTTTTTJLOOOOO",
    "OOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
], { x: gameScale * 6, y: gameScale * 4, size: gameScale});

let moveX = 0;
let moveY = 0;
let gravity = 2;
let acceleration = 4;
let friction = 4;
let maxSpeed = 1.8;
let speed = gameScale * 2;


let touchingGround = false;

collisionPoints = {
    xn: -(gameScale / 2),
    xp: (gameScale / 2),
    yn: -(gameScale / 2),
    yp: (gameScale / 2),
}

Game.on("loop", ({ stamp, delta }) => {
    switch (state) {
        case ("loading"): {
            if (Asset.loading.length == 0) {
                mapLayer.assign(currentMap);
                detailsLayer.assign(cactusBro);
                state = "game";
                cactusAnimation.switch("idle");
            }
            break;
        }
        case ("game"): {
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

            break;
        }
    }
});

Controller.on("press", "key_ ", () => {
    if (touchingGround) {
        moveY = -maxSpeed;
    }
})

Game.start();