let Game = {};

let Controller = {};
Controller.events = [];
Controller.lasts = {};
Controller.pressed = {};
Controller.mouse = {};
Controller.mouse.location = {};

Controller.on = function(action, target, call) {
    Controller.events.push({ action, target, call });
};

Controller.fire = function(action, target, data) {
    for (let i in Controller.events) {
        if ((!Controller.events[i].target || Controller.events[i].target == target) && (!Controller.events[i].action || Controller.events[i].action == action)) {
            Controller.events[i].call(action, target, (data) ? data : null);
        }
    }
};

Controller.isPressed = function(code) {
    return Controller.pressed[code];
}

Controller.handleKeyboard = function(e) {
    let target = "key_" + e.key.toLowerCase();
    if (e.type == "keydown") {
        if (!Controller.pressed[target]) {
            Controller.pressed[target] = true;
            Controller.lasts[target] = e.timeStamp;
            Controller.fire("press", target);
        }
    } else if (e.type == "keyup") {
        if (Controller.pressed[target]) {
            Controller.pressed[target] = false;
            let diff = e.timeStamp - Controller.lasts[target];

            if (diff <= 150) {
                Controller.fire("click", target);
            } else {
                Controller.fire("hold", target, diff);
            }

            Controller.lasts[target] = e.timeStamp;
            Controller.fire("release", target);
        }
    }
};

Controller.handleMouse = function(e) {
    let target = "mouse_" + ((e.button) ? ["left", "middle", "right", "back", "forward"][e.button] : "moose");
    e.preventDefault();
    if (e.type == "mousedown") {
        if (!Controller.pressed[target]) {
            Controller.pressed[target] = true;
            Controller.lasts[target] = e.timeStamp;
            Controller.fire("press", target);
        }
    } else if (e.type == "mouseup") {
        if (Controller.pressed[target]) {
            Controller.pressed[target] = false;
            let diff = e.timeStamp - Controller.lasts[target];

            if (diff <= 150) {
                Controller.fire("click", target);
            } else {
                Controller.fire("hold", target, diff);
            }

            Controller.lasts[target] = e.timeStamp;
            Controller.fire("release", target);
        }
    }
    if (e.clientX && e.clientY) {
        let deltaX = e.clientX - Controller.mouse.location.x;
        let deltaY = e.clientY - Controller.mouse.location.y;

        Controller.fire("move", "mouse_location", { x: e.clientX, y: e.clientY, deltaX, deltaY });

        Controller.mouse.location.x = e.clientX;
        Controller.mouse.location.y = e.clientY;
    }
    if (e.type == "wheel") {
        let direction = "";
        if (e.deltaY < 0) {
            direction += "N";
        } else if (e.deltaY > 0) {
            direction += "S";
        }

        if (e.deltaX < 0) {
            direction += "W";
        } else if (e.deltaX > 0) {
            direction += "E";
        }

        Controller.fire("move", "mouse_wheel", { direction, deltaX: e.deltaX, deltaY: e.deltaY });
    }
};

Controller.setup = function() {
    document.addEventListener("mousedown", Controller.handleMouse, false);
    document.addEventListener("mouseup", Controller.handleMouse, false);
    document.addEventListener("mousemove", Controller.handleMouse, false);
    document.addEventListener("wheel", Controller.handleMouse, false);

    document.addEventListener("keydown", Controller.handleKeyboard, false);
    document.addEventListener("keyup", Controller.handleKeyboard, false);
};

let Asset = function(options) {
    if (options.image) {
        this.type = "image";
        this.location = options.image;
        if (Asset.locations[this.location]) {
            this.resource = Asset.locations[this.location];
        } else {
            // TODO: Add getter code
        }
        if (options.crop) {
            this.crop = [options.crop.x, options.crop.y, options.crop.w, options.crop.h];
        }
    }

    return this;
};

Asset.Primitive = function(id, options) {
    if (options.type) {
        if (options.type == "rectangle") {
            this.type = "rect";
        } else if (options.type == "circle") {
            this.type = "arc";
            this.angleFrom = 0;
            this.angleTo = 360;
        } else if (options.type == "arc") {
            this.type = "arc";
            this.angleFrom = options.angleFrom;
            this.angleTo = options.angleTo;
        }

        this.fill = (options.fill) ? options.fill : null;
        this.stroke = (options.stroke) ? options.stroke : null;
    }

    return this;
};

Asset.loading = [];
Asset.locations = {};

Asset.center = function(x, y, w, h) {
    return [x - (w / 2), y - (h / 2), w, h];
};

Asset.prototype.draw = function(layer, x, y, w, h) {
    switch (this.type) {
        case ("image"): {
            if (this.crop) {
                layer.ctx.image(this.resource, ...this.crop, x, y, w, h);
            } else {
                layer.ctx.image(this.resource, x, y, w, h);
            }
            break;
        }
    }
};

Asset.Primitive.prototype.draw = function(layer, x, y, w, h) {
    switch (this.type) {
        case ("rect"): {
            if (this.fill) {
                layer.ctx.fillStyle = this.fill;
                layer.ctx.fillRect(x, y, w, h);
            }
            if (this.stroke) {
                layer.ctx.fillStyle = this.stroke;
                layer.ctx.strokeRect(x, y, w, h);
            }
            break;
        }
        case ("arc"): {
            let r = (this.w + this.h) / 4;
            layer.ctx.beginPath();
            layer.ctx.arc(x, y, r, ((this.angleFrom - 90) * Math.PI / 180), ((this.angleTo - 90) * Math.PI / 180));
            layer.ctx.lineTo(x, y);
            layer.ctx.closePath();
            if (this.fill) {
                layer.ctx.fillStyle = this.fill;
                layer.ctx.fill();
            }
            if (this.stroke) {
                layer.ctx.fillStyle = this.stroke;
                layer.ctx.stroke();
            }
            break;
        }
    }
};

let Sound = function(layer, description, asset) {
    // TODO: handle converting asset into something playable
};

let Layer = function(id, options) {
    if (!Game.width || !Game.height) {
        throw "Game not created yet";
    }
    let john = document.createElement("canvas");
    john.className = "game-canvas";
    john.style.zIndex = options.level;
    document.querySelector("div#game").append(john);
    john.width = Game.width;
    john.height = Game.height;

    this.id = id;
    this.level = options.level;
    this.canvas = john;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.targets = [];

    Layer.list[id] = this;
    return this;
};

Layer.list = {};

Layer.drawAll = function() {
    let layers = Object.keys(Layer.list).sort((a, b) => { return Layer.list[a].level - Layer.list[b].level;});

    for (let i = 0; i < layers.length; i++) {
        Layer.list[layers[i]].draw();
    }
};

Layer.prototype.add = function(...assets) {
    for (let thing of assets) {
        thing.layer = this;
        this.targets.push(thing);
    }

    return this;
};

Layer.prototype.draw = function() {
    this.ctx.clearRect(0, 0, Game.width, Game.height);
    for (let i = 0; i < this.targets.length; i++) {
        this.targets[i].draw(this);
    }
};

let Animate = {};
Animate.stamp = -1;
Animate.targets = [];

Animate.tick = function(stamp) {
    Animate.stamp = stamp;
};

Animate.property = function(time, steps, count) {
    this.time = time;
    this.steps = steps;
    this.points = Object.keys(this.steps).map((val) => { return parseFloat(val); }).sort((a, b) => { return a - b });
    this.count = (count) ? count : Infinity;
    this.once = true;
    this.offset = 0;

    Animate.targets.push(this);
    return this;
};

Animate.property.prototype.value = function() {
    if (this.once) {
        this.offset = Animate.stamp;
        this.once = false;
    }
    let factor = ((Animate.stamp - this.offset) % this.time) / this.time;
    if (Math.floor(((Animate.stamp - this.offset) / this.time)) >= this.count) { return null; }
    if (this.points < 2) {
        return;
    }
    let to;
    let from;
    for (let i = 0; i < this.points.length; i++) {
        if (this.points[i] >= factor) {
            to = this.points[i];
            from = this.points[i - 1];
            break;
        }
    }

    let value = this.steps[from] + ((this.steps[to] - this.steps[from]) * ((factor - from) / (to - from)));
    return value; 
};

let TileMap = function(options) {
    this.scaleX = options.scaleX;
    this.scaleY = options.scaleY;
    this.size = options.size;
    this.map = new Array(this.size);

    for (let i = 0; i < this.size; i ++) {
        this.map[i] = new Asset(Object.assign({ crop: { x: i * this.scaleX, y: 0, w: this.scaleX, h: this.scaleY } }, options));
    }

    return this;
};

Animate.Sequence = function(animations, def) {
    this.animations = animations;
    this.default = def;
    this.using = def;
    this.timing = new Animate.property(this.animations[this.using].duration, {0: 0, 1: this.animations[this.using].sequence.length}, Infinity);
    return this;
};

Animate.Sequence.prototype.switch = function(thing) {
    if (this.animations[thing]) {
        this.using = thing;
        this.timing = new Animate.property(this.animations[this.using].duration, {0: 0, 1: this.animations[this.using].sequence.length}, Infinity);
    }
};

Animate.Sequence.prototype.draw = function(layer, x, y, w, h) {
    let thing = Math.floor(this.timing.value());
    this.animations[this.using].sequence[thing].draw(layer, x, y, w, h);
};

let GameObject = function(options) {
    this.asset = options.asset;
    this.x = (options.x) ? options.x : 0;
    this.y = (options.y) ? options.y : 0;
    this.w = (options.w) ? options.w : 100;
    this.h = (options.h) ? options.h : 100;

    return this;
};

GameObject.prototype.draw = function(layer) {
    this.asset.draw(layer, this.x, this.y, this.w, this.h);
};





Game.timeouts = [];
Game.last = -1;

Game.wait = function(callback, delay) {
    Game.timeouts.push({ callback, delay });
};

Game.events = [];

Game.on = function(type, call) {
    Game.events.push({ type, call });
};

Game.fire = function(type, data) {
    for (let e of Game.events) {
        if (e.type == type) {
            e.call((data) ? data : null);
        }
    }
};


Game.loop = function(time) {
    if (Game.last < 0) {
        Game.last = time;
    }
    let delta = (time - Game.last);
    Animate.tick(time);

    for (let i = Game.timeouts.length - 1; i >= 0; i--) {
        if (Game.timeouts[i].start) {
            if (time >= Game.timeouts[i].start + Game.timeouts[i].delay) {
                Game.timeouts[i].callback(time - (Game.timeouts[i].start + Game.timeouts[i].delay));
                Game.timeouts.splice(i, 1);
            }
        } else {
            Game.timeouts[i].start = time;
        }
    }

    Game.fire("loop", { stamp: time, delta: delta });

    Layer.drawAll();

    Game.fire("postdraw", { stamp: time, delta: delta });

    window.requestAnimationFrame(Game.loop);
    Game.last = time;
};

Game.create = function(options) {
    Game.width = options.width;
    Game.height = options.height;

    Controller.setup();
}

Game.start = function() {
    window.requestAnimationFrame(Game.loop);
};