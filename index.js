const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const gameEngine = require('./server/GameEngine');


io.on("connection", (client) => {
    console.log("Client connected!");

    client.on("ready", () => {
        gameEngine.addPlayer(client.id);
    });

    client.on("start", () => {
        const gameState = gameEngine.getSerializedState();
        client.broadcast.emit("started", gameState);
    });

    client.on("pause", () => {
        gameEngine.togglePause();
        const gameState = gameEngine.getSerializedState();
        client.broadcast.emit("paused", gameState);
    });

    client.on("restart", () => {
        gameEngine.restart();
        const gameState = gameEngine.getSerializedState();
        client.broadcast.emit("restarted", gameState);
    });

    client.on("disconnect", () => {
        // Remove player from game.
        console.log("Client disconnected!");
    });
});

app.use(express.static(__dirname));

server.listen(3000, () => {
    console.log("Example app listening on port 3000!");
});
