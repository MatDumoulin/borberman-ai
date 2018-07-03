const ActionBuffer = require('./ActionBuffer');
const Entity = require('./Entity');
const Utils = require('./Utils');

class Player extends Entity {

    constructor(id, gameEngine) {
        super();

        this.id = id;

        /**
         * Moving speed
         */
        this.velocity = 2;

        /**
         * Max number of bombs user can spawn
         */
        this.bombsMax = 1;

        /**
         * How far the fire reaches when bomb explodes
         */
       this.bombStrength = 1;

        /**
         * Entity position on map grid
         */
        this.position = {};

        /**
         * Entity position on map grid
         */
        this.pixelPosition = {};

        /**
         * Bitmap dimensions
         */
        this.size = {
            w: 48,
            h: 48
        };

        this.alive = true;

        this.bombs = [];

        this.actionBuffer = new ActionBuffer();

        /**
         * Bomb that player can escape from even when there is a collision
         */
        this.escapeBomb = null;

        this.gameEngine = gameEngine;
    }

    init(position) {
        this.position = position;
        const pixels = Utils.convertToBitmapPosition(position, this.gameEngine.tileSize);
        this.pixelPosition = {
            x: pixels.x,
            y: pixels.y
        };
    }

    plantBomb() {
        // Subscribe to bombs spawning
        if (!(this instanceof Bot)) {
            // Check whether there is already bomb on this position
            for (let i = 0; i < this.gameEngine.bombs.length; i++) {
                const bomb = this.gameEngine.bombs[i];
                if (Utils.comparePositions(bomb.position, this.position)) {
                    return;
                }
            }
            // Counting the current number of bombs that are planted by the user.
            const unexplodedBombs = 0;
            for (const bomb of this.bombs) {
                if (!bomb.exploded) {
                    unexplodedBombs++;
                }
            }
            // If there are bombs left in its inventory
            if (unexplodedBombs < this.bombsMax) {
                // Plant the bomb.
                const bomb = new Bomb(this.position, this.bombStrength);
                this.bombs.push(bomb);
                this.gameEngine.bombs.push(bomb);

                bomb.setExplodeListener(() => {
                    Utils.removeFromArray(this.bombs, bomb);
                });
            }
        }
    }

    update() {
        if (!this.alive) {
            return;
        }
        if (this.gameEngine.paused) {
            return;
        }
        const position = { x: this.pixelPosition.x, y: this.pixelPosition.y };

        let dirX = 0;
        let dirY = 0;

        for(const action of this.actionBuffer.possibleActions) {
            if(this.actionBuffer.actions[action]) {
                if(action === ActionBuffer.UP) {
                    position.y -= this.velocity;
                    dirY = -1;
                } else if(action === ActionBuffer.DOWN) {
                    position.y += this.velocity;
                    dirY = 1;
                } else if(action === ActionBuffer.LEFT) {
                    position.x -= this.velocity;
                    dirX = -1;
                } else if(action === ActionBuffer.RIGHT) {
                    position.x += this.velocity;
                    dirX = 1;
                } else if(action === ActionBuffer.BOMB) {
                    this.plantBomb();
                }
            }
        }
/*         if (gInputEngine.actions[this.controls.up]) {

        } else if (gInputEngine.actions[this.controls.down]) {
            position.y += this.velocity;
            dirY = 1;
        } else if (gInputEngine.actions[this.controls.left]) {
            position.x -= this.velocity;
            dirX = -1;
        } else if (gInputEngine.actions[this.controls.right]) {
            position.x += this.velocity;
            dirX = 1;
        } */

        if (position.x != this.pixelPosition.x || position.y != this.pixelPosition.y) {
            if (!this.detectBombCollision(position)) {
                if (this.detectWallCollision(position)) {
                    // If we are on the corner, move to the aisle
                    const cornerFix = this.getCornerFix(dirX, dirY);
                    if (cornerFix) {
                        let fixX = 0;
                        let fixY = 0;
                        if (dirX) {
                            fixY = (cornerFix.y - this.pixelPosition.y) > 0 ? 1 : -1;
                        } else {
                            fixX = (cornerFix.x - this.pixelPosition.x) > 0 ? 1 : -1;
                        }
                        this.pixelPosition.x += fixX * this.velocity;
                        this.pixelPosition.y += fixY * this.velocity;
                        this.updatePosition();
                    }
                } else {
                    this.pixelPosition.x = position.x;
                    this.pixelPosition.y = position.y;
                    this.updatePosition();
                }
            }
        }

        if (this.detectFireCollision()) {
            this.die();
        }

        this.handleBonusCollision();
    }

