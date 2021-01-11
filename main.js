Game.create({ width: 1080, height: 1920 });



Game.on("loop", () => {
    console.log(banana.value());
});

Game.start();