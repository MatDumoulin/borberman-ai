SocketManager = Class.extend({

    socket: null,
    gameEngine: null,

    init: function(gameEngine) {
        this.gameEngine = gameEngine;

        this.socket = io('http://localhost:3000');
        // Wait for the communication with the server before showing the menu.
        console.log("Waiting for web socket...");
        this.listenOnSocket();
    },

    listenOnSocket: function() {
        this.socket.on('connect', () => {
            console.log("Socket is connected.");
            this.joinGame(); // Joins the current user to the game.
        });

        this.socket.on('paused', (gameState) => {
            console.log("Paused = ", gameState.paused);
            this.gameEngine.setPausedStatus(gameState.paused);
        });

        this.socket.on('restarted', (gameState) => {
            console.log("Restarted = ", gameState.paused);
        });

        this.socket.on('stateChanged', (gameState) => {
            console.log("State has changed = ", gameState);
        });

        this.socket.on('gameStateChanged', (gameState) => {
            console.log(gameState);
        });
    },

    joinGame: function() {
        this.socket.emit('ready');
    },

    togglePause: function() {
        this.socket.emit("pause");
    },

    restartGame: function() {
        this.socket.emit("restart");
    },

    sendPlayerState: function(playerState) {
        this.socket.emit("playerState", playerState);
    },

    plantBomb: function() {
        this.socket.emit("bomb");
    },

    moveUp: function() {
        this.socket.emit("up");
    },

    moveDown: function() {
        this.socket.emit("down");
    },

    moveLeft: function() {
        this.socket.emit("left");
    },

    moveRight: function() {
        this.socket.emit("right");
    },
});
