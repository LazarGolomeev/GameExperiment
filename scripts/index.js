import StartMenuScene from '../scenes/StartMenuScene';
import StartScene from '../scenes/StartScene';

var config = {
    type: Phaser.AUTO,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 },
            debug: true,
            worldBoundsEvent: true
        },
    },
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [StartMenuScene, StartScene] // Array of scenes
};

var game = new Phaser.Game(config);