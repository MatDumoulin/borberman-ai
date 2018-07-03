class Utils {
    /**
     * Returns true if positions are equal.
     */
    static comparePositions(pos1, pos2) {
        return pos1.x == pos2.x && pos1.y == pos2.y;
    }

    /**
     * Convert bitmap pixels position to entity on grid position.
     */
    static convertToEntityPosition(pixels, tileSize) {
        var position = {};
        position.x = Math.round(pixels.x / tileSize);
        position.y = Math.round(pixels.y / tileSize);
        return position;
    }

    /**
     * Convert entity on grid position to bitmap pixels position.
     */
    static convertToBitmapPosition(entity, tileSize) {
        var position = {};
        position.x = entity.x * tileSize;
        position.y = entity.y * tileSize;
        return position;
    }

    /**
     * Removes an item from array.
     */
    static removeFromArray(array, item) {
        for (var i = 0; i < array.length; i++) {
            if (item == array[i]) {
                array.splice(i, 1);
            }
        }
        return array;
    }
}

module.exports = Utils;
