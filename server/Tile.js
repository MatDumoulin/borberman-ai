class Tile {

    constructor() {
        /**
         * Entity position on map grid
         */
        this.position = {};

        this.size = {
            w: 32,
            h: 32
        };

        this.material = '';
    }

    init(material, position) {
        this.material = material;
        this.position = position;
    }

    update() {
    }

    remove(gameEngine) {
        for (let i = 0; i < gameEngine.tiles.length; i++) {
            const tile = gameEngine.tiles[i];
            if (this == tile) {
                gameEngine.tiles.splice(i, 1);
            }
        }
    }
}

module.exports = Tile;
