import Phaser from 'phaser';
import sky from '../assets/newsky.png';
import platform from '../assets/platform.png';
import star from '../assets/star.png';
import bomb from '../assets/bomb.png';
import dude from '../assets/dude.png';

export default class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
        this.score = 0;
        this.gameOver = false;
        this.starCount = 11;
        this.enemyCollisions = 0;
        this.playerLastDirection = '';
        this.cursors;
        this.player;
        this.bombs;
        this.scoreText;
    }

    preload() {
        this.load.image("sky", sky);
        this.load.image("ground", platform);
        this.load.image("star", star);
        this.load.image("bomb", bomb);
        this.load.spritesheet("dude", dude, { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const groundPositionX = gameWidth / 2;
        const groundPositionY = gameHeight - 50;
        let starCount = 11;
        const playerStartX = 100;
        const playerStartY = gameHeight - 150;

        // Background
        console.log(gameWidth, gameHeight);


        //  A simple background for our game
        const sky = this.add.image(gameWidth, gameHeight, "sky").setScale(4);

        //  The platforms group contains the ground and the 2 ledges we can jump on
        let platforms = this.physics.add.staticGroup();
        const ground = this.add.rectangle(groundPositionX, groundPositionY, gameWidth, 60, 0x009900);
        const lavaPatchets = this.createLavaPatches(this, 5);

        //  Now let's create some ledges
        const firstJumpingPlatformPositionY = groundPositionY - 150;
        const firstJumpingPlatformPositionX = gameWidth - 120;
        const firstJumpingPlatform = platforms.create(firstJumpingPlatformPositionX, firstJumpingPlatformPositionY, "ground");
        const secondJumpingPlatform = platforms.create(firstJumpingPlatformPositionX - 450, firstJumpingPlatformPositionY - 150, "ground");

        if (gameWidth > 800) {
            const thirdJumpingPlatform = platforms.create(firstJumpingPlatformPositionX - 900, firstJumpingPlatformPositionY - 300, "ground");
            starCount = 13;
        }
        if (gameWidth > 1200 && gameHeight > 800) {
            const fourthJumpingPlatform = platforms.create(firstJumpingPlatformPositionX - 1350, firstJumpingPlatformPositionY - 450, "ground");
            starCount = 18;
        }
        if (gameWidth > 1600 && gameHeight > 800) {
            const fifthJumpingPlatform = platforms.create(firstJumpingPlatformPositionX - 1800, firstJumpingPlatformPositionY - 600, "ground");
            starCount = 27;
        }
        if (gameWidth < 800 && gameHeight > 600) {
            const thirdJumpingPlatform = platforms.create(firstJumpingPlatformPositionX, firstJumpingPlatformPositionY - 300, "ground");
            starCount = 7;
        }
        // platforms.create(groundPositionX, gameHeight / 2 - 100, "ground");
        // platforms.create(750, 220, "ground");
        platforms.add(ground);
        // platforms.create(400, 568, 50, 10).setScale(2).refreshBody();

        // The player and its settings
        this.player = this.physics.add.sprite(playerStartX, playerStartY, "dude");

        //  Player physics properties. Give the little guy a slight bounce.
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(1000);

        //  Our player animations, turning, walking left and walking right.
        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: "turn",
            frames: [{ key: "dude", frame: 4 }],
            frameRate: 20,
        });

        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1,
        });

        this.cursors = this.input.keyboard.createCursorKeys()

        //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        let stars = this.physics.add.group({
            key: "star",
            repeat: starCount,
            setXY: { x: 12, y: 0, stepX: 70 },
        });

        stars.children.iterate(function (child) {
            //  Give each star a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.bombs = this.physics.add.group();

        //  The score
        this.scoreText = this.add.text(16, 16, "score: 0", {
            fontSize: "32px",
            fill: "#000",
        });

        //  Collide the player and the stars with the platforms
        this.physics.add.collider(this.player, platforms);
        this.physics.add.collider(stars, platforms);
        this.physics.add.collider(this.bombs, platforms);

        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        // this.physics.add.overlap(player, stars, collectStar, null, this);

        this.physics.add.collider(this.player, lavaPatchets, this.collideWithLava, null, this);
        this.physics.add.collider(this.player, stars, this.collideWithEnemy, null, this);
        // Add a key for firing bombs
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Add collider between bombs and stars
        this.physics.add.collider(this.bombs, stars, this.bombHitsStar, null, this);
        this.physics.world.on('worldbounds', function (body) {
            // Check if the body has a gameObject (bomb) and it has collided with the world bounds
            if (body.gameObject && body.gameObject.getData('collisions') !== undefined) {
                let collisions = body.gameObject.getData('collisions') + 1;
                body.gameObject.setData('collisions', collisions);

                if (collisions >= 3) {
                    // After colliding 3 times, disable the bomb
                    body.gameObject.disableBody(true, true);
                }
            }
        });

        console.log(stars.countActive(true));
    }

    update() {
        var keys = this.input.keyboard.addKeys({
            up: "W",
            left: "A",
            down: "S",
            right: "D",
        });
        if (this.gameOver) {
            return;
        }

        if (this.cursors.left.isDown || keys.left.isDown) {
            this.player.setVelocityX(-300);

            this.player.anims.play("left", true);
        } else if (this.cursors.right.isDown || keys.right.isDown) {
            this.player.setVelocityX(300);

            this.player.anims.play("right", true);
        } else {
            this.player.setVelocityX(0);

            this.player.anims.play("turn");
        }

        if (
            (this.cursors.up.isDown || keys.up.isDown) &&
            this.player.body.touching.down
        ) {
            this.player.setVelocityY(-750);
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
            this.fireBomb(this);
        }
        if (this.score >= (this.starCount * 10) * 1.5) {
            endGame.call(this, '80ff80', 'You Win');
        }

        if (this.player.body.velocity.x > 0) {
            this.playerLastDirection = 'right';
        } else if (this.player.body.velocity.x < 0) {
            this.playerLastDirection = 'left';
        }
    }

    fireBomb() {
        var bomb = this.bombs.create(this.player.x, this.player.y, 'bomb');


        if (this.playerLastDirection === 'right') {
            bomb.setVelocityX(450); // Adjust velocity as needed
        } else if (this.playerLastDirection === 'left') {
            bomb.setVelocityX(-450); // Adjust velocity as needed
        }
        bomb.setCollideWorldBounds(true);
        bomb.setBounce(0.90);
        bomb.allowGravity = false;
        bomb.setData('collisions', 0); // Custom data to track collisions with world bounds
        bomb.body.onWorldBounds = true;
        this.time.delayedCall(3000, () => {
            bomb.destroy(); // This disables and hides the bomb
            // If you want to completely destroy the bomb instead, use bomb.destroy();
        });
    }

    bombHitsStar(bomb, star) {
        bomb.destroy(); // Disable the bomb
        star.disableBody(true, true); // Destroy the star

        // Update the score
        this.score += 10; // Adjust scoring as desired
        this.scoreText.setText('Score: ' + this.score);
        if (this.stars.countActive(true) === 0) {
            //  A new batch of stars to collect
            this.stars.children.iterate(function (child) {

                child.enableBody(true, child.x, 0, true, true);

            });
        }
    }

    collideWithEnemy(player, star) {
        enemyCollisions++;
        if (enemyCollisions > 3) {
            endGame.call(this, 'ff0000', 'Game Over');
        }
        if (score > 0) {
            score -= 10;
            scoreText.setText('Score: ' + score);

            star.disableBody(true, true);
        } else {
            endGame.call(this, 'ff0000', 'Game Over');
        }
    }

    endGame(tint, message) {
        let fontSize = 150;
        let textPositionX = gameWidth / 2 - 350;
        let textPositionY = gameHeight / 2 - 125;
        if (gameWidth < 600) {
            fontSize = 50;
            textPositionX = gameWidth / 2 - 100;
            textPositionY = gameHeight / 2 - 50;
        }
        this.physics.pause();
        const numericTint = (typeof tint === 'string') ? parseInt(tint.replace(/^#/, ''), 16) : tint;
        player.setTint(numericTint);
        player.anims.play("turn");
        gameOver = true;
        this.add.text(textPositionX, textPositionY, message, {
            fontSize: `${fontSize}px`,
            fill: `#${tint}`,
        });
    }

    createLavaPatches(numberOfPatches) {
        const lavaPatches = this.physics.add.staticGroup(); // Use a static physics group for lava patches
        for (let i = 0; i < numberOfPatches; i++) {
            let randomX = Phaser.Math.Between(0, gameWidth);
            let attempts = 0; // Keep track of attempts to find a safe position
            // Ensure the lava patch does not appear too close to the player
            while ((Math.abs(randomX - (groundPositionX - 10)) < safeZone) && attempts < 10) {
                randomX = Phaser.Math.Between(0, gameWidth);
                attempts++;
            }
            // If a safe location is found, create the lava patch
            if (attempts < 10) {
                lavaPatches.create(randomX, groundPositionY - 17, null).setSize(60, 30).setVisible(false);
                this.add.rectangle(randomX, groundPositionY - 15, 60, 30, 0xff0000); // Add visual representation if needed
            }
        }
        return lavaPatches;
    }
    collideWithLava(player, lavaPatch) {
        endGame.call(this, 'ff0000', 'Game Over');
    }
}