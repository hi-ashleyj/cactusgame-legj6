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

let Asset = function(id, options) {
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
        
    } else if (options.primitive) {
        if (options.primitive == "rectangle") {
            this.type = "rect";
        } else if (options.primitive == "circle") {
            this.type = "arc";
            this.angleFrom = 0;
            this.angleTo = 360;
        } else if (options.primitive == "arc") {
            this.type = "arc";
            this.angleFrom = options.angleFrom;
            this.angleTo = options.angleTo;
        }

        this.fill = (options.fill) ? options.fill : null;
        this.stroke = (options.stroke) ? options.stroke : null;
    }

    if (options.crop) {
        this.crop = [options.crop.x, options.crop.y, options.crop.w, options.crop.h];
    }

    if (options.layer) {
        this.layer = options.layer;
    }

    if (options.raw) {
        Object.assign(this, options.raw);
    }

    if (options.update) {
        Object.assign(this, options.update);
    }

    this.id = id;

    Asset.list[id] = this;
    return this;
};

Asset.list = {};
Asset.loading = [];
Asset.locations = {};

Asset.get = function(id) {
    return Asset.list[id];
};

Asset.center = function(x, y, w, h) {
    return [x - (w / 2), y - (h / 2), w, h];
};

Asset.prototype.draw = function() {
    switch (this.type) {
        case ("image"): {
            if (this.crop) {
                this.layer.ctx.image(this.resource, ...this.crop, this.x, this.y, this.w, this.h);
            } else {
                this.layer.ctx.image(this.resource, this.x, this.y, this.w, this.h);
            }
        }
        case ("rect"): {
            if (this.fill) {
                this.layer.ctx.fillStyle = this.fill;
                this.layer.ctx.fillRect(this.x, this.y, this.w, this.h);
            }
            if (this.stroke) {
                this.layer.ctx.fillStyle = this.stroke;
                this.layer.ctx.strokeRect(this.x, this.y, this.w, this.h);
            }
        }
        case ("arc"): {
            let r = (this.w + this.h) / 4;
            this.layer.ctx.beginPath();
            this.layer.ctx.arc(this.x, this.y, r, ((this.angleFrom - 90) * Math.PI / 180), ((this.angleTo - 90) * Math.PI / 180));
            this.layer.ctx.lineTo(this.x, this.y);
            if (this.fill) {
                this.layer.ctx.fillStyle = this.fill;
                this.layer.ctx.fill();
            }
            if (this.stroke) {
                this.layer.ctx.fillStyle = this.stroke;
                this.layer.ctx.stroke();
            }
        }
    }
};

Asset.prototype.position = function(x, y, w, h) {
    this.x = x;
    this.y = y;
    if (w) { this.w = w; }
    if (h) { this.h = h; }
};

Asset.prototype.clone = function(id, changes) {
    return new Asset(id, { raw: this, update: changes });
};

let Player = {};

let Scene = {};

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
        this.targets[i].draw();
    }
};

let Animate = {};
Animate.last = -1;
Animate.targets = [];

Animate.tick = function(stamp) {
    if (Animate.last < 0) {
        Animate.last = stamp;
    }
    for (let i in Animate.targets) {
        Animate.targets[i].tick(stamp);
    }
    Animate.last = stamp;
};

Animate.property = function(parent, name, time, steps, count) {
    this.parent = parent;
    this.name = name;
    this.time = time;
    this.steps = steps;
    this.points = Object.keys(this.steps).map((val) => { return parseFloat(val); }).sort((a, b) => { return a - b });
    this.count = (count) ? count : Infinity;
    this.once = true;
    this.offset = 0;

    Animate.targets.push(this);
    return this;
};

Animate.property.prototype.tick = function(stamp) {
    if (this.once) {
        this.offset = stamp;
        this.once = false;
    }
    let factor = ((stamp - this.offset) % this.time) / this.time;
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
    this.parent[this.name] = value; 
};

Game.timeouts = [];

Game.wait = function(callback, delay) {
    Game.timeouts.push({ callback, delay });
};

Game.loop = function(time) {
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

    Animate.tick(time);

    Layer.drawAll();

    window.requestAnimationFrame(Game.loop);
};

Game.create = function(options) {
    Game.width = options.width;
    Game.height = options.height;

    Controller.setup();
}

Game.start = function() {
    window.requestAnimationFrame(Game.loop);
};