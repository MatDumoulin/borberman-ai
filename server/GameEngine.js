const Player = require('./Player');
const Tile = require('./Tile');

class GameEngine {
    constructor() {
        this.tileSize = 32;
        this.tilesX = 17;
        this.tilesY = 13;
        this.size = {};
        this.fps = 50;
        this.botsCount = 2; /* 0 - 3 */
        this.playersCount = 2; /* 1 - 2 */
        this.bonusesPercent = 16;

        this.players = [];
        this.bots = [];
        this.tiles = [];
        this.bombs = [];
        this.bonuses = [];
        this.winner = null; // When not null, the game is over.

        this.playing = false;
        this.paused = false;
        this.mute = false;
        this.soundtrackLoaded = false;
        this.soundtrackPlaying = false;
        this.soundtrack = null;
        // Socket communication
        this.socket = null;

        this.gameLoop = null;
    }

    init() {
        this.size = {
            w: this.tileSize * this.tilesX,
            h: this.tileSize * this.tilesY
        };
    }

    setup() {
        this.bombs = [];
        this.tiles = [];
        this.bonuses = [];

        // Render game board
        this.renderTiles();
        this.renderBonuses();

/*         this.spawnBots();*/
        this.spawnPlayers();

        // Start loop
        this.gameLoop = setInterval(() => this.update(), 1000 / this.fps);
/*         if (!createjs.Ticker.hasEventListener("tick")) {
            createjs.Ticker.addEventListener("tick", this.update);
            createjs.Ticker.setFPS(this.fps);
        } */
    }

    addPlayer(playerId) {
        this.players.push(new Player(playerId, this));
    }

    update() {
        // Skip the update if paused.
        if (this.paused) {
            return;
        }

        // Player
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            player.update();
        }

        // Bots
        for (let i = 0; i < this.bots.length; i++) {
            const bot = this.bots[i];
            bot.update();
        }

        // Bombs
        for (let i = 0; i < this.bombs.length; i++) {
            const bomb = this.bombs[i];
            bomb.update();
        }
    }

    renderTiles() {
        for (let i = 0; i < this.tilesY; i++) {
            for (let j = 0; j < this.tilesX; j++) {
                if (
                    i == 0 ||
                    j == 0 ||
                    i == this.tilesY - 1 ||
                    j == this.tilesX - 1 ||
                    (j % 2 == 0 && i % 2 == 0)
                ) {
                    // Wall tiles
                    const tile = new Tile("wall", { x: j, y: i });
                    this.tiles.push(tile);
                } else {
                    // Grass tiles
                    const tile = new Tile("grass", { x: j, y: i });

                    // Wood tiles
                    if (
                        !(i <= 2 && j <= 2) &&
                        !(i >= this.tilesY - 3 && j >= this.tilesX - 3) &&
                        !(i <= 2 && j >= this.tilesX - 3) &&
                        !(i >= this.tilesY - 3 && j <= 2)
                    ) {
                        const wood = new Tile("wood", { x: j, y: i });
                        this.tiles.push(wood);
                    }
                }
            }
        }
    }

    renderBonuses() {
        // Cache woods tiles
        const woods = [];
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            if (tile.material == "wood") {
                woods.push(tile);
            }
        }

        // Sort tiles randomly
        woods.sort(function() {
            return 0.5 - Math.random();
        });

        // Distribute bonuses to quarters of map precisely fairly
        for (let j = 0; j < 4; j++) {
            const bonusesCount = Math.round(
                (woods.length * this.bonusesPercent * 0.01) / 4
            );
            const placedCount = 0;
            for (let i = 0; i < woods.length; i++) {
                if (placedCount > bonusesCount) {
                    break;
                }

                const tile = woods[i];
                if (
                    (j == 0 &&
                        tile.position.x < this.tilesX / 2 &&
                        tile.position.y < this.tilesY / 2) ||
                    (j == 1 &&
                        tile.position.x < this.tilesX / 2 &&
                        tile.position.y > this.tilesY / 2) ||
                    (j == 2 &&
                        tile.position.x > this.tilesX / 2 &&
                        tile.position.y < this.tilesX / 2) ||
                    (j == 3 &&
                        tile.position.x > this.tilesX / 2 &&
                        tile.position.y > this.tilesX / 2)
                ) {
                    const typePosition = placedCount % 3;
                    const bonus = new Bonus(tile.position, typePosition);
                    this.bonuses.push(bonus);

                    placedCount++;
                }
            }
        }
    }

    /* spawnBots: function() {
            this.bots = [];

            if (this.botsCount >= 1) {
                const bot2 = new AdvancedBot({ x: 1, y: this.tilesY - 2 });
                this.bots.push(bot2);
            }

            if (this.botsCount >= 2) {
                var bot3 = new Bot({ x: this.tilesX - 2, y: 1 });
                this.bots.push(bot3);
            }

            if (this.botsCount >= 3) {
                var bot = new Bot({ x: this.tilesX - 2, y: this.tilesY - 2 });
                this.bots.push(bot);
            }

            if (this.botsCount >= 4) {
                var bot = new Bot({ x: 1, y: 1 });
                this.bots.push(bot);
            }
        },*/

        spawnPlayers() {
            if (this.players.length >= 1) {
                this.players[0].init({ x: 1, y: 1 });
            }

            if (this.players.length >= 2) {
                this.players[1].init({ x: this.tilesX - 2, y: this.tilesY - 2 });
            }
        }

    /**
     * Checks whether two rectangles intersect.
     */
    intersectRect(a, b) {
        return (
            a.left <= b.right &&
            b.left <= a.right &&
            a.top <= b.bottom &&
            b.top <= a.bottom
        );
    }

    /**
     * Returns tile at given position.
     */
    getTile(position) {
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            if (
                tile.position.x == position.x &&
                tile.position.y == position.y
            ) {
                return tile;
            }
        }
    }

    /**
     * Returns tile material at given position.
     */
    getTileMaterial(position) {
        const tile = this.getTile(position);
        return tile ? tile.material : "grass";
    }

/*     gameOver(status) {
        if (this.menu.visible) {
            return;
        }

        if (status == "win") {
            var winText = "You won!";
            if (this.playersCount > 1) {
                var winner = this.getWinner();
                winText = winner == 0 ? "Player 1 won!" : "Player 2 won!";
            }
            this.menu.show([
                { text: winText, color: "#669900" },
                { text: " ;D", color: "#99CC00" }
            ]);
        } else {
            this.menu.show([
                { text: "Game Over", color: "#CC0000" },
                { text: " :(", color: "#FF4444" }
            ]);
        }
    }
*/

    gameOver(status) {
        this.winner = getWinner();
    }

    getWinner() {
        let player = null;
        for (let i = 0; i < this.players.length; i++) {
            player = this.players[i];
            if (player.alive) {
                return i;
            }
        }
    }

    countPlayersAlive() {
        let playersAlive = 0;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].alive) {
                playersAlive++;
            }
        }
        return playersAlive;
    }

    getPlayersAndBots() {
        const players = [];

        for (let i = 0; i < this.players.length; i++) {
            players.push(this.players[i]);
        }

        for (let i = 0; i < this.bots.length; i++) {
            players.push(this.bots[i]);
        }

        return players;
    }

    getSerializedState() {
        let players = this.getPlayersAndBots();
        players = players.map(player => player.getSerializedState());

        return {
            players,
            bonuses: this.bonuses,
            tiles: this.tiles,
            tilesX: this.tilesX,
            tilesY: this.tilesY,
            paused: this.paused,
            winner: this.winner
        };
    }

    // Pauses the game.
    togglePause() {
        this.paused = !this.paused;
        console.log("Pause toggled", this.paused);
    }

    restart() {
        // gInputEngine.removeAllListeners();
        /* this.stage.removeAllChildren(); */
        console.log("Restart game");
        this.stopGameLoop();
        this.setup();
    }

    stopGameLoop() {
        if(this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    getPlayer(id) {
        return this.players.find(player => player.id === id);
    }
}

module.exports = new GameEngine();
