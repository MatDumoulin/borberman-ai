allMoves = [ 
    [0,-1], // Up
    [0,1],  // Down
    [-1,0], // Left
    [1,0]   // Right
];

TargetHeuristique = Class.extend({
    bonusScore: 4,
    destroyableScore: 1,

    evaluateTarget: function(gameEngine, target) {
        let score = 0;
        let destroyableCount = 0;
        
        // If there is a bonus at the target position,
        if(gameEngine.bonuses.findIndex( bonus => bonus.position.x === target.x && bonus.position.y === target.y)) {
            score += this.bonusScore;
        }

        // Count the number of destroyable cell in the surrounding.
        destroyableCount = this.getSurroundingTiles(gameEngine, target).reduce( (accumulator, currentTile) => {
            if(currentTile && currentTile.material === 'wall') {
                return accumulator + 1;
            }

            return accumulator;
        }, 0);

        score += destroyableCount * this.destroyableScore;

        return score;
    },

    getSurroundingTiles: function(gameEngine, position) {
        const surroundingTiles = [];
        let newPos = {x: -1, y: -1};
        for(const move of allMoves) {
            newPos.x = position.x + move[0];
            newPos.y = position.y + move[1];

            // Only get the tiles that are in the map.
            if(newPos.x >= 0 && newPos.y >= 0 && gameEngine.tilesX > newPos.x && gameEngine.tilesY > newPos.y) {
                surroundingTiles.push( gameEngine.getTile(newPos) );
            }
        }

        return surroundingTiles;
    }
});