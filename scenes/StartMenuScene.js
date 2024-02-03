import Phaser from 'phaser';
export default class StartMenuScene extends Phaser.Scene {
    constructor() {
        super('StartMenuScene');
    }

    preload() {
        // Preload assets if any specific to the Start Menu
    }

    create() {
        // Add Start Menu text
        this.add.text(20, 20, 'Press SPACE to start', { fontSize: '32px', fill: '#FFF' });

        // Start game on SPACE press
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('StartScene');
        });
    }
}