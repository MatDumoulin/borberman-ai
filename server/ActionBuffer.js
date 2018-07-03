/**
 * Stores all the actions performed by a player.
 */
class ActionBuffer {
    static get UP() { return 'up' };
    static get DOWN() { return 'down' };
    static get LEFT() { return 'left' };
    static get RIGHT() { return 'right' };
    static get BOMB() { return 'bomb' };

    constructor() {
        /**
         * A dictionary mapping actions that might be taken in our game
         * to a boolean value indicating whether that action is currently being performed.
         */
        this.actions = {};

        this.possibleActions = [
            ActionBuffer.UP,
            ActionBuffer.DOWN,
            ActionBuffer.LEFT,
            ActionBuffer.RIGHT,
            ActionBuffer.BOMB,
        ];

        this.resetActions();
    }

    add(action) {
        this.actions[action] = true;
    }

    remove(action) {
        this.actions[action] = false;
    }

    resetActions() {
        for(const action of this.possibleActions) {
            this.actions[action] = false;
        }
    }
}

module.exports = ActionBuffer;
