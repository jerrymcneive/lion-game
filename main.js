// Phaser 3 game: Cowardly Lion Builder with Pixel Font and CRT Overlay
import Phaser from 'phaser';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.courage = 0;
    this.partIndex = 0;
    this.skyColor = 0x000000;
    this.partTypes = ['lionHead', 'lionArmor', 'lionClaw'];
  }

  preload() {
    this.load.image(
      'background',
      'https://labs.phaser.io/assets/skies/space3.png'
    );
    this.load.image(
      'base',
      'https://labs.phaser.io/assets/sprites/platform.png'
    );
    this.load.image(
      'lionHead',
      'https://labs.phaser.io/assets/sprites/yellow_ball.png'
    );
    this.load.image(
      'lionArmor',
      'https://labs.phaser.io/assets/sprites/red_ball.png'
    );
    this.load.image(
      'lionClaw',
      'https://labs.phaser.io/assets/sprites/blue_ball.png'
    );
    this.load.image(
      'fog',
      'https://labs.phaser.io/assets/particles/smoke-puff.png'
    );
    this.load.image(
      'flash',
      'https://labs.phaser.io/assets/particles/yellow.png'
    );
    this.load.image(
      'roarMeter',
      'https://labs.phaser.io/assets/sprites/purple_ball.png'
    );
    this.load.image(
      'crtOverlay',
      'https://labs.phaser.io/assets/skies/uv-grid-diag.png'
    ); // Placeholder for CRT scanline effect
    this.load.audio(
      'thunder',
      'https://labs.phaser.io/assets/audio/SoundEffects/thunder.ogg'
    );
    this.load.audio(
      'witch',
      'https://labs.phaser.io/assets/audio/SoundEffects/evil_laugh.ogg'
    );
    this.load.audio(
      'roar',
      'https://labs.phaser.io/assets/audio/SoundEffects/roar1.ogg'
    );
    this.load.bitmapFont(
      'pixelFont',
      'https://labs.phaser.io/assets/fonts/bitmap/font.png',
      'https://labs.phaser.io/assets/fonts/bitmap/font.fnt'
    );
  }

  create() {
    this.cameras.main.setBackgroundColor(this.skyColor);
    this.background = this.add.image(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'background'
    );

    this.base = this.physics.add
      .staticImage(100, 550, 'base')
      .setScale(2, 0.5)
      .refreshBody();

    this.courageText = this.add.bitmapText(
      16,
      16,
      'pixelFont',
      'Courage: 0',
      16
    );
    this.roarMeter = this.add
      .image(750, 50, 'roarMeter')
      .setScale(1)
      .setAlpha(0.3);

    this.parts = this.physics.add.group();

    this.input.on('pointerdown', this.dropPart, this);

    this.fogGroup = this.add.group();
    for (let i = 0; i < 20; i++) {
      const fog = this.add.image(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        'fog'
      );
      fog.setAlpha(0.4);
      this.fogGroup.add(fog);
    }

    this.flash = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'flash')
      .setAlpha(0);
    this.thunderSound = this.sound.add('thunder');
    this.time.addEvent({
      delay: 6000,
      callback: () => {
        this.flash.setAlpha(1);
        this.cameras.main.shake(200, 0.01);
        this.thunderSound.play();
        this.time.delayedCall(100, () => this.flash.setAlpha(0));
      },
      loop: true,
    });

    this.witchSound = this.sound.add('witch');
    this.time.addEvent({
      delay: Phaser.Math.Between(10000, 20000),
      callback: () => this.witchSound.play(),
      loop: true,
    });

    this.roarSound = this.sound.add('roar');

    // CRT-style overlay
    this.crtOverlay = this.add.image(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'crtOverlay'
    );
    this.crtOverlay.setAlpha(0.15);
    this.crtOverlay.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
  }

  dropPart(pointer) {
    if (this.partIndex >= 5) return;

    const type = this.partTypes[this.partIndex % this.partTypes.length];
    const part = this.parts.create(pointer.x, pointer.y, type).setInteractive();
    part.setCollideWorldBounds(true);
    part.setBounce(0.2);
    part.setDrag(100);
    this.input.setDraggable(part);

    this.physics.add.collider(part, this.base);
    this.physics.add.collider(part, this.parts);

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (gameObject.y < 400) {
        this.increaseCourage();
      }
    });

    this.partIndex++;
  }

  increaseCourage() {
    this.courage += 1;
    this.courageText.setText('Courage: ' + this.courage);

    const fogToRemove = this.fogGroup.getChildren().slice(0, 4);
    fogToRemove.forEach((fog) => fog.destroy());

    this.skyColor = Phaser.Display.Color.IntegerToColor(this.skyColor).brighten(
      20
    ).color;
    this.cameras.main.setBackgroundColor(this.skyColor);

    this.roarMeter.setAlpha(0.3 + this.courage * 0.1);
    this.tweens.add({
      targets: this.roarMeter,
      scale: { from: 1, to: 1.5 },
      duration: 200,
      yoyo: true,
    });
    this.cameras.main.shake(100, 0.005);
    this.roarSound.play();

    if (this.courage >= 5) {
      this.scene.start('WinScene');
    }
  }
}

class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    this.add
      .bitmapText(
        200,
        300,
        'pixelFont',
        'The sun shines and the road glows!\nROOOOAR!!',
        16
      )
      .setTint(0xffff00);
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [GameScene, WinScene],
};

const game = new Phaser.Game(config);
