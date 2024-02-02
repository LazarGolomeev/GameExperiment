import Phaser from 'phaser';
import sky from '../assets/newsky.png';
import platform from '../assets/platform.png';
import star from '../assets/star.png';
import bomb from '../assets/bomb.png';
import dude from '../assets/dude.png';
import untitled from '../assets/untitled.png';
import spritesheet from '../assets/spritesheet.png';

var config = {
    type: Phaser.AUTO,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 },
            debug: false,
            worldBoundsEvent: true
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    type: Phaser.AUTO,
    width: window.innerWidth, // Set initial width
    height: window.innerHeight, // Set initial height
    scale: {
        mode: Phaser.Scale.FIT, // Use FIT scale mode to adjust the game size
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
let starCount = 11;
let enemyCollisions = 0;
let playerLastDirection;

var game = new Phaser.Game(config);
const gameWidth = game.scale.width;
const gameHeight = game.scale.height;

const groundPositionX = gameWidth / 2;
const groundPositionY = gameHeight - 30;

function preload() {
    this.load.image("sky", sky);
    this.load.image("ground", platform, {
        frameWidth: 32,
        frameHeight: 48,
    });
    this.load.image("star", star);
    this.load.image("bomb", bomb);
    this.load.spritesheet("dude", dude, {
        frameWidth: 32,
        frameHeight: 48,
    });
}

function create() {
    console.log(gameWidth, gameHeight);


    //  A simple background for our game
    const sky = this.add.image(gameWidth, gameHeight, "sky").setScale(4);

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(groundPositionX, groundPositionY, gameWidth, 60, 0x009900);
    const lavaPatchets = createLavaPatches.call(this, 5);

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
    if(gameWidth < 800 && gameHeight > 600)
    {
        const thirdJumpingPlatform = platforms.create(firstJumpingPlatformPositionX, firstJumpingPlatformPositionY - 300, "ground");
        starCount = 7;
    }
    // platforms.create(groundPositionX, gameHeight / 2 - 100, "ground");
    // platforms.create(750, 220, "ground");
    platforms.add(ground);
    // platforms.create(400, 568, 50, 10).setScale(2).refreshBody();

    // The player and its settings
    player = this.physics.add.sprite(groundPositionX-10, gameHeight - 150, "dude");

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.body.setGravityY(1000);

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

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: "star",
        repeat: starCount,
        setXY: { x: 12, y: 0, stepX: 70 },
    });

    stars.children.iterate(function (child) {
        //  Give each star a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    bombs = this.physics.add.group();

    //  The score
    scoreText = this.add.text(16, 16, "score: 0", {
        fontSize: "32px",
        fill: "#000",
    });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    // this.physics.add.overlap(player, stars, collectStar, null, this);
    
    this.physics.add.collider(player, lavaPatchets, collideWithLava, null, this);
    this.physics.add.collider(player, stars, collideWithEnemy, null, this);
    // Add a key for firing bombs
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Add collider between bombs and stars
    this.physics.add.collider(bombs, stars, bombHitsStar, null, this);
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

function update() {
    var keys = this.input.keyboard.addKeys({
        up: "W",
        left: "A",
        down: "S",
        right: "D",
    });
    if (gameOver) {
        return;
    }

    if (cursors.left.isDown || keys.left.isDown) {
        player.setVelocityX(-300);

        player.anims.play("left", true);
    } else if (cursors.right.isDown || keys.right.isDown) {
        player.setVelocityX(300);

        player.anims.play("right", true);
    } else {
        player.setVelocityX(0);

        player.anims.play("turn");
    }

    if (
        (cursors.up.isDown || keys.up.isDown) &&
        player.body.touching.down
    ) {
        player.setVelocityY(-750);
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
        fireBomb.call(this);
    }
    if(score >= (starCount * 10)*1.5){
        endGame.call(this, '80ff80', 'You Win');
    }

    if(player.body.velocity.x > 0 ){
        playerLastDirection = 'right';
    }else if(player.body.velocity.x < 0){
        playerLastDirection = 'left';
    }

}

function fireBomb() {
    var bomb = bombs.create(player.x, player.y, 'bomb');
  
   
    if (playerLastDirection === 'right') {
        bomb.setVelocityX(450); // Adjust velocity as needed
    } else if (playerLastDirection === 'left'){
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

function bombHitsStar(bomb, star) {
    bomb.disableBody(true, true); // Disable the bomb
    star.disableBody(true, true); // Disable the star

    // Update the score
    score += 10; // Adjust scoring as desired
    scoreText.setText('Score: ' + score);
    if (stars.countActive(true) === 0)
    {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });
    }
}

function collideWithEnemy(player, star) {
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
function endGame(tint, message) {
    let fontSize = 150;
    let textPositionX = gameWidth/2 - 350;
    let textPositionY = gameHeight/2 - 125;
    if(gameWidth < 600){
        fontSize = 50;
        textPositionX = gameWidth/2 - 100;
        textPositionY = gameHeight/2 - 50;
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

function createLavaPatches(numberOfPatches) {
    // for (let i = 0; i < numberOfPatches; i++) {
    //     // Generate a random position for each lava patch
    //     let randomX = Phaser.Math.Between(0, gameWidth);

    //     // Create a lava patch at the generated position
    //     this.add.rectangle(randomX, groundPositionY -20, 60, 30, 0xff0000);
    // }
    const lavaPatches = this.physics.add.staticGroup(); // Use a static physics group for lava patches
    
    for (let i = 0; i < numberOfPatches; i++) {
        let randomX = Phaser.Math.Between(0, gameWidth);
        // let randomY = Phaser.Math.Between(0, gameHeight); // Adjust if you have a specific Y position in mind

        // Create a physics-enabled lava patch
        lavaPatches.create(randomX, groundPositionY -15, null).setSize(60, 30).setOffset(-30, -15).setVisible(false);
        this.add.rectangle(randomX, groundPositionY -15, 60, 30, 0xff0000); // Add visual representation if needed
    }

    return lavaPatches;
}

function collideWithLava(player, lavaPatch) {
    endGame.call(this, 'ff0000', 'Game Over');
}