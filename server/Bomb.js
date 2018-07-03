const Entity = require('./Entity');
const gameEngine = require('./GameEngine');
const Utils = require('./Utils');

class Bomb extends Entity {

    constructor() {
        /**
         * Entity position on map grid
         */
        this.position = {};

        /**
         * How far the fire reaches when bomb explodes
         */
        this.strength = 1;

        /**
         * Bitmap dimensions
         */
        this.size = {
            w: 28,
            h: 28
        };

        /**
         * Bitmap animation
         */
/*         this.bmp = null; */


        /**
         * Max timer value in seconds
         */
        this.timerMax = 2;

        this.exploded = false;

        this.fires = [];

        this.explodeListener = null;
    }

    init(position, strength) {
        this.strength = strength;

/*         var spriteSheet = new createjs.SpriteSheet({
            images: [gGameEngine.bombImg],
            frames: {
                width: this.size.w,
                height: this.size.h,
                regX: 5,
                regY: 5
            },
            animations: {
                idle: [0, 4, "idle", 0.2]
            }
        });
        this.bmp = new createjs.Sprite(spriteSheet);
        this.bmp.gotoAndPlay('idle'); */

        this.position = position;

/*         var pixels = Utils.convertToBitmapPosition(position);
        this.bmp.x = pixels.x + this.size.w / 4;
        this.bmp.y = pixels.y + this.size.h / 4; */

        this.fires = [];

        // Allow players and bots that are already on this position to escape
        const players = gameEngine.getPlayersAndBots();
        for (const player of players) {
            if (Utils.comparePositions(player.position, this.position)) {
                player.escapeBomb = this;
            }
        }

        setTimeout(() => this.explode, this.timerMax * 1000);
    }

    update() {
        if (this.exploded) { return; }
    }

    explode() {
        this.exploded = true;

        // Fire in all directions!
        const positions = this.getDangerPositions();
        for (const position of positions) {
            this.fire(position);

            const material = gameEngine.getTileMaterial(position);
            if (material == 'wood') {
                const tile = gameEngine.getTile(position);
                tile.remove();
            } else if (material == 'grass') {
                // Explode bombs in fire
                for (const bomb of gameEngine.bombs) {
                    if (!bomb.exploded
                        && Utils.comparePositions(bomb.position, position)) {
                        bomb.explode();
                    }
                }
            }
        }

        this.remove();
    }

    /**
     * Returns positions that are going to be covered by fire.
     */
    getDangerPositions() {
        const positions = [];
        positions.push(this.position);

        let dirX;
        let dirY;
        for (const i = 0; i < 4; i++) {
            if (i == 0) { dirX = 1; dirY = 0; }
            else if (i == 1) { dirX = -1; dirY = 0; }
            else if (i == 2) { dirX = 0; dirY = 1; }
            else if (i == 3) { dirX = 0; dirY = -1; }

            for (let j = 1; j <= this.strength; j++) {
                let explode = true;
                let last = false;

                const position = { x: this.position.x + j * dirX, y: this.position.y + j * dirY };


                const material = gameEngine.getTileMaterial(position);
                if (material == 'wall') { // One can not simply burn the wall
                    explode = false;
                    last = true;
                } else if (material == 'wood') {
                    explode = true;
                    last = true;
                }

                if (explode) {
                    positions.push(position);
                }

                if (last) {
                    break;
                }
            }
        }

        return positions;
    }

    fire(position) {
        const fire = new Fire(position, this);
        this.fires.push(fire);
    }

    remove() {
        // gGameEngine.stage.removeChild(this.bmp);
    }

    setExplodeListener(listener) {
        this.explodeListener = listener;
    }
}

module.exports = Bomb;
