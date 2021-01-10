Game.create({ width: 1080, height: 1920 });

let Lbase = new Layer("base", { level: 0 });
let Lcontent = new Layer("content", { level: 1 });

let Abackground = new Asset("background", {
    primitive: "rectangle",
    fill: "#222222"
});
Abackground.position(0, 0, Game.width, Game.height);

let Ahalfcircle = new Asset("halfcircle", {
    primitive: "arc",
    fill: "#ffffff",
    angleFrom: 0,
    angleTo: 180
});
Ahalfcircle.position(Game.width / 2, Game.height / 2, 300, 300);

let AhalfcircleI = Ahalfcircle.clone("halfcircleI", { fill: "#7700cc" });
AhalfcircleI.position(Game.width / 2, Game.height / 2, 200, 200);

let ABD1 = new Asset("bouncedot1", {
    primitive: "circle",
    fill: "#db188a"
});

ABD1.position((Game.width / 2) - 100, Game.height * 3 / 4, 30, 30);

let ABD2 = ABD1.clone("bouncedot2");
let ABD3 = ABD1.clone("bouncedot3");

Lbase.add(Abackground, Ahalfcircle);

Lcontent.add(AhalfcircleI, ABD1, ABD2, ABD3);

let AnimateHalfcircleF = new Animate.property(Ahalfcircle, "angleFrom", 1000, { 0: 0, 1: 360 }, Infinity);
let AnimateHalfcircleT = new Animate.property(Ahalfcircle, "angleTo", 1000, { 0: 180, 1: 540 }, Infinity);
let AnimateHalfcircleIF = new Animate.property(AhalfcircleI, "angleFrom", 1000, { 0: 180, 1: 540 }, Infinity);
let AnimateHalfcircleIT = new Animate.property(AhalfcircleI, "angleTo", 1000, { 0: 360, 1: 720 }, Infinity);

let ABD1X = new Animate.property(ABD1, "x", 3000, { 0: (Game.width / 2) - 100, 0.5: (Game.width / 2) + 100, 1: (Game.width / 2) - 100 }, Infinity);
let ABD2X;
let ABD3X;

Game.start();

Game.wait(() => { ABD2x = new Animate.property(ABD2, "x", 3000, { 0: (Game.width / 2) - 100, 0.5: (Game.width / 2) + 100, 1: (Game.width / 2) - 100 }, Infinity); }, 200);
Game.wait(() => { ABD3X = new Animate.property(ABD3, "x", 3000, { 0: (Game.width / 2) - 100, 0.5: (Game.width / 2) + 100, 1: (Game.width / 2) - 100 }, Infinity); }, 400);