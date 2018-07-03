const gameEngine = require('./GameEngine');

class Bonus extends Entity{

    constructor() {
        this.types = ['speed', 'bomb', 'fire'];

        this.type = '';
        this.position = {};
        this.pixelsPosition = null;
    }

    init(position, typePosition) {
        this.type = this.types[typePosition];

        this.position = position;

        this.pixelsPosition = {x: -1, y: -1};
        var pixels = Utils.convertToBitmapPosition(position, gameEngine);
        this.pixelsPosition.x = pixels.x;
        this.pixelsPosition.y = pixels.y;
    }

    destroy() {
        Utils.removeFromArray(gameEngine.bonuses, this);
    }
}

module.exports = Bonus;
