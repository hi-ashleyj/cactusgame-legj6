Game.create({ width: 1080, height: 1920 });

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



let backgroundLayer = new Layer("background", { level: 0 });
let mapLayer = new Layer("map", { level: 1 });
let detailsLayer = new Layer("details", { level: 2 });
let hud = new Layer("hud", { level: 3 });

let state = "loading";

let speed = 500;

let levelAssets = {
    "0": (new Asset({ image: "png/fill.png" })),
    "T": (new Asset({ image: "png/top.png" })),
    "A": (new Asset({ image: "png/left.png" })),
    "B": (new Asset({ image: "png/right.png" })),
    "I": (new Asset({ image: "png/insidel.png" })),
    "J": (new Asset({ image: "png/insider.png" })),
    "K": (new Asset({ image: "png/insetl.png" })),
    "L": (new Asset({ image: "png/insetr.png" })),
};

let testMap = new LevelMap(levelAssets, [
    "0000B-------------------------A00000",
    "0000B-------------------------A00000",
    "0000B-------------------------A00000",
    "0000B-------------------------A00000",
    "0000B-------------------------A00000",
    "0000KITTTTTTTTTTTTTTTTTTTTTTTJL00000",
    "000000000000000000000000000000000000",
    "000000000000000000000000000000000000",
    "000000000000000000000000000000000000",
    "000000000000000000000000000000000000",
    "000000000000000000000000000000000000",
    "000000000000000000000000000000000000",
], { x: 1000, y: 1000, size: 256});

Game.on("loop", ({ stamp, delta }) => {
    switch (state) {
        case ("loading"): {
            if (Asset.loading.length == 0) {
                mapLayer.assign(testMap);
                state = "game";
            }
            break;
        }
        case ("game"): {
            let moveX = 0;
            let moveY = 0;
            if (Controller.isPressed("key_a")) { moveX -= 1 }
            if (Controller.isPressed("key_d")) { moveX += 1 }
            if (Controller.isPressed("key_w")) { moveY -= 1 }
            if (Controller.isPressed("key_s")) { moveY += 1 }
            if (Controller.isPressed("key_shift")) { moveX *= "2"; moveY *= 2}
        
            testMap.move(moveX * speed * (delta / 1000), moveY * speed * (delta / 1000));
            break;
        }
    }
});

Game.start();