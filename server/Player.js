const gameEngine = require('./GameEngine');

class Player extends Entity {
    id = 0;

    /**
     * Moving speed
     */
    velocity = 2;

    /**
     * Max number of bombs user can spawn
     */
    bombsMax = 1;

    /**
     * How far the fire reaches when bomb explodes
     */
    bombStrength = 1;

    /**
     * Entity position on map grid
     */
    position = {};

    /**
     * Entity position on map grid
     */
    pixelPosition = {};

    /**
     * Bitmap dimensions
     */
    size = {
        w: 48,
        h: 48
    };

    alive = true;

    bombs = [];

    controls = {
        'up': 'up',
        'left': 'left',
        'down': 'down',
        'right': 'right',
        'bomb': 'bomb'
    };

    /**
     * Bomb that player can escape from even when there is a collision
     */
    escapeBomb = null;

    deadTimer = 0;

    init(position, controls, id) {
        if (id) {
            this.id = id;
        }

        if (controls) {
            this.controls = controls;
        }

        this.position = position;
        const pixels = Utils.convertToBitmapPosition(position, gameEngine.tileSize);
        this.pixelPosition = {
            x: pixels.x,
            y: pixels.y
        };

        this.bombs = [];
        this.setBombsListener();
    }

    setBombsListener() {
        // Subscribe to bombs spawning
        if (!(this instanceof Bot)) {
            gInputEngine.addListener(this.controls.bomb, () => {
                // Check whether there is already bomb on this position
                for (let i = 0; i < gameEngine.bombs.length; i++) {
                    const bomb = gameEngine.bombs[i];
                    if (Utils.comparePositions(bomb.position, this.position)) {
                        return;
                    }
                }

                const unexplodedBombs = 0;
                for (let i = 0; i < this.bombs.length; i++) {
                    if (!this.bombs[i].exploded) {
                        unexplodedBombs++;
                    }
                }

                if (unexplodedBombs < this.bombsMax) {
                    const bomb = new Bomb(this.position, this.bombStrength);
                    this.bombs.push(bomb);
                    gameEngine.bombs.push(bomb);

                    bomb.setExplodeListener(() => {
                        Utils.removeFromArray(this.bombs, bomb);
                    });
                }
            });
        }
    }

    update() {
        if (!this.alive) {
            return;
        }
        if (gameEngine.menu.visible) {
            return;
        }
        const position = { x: this.pixelPosition.x, y: this.pixelPosition.y };

        let dirX = 0;
        let dirY = 0;
        if (gInputEngine.actions[this.controls.up]) {
            position.y -= this.velocity;
            dirY = -1;
        } else if (gInputEngine.actions[this.controls.down]) {
            position.y += this.velocity;
            dirY = 1;
        } else if (gInputEngine.actions[this.controls.left]) {
            position.x -= this.velocity;
            dirX = -1;
        } else if (gInputEngine.actions[this.controls.right]) {
            position.x += this.velocity;
            dirX = 1;
        }

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
        const bmp1 = Utils.convertToBitmapPosition(pos1, gameEngine.tileSize);

        const pos2 = { x: this.position.x - dirY, y: this.position.y - dirX };
        const bmp2 = Utils.convertToBitmapPosition(pos2, gameEngine.tileSize);

        // in front of current position
        if (gameEngine.getTileMaterial({ x: this.position.x + dirX, y: this.position.y + dirY }) == 'grass') {
            position = this.position;
        }
        // right bottom
        // left top
        else if (gameEngine.getTileMaterial(pos1) == 'grass'
            && Math.abs(this.pixelPosition.y - bmp1.y) < edgeSize && Math.abs(this.pixelPosition.x - bmp1.x) < edgeSize) {
            if (gameEngine.getTileMaterial({ x: pos1.x + dirX, y: pos1.y + dirY }) == 'grass') {
                position = pos1;
            }
        }
        // right top
        // left bottom
        else if (gameEngine.getTileMaterial(pos2) == 'grass'
            && Math.abs(this.pixelPosition.y - bmp2.y) < edgeSize && Math.abs(this.pixelPosition.x - bmp2.x) < edgeSize) {
            if (gameEngine.getTileMaterial({ x: pos2.x + dirX, y: pos2.y + dirY }) == 'grass') {
                position = pos2;
            }
        }

        if (position.x &&  gameEngine.getTileMaterial(position) == 'grass') {
            return Utils.convertToBitmapPosition(position, gameEngine.tileSize);
        }
    }

    /**
     * Calculates and updates entity position according to its actual bitmap position
     */
    updatePosition() {
        this.position = Utils.convertToEntityPosition(this.pixelPosition, gameEngine.tileSize);
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
        const tiles = gameEngine.tiles;
        for (let i = 0; i < tiles.length; i++) {
            const tilePosition = tiles[i].position;

            const tile = {};
            tile.left = tilePosition.x * gameEngine.tileSize + 25;
            tile.top = tilePosition.y * gameEngine.tileSize + 20;
            tile.right = tile.left + gameEngine.tileSize - 30;
            tile.bottom = tile.top + gameEngine.tileSize - 30;

            if(gameEngine.intersectRect(player, tile)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns true when the bomb collision is detected and we should not move to target position.
     */
    detectBombCollision(pixels) {
        const position = Utils.convertToEntityPosition(pixels, gameEngine.tileSize);

        for (let i = 0; i < gameEngine.bombs.length; i++) {
            const bomb = gameEngine.bombs[i];
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
        const bombs = gameEngine.bombs;
        for (let i = 0; i < bombs.length; i++) {
            const bomb = bombs[i];
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
        for (let i = 0; i < gameEngine.bonuses.length; i++) {
            const bonus = gameEngine.bonuses[i];
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

        if (gameEngine.countPlayersAlive() == 1 && gameEngine.playersCount == 2) {
            gameEngine.gameOver('win');
        } else if (gameEngine.countPlayersAlive() == 0) {
            gameEngine.gameOver('lose');
        }
    }
}

module.exports = Player;
