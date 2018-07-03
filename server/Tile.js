class Tile {
    /**
     * Entity position on map grid
     */
    position = {};

    size = {
        w: 32,
        h: 32
    };

    material = '';

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
