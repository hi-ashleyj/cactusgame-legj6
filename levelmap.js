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