const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const gameEngine = require('./server/GameEngine');


io.on("connection", (client) => {
    console.log("Client connected!");

    client.on("ready", () => {
        gameEngine.addPlayer(client.id);
        console.log(`Player with id ${client.id} joined the game!`);
    });

    client.on("start", () => {
        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("started", gameState);
        console.log(`The game has started.`);
    });

    client.on("pause", () => {
        gameEngine.togglePause();
        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("paused", gameState);
    });

    client.on("restart", () => {
        gameEngine.restart();
        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("restarted", gameState);
    });

    /** Player moves */
    client.on("playerState", (playerState) => {
        console.log(`Client ${client.id} sent a new state`, playerState);

        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("stateChanged", gameState);
    });
    /* client.on("bomb", () => {
        console.log(`Client ${client.id} planted a bomb.`);

        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("stateChanged", gameState);
    });

    client.on("up", () => {
        console.log(`Client ${client.id} moved up.`);

        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("stateChanged", gameState);
    });

    client.on("down", () => {
        console.log(`Client ${client.id} moved down.`);

        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("stateChanged", gameState);
    });

    client.on("left", () => {
        console.log(`Client ${client.id} moved left.`);

        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("stateChanged", gameState);
    });

    client.on("right", () => {
        console.log(`Client ${client.id} moved right.`);

        const gameState = gameEngine.getSerializedState();
        io.sockets.emit("stateChanged", gameState);
    }); */

    client.on("disconnect", () => {
        // Remove player from game.
        console.log("Client disconnected!");
    });
});

app.use(express.static(__dirname));

server.listen(3000, () => {
    console.log("Example app listening on port 3000!");
});