    /**
     * Checks whether we are on corner to target position.
     * Returns position where we should move before we can go to target.
     */
    getCornerFix(dirX, dirY) {
        const edgeSize = 30;

        // fix position to where we should go first
        let position = {};

        // possible fix position we are going to choose from
        const pos1 = { x: this.position.x + dirY, y: this.position.y + dirX };
        const bmp1 = Utils.convertToBitmapPosition(pos1, this.gameEngine.tileSize);

        const pos2 = { x: this.position.x - dirY, y: this.position.y - dirX };
        const bmp2 = Utils.convertToBitmapPosition(pos2, this.gameEngine.tileSize);

        // in front of current position
        if (this.gameEngine.getTileMaterial({ x: this.position.x + dirX, y: this.position.y + dirY }) == 'grass') {
            position = this.position;
        }
        // right bottom
        // left top
        else if (this.gameEngine.getTileMaterial(pos1) == 'grass'
            && Math.abs(this.pixelPosition.y - bmp1.y) < edgeSize && Math.abs(this.pixelPosition.x - bmp1.x) < edgeSize) {
            if (this.gameEngine.getTileMaterial({ x: pos1.x + dirX, y: pos1.y + dirY }) == 'grass') {
                position = pos1;
            }
        }
        // right top
        // left bottom
        else if (this.gameEngine.getTileMaterial(pos2) == 'grass'
            && Math.abs(this.pixelPosition.y - bmp2.y) < edgeSize && Math.abs(this.pixelPosition.x - bmp2.x) < edgeSize) {
            if (this.gameEngine.getTileMaterial({ x: pos2.x + dirX, y: pos2.y + dirY }) == 'grass') {
                position = pos2;
            }
        }

        if (position.x &&  this.gameEngine.getTileMaterial(position) == 'grass') {
            return Utils.convertToBitmapPosition(position, this.gameEngine.tileSize);
        }
    }

    /**
     * Calculates and updates entity position according to its actual bitmap position
     */
    updatePosition() {
        this.position = Utils.convertToEntityPosition(this.pixelPosition, this.gameEngine.tileSize);
    }

    /**
     * Returns true when collision is detected and we should not move to target position.
     */
    detectWallCollision(position) {
        const player = {};
        player.left = position.x;
        player.top = position.y;
        player.right = player.left + this.size.w;
        player.bottom = player.top + this.size.h;

        // Check possible collision with all wall and wood tiles
        const tiles = this.gameEngine.tiles;
        for (let i = 0; i < tiles.length; i++) {
            const tilePosition = tiles[i].position;

            const tile = {};
            tile.left = tilePosition.x * this.gameEngine.tileSize + 25;
            tile.top = tilePosition.y * this.gameEngine.tileSize + 20;
            tile.right = tile.left + this.gameEngine.tileSize - 30;
            tile.bottom = tile.top + this.gameEngine.tileSize - 30;

            if(this.gameEngine.intersectRect(player, tile)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns true when the bomb collision is detected and we should not move to target position.
     */
    detectBombCollision(pixels) {
        const position = Utils.convertToEntityPosition(pixels, this.gameEngine.tileSize);

        for (let i = 0; i < this.gameEngine.bombs.length; i++) {
            const bomb = this.gameEngine.bombs[i];
            // Compare bomb position
            if (bomb.position.x == position.x && bomb.position.y == position.y) {
                // Allow to escape from bomb that appeared on my field
                if (bomb == this.escapeBomb) {
                    return false;
                } else {
                    return true;
                }
            }
        }

        // I have escaped already
        if (this.escapeBomb) {
            this.escapeBomb = null;
        }

        return false;
    }

    detectFireCollision() {
        for (let i = 0; i < this.gameEngine.bombs.length; i++) {
            const bomb = this.gameEngine.bombs[i];
            for (let j = 0; j < bomb.fires.length; j++) {
                const fire = bomb.fires[j];
                const collision = bomb.exploded && fire.position.x == this.position.x && fire.position.y == this.position.y;
                if (collision) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Checks whether we have got bonus and applies it.
     */
    handleBonusCollision() {
        for (let i = 0; i < this.gameEngine.bonuses.length; i++) {
            const bonus = this.gameEngine.bonuses[i];
            if (Utils.comparePositions(bonus.position, this.position)) {
                this.applyBonus(bonus);
                bonus.destroy();
            }
        }
    }

    /**
     * Applies bonus.
     */
    applyBonus(bonus) {
        if (bonus.type == 'speed') {
            this.velocity += 0.8;
        } else if (bonus.type == 'bomb') {
            this.bombsMax++;
        } else if (bonus.type == 'fire') {
            this.bombStrength++;
        }
    }

    die() {
        this.alive = false;

        if (this.gameEngine.countPlayersAlive() == 1 && this.gameEngine.playersCount == 2) {
            this.gameEngine.gameOver('win');
        } else if (this.gameEngine.countPlayersAlive() == 0) {
            this.gameEngine.gameOver('lose');
        }
    }

    getSerializedState() {
        return {
            id: this.id,
            velocity: this.velocity,
            bombsMax: this.bombsMax,
            bombStrength: this.bombStrength,
            position: this.position,
            pixelPosition: this.pixelPosition,
            size: this.size,
            alive: this.alive,
            bombs: this.bombs,
            actionBuffer: this.actionBuffer,
            escapeBomb: this.escapeBomb
        };
    }
}

module.exports = Player;
