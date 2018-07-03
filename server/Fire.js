const Entity = require('./Entity');
const gameEngine = require('./GameEngine');

class Fire extends Entity {

    constructor() {
        /**
         * Entity position on map grid
         */
        this.position = {};

        /**
         * Dimensions in map.
         */
        this.size = {
            w: 38,
            h: 38
        };

        /**
         * Bitmap animation
         */
        this.bmp = null;

        /**
         * The bomb that triggered this fire
         */
        this.bomb = null;
    }


    init(position, bomb) {
        this.bomb = bomb;

/*         var spriteSheet = new createjs.SpriteSheet({
            images: [gGameEngine.fireImg],
            frames: { width: this.size.w, height: this.size.h, regX: 0, regY: 0 },
            animations: {
                idle: [0, 5, null, 0.4],
            }
        }); */
        setTimeout(() => this.remove(), 400);

        this.position = position;
/*
        var pixels = Utils.convertToBitmapPosition(position);
        this.bmp.x = pixels.x + 2;
        this.bmp.y = pixels.y - 5;

        gGameEngine.stage.addChild(this.bmp); */
    }

    update() {
    }

    remove() {
        if (this.bomb.explodeListener) {
            this.bomb.explodeListener();
            this.bomb.explodeListener = null;
        }

/*         gGameEngine.stage.removeChild(this.bmp); */

        // Removes this fire line from the game since the explosion is over.
        for (let i = 0; i < this.bomb.fires.length; i++) {
            const fire = this.bomb.fires[i];
            if (this == fire) {
                this.bomb.fires.splice(i, 1);
            }
        }
        // Removes this bomb from the game since it has exploded.
        for (let i = 0; i < gameEngine.bombs.length; i++) {
            const bomb = gameEngine.bombs[i];
            if (this.bomb == bomb) {
                gameEngine.bombs.splice(i, 1);
            }
        }
    }
}

module.exports = Fire;
