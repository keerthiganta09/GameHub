const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const rooms = {};


io.on("connection", (socket) => {

    console.log("Player connected:", socket.id);


    // Create Room
    socket.on("createRoom", ({ roomCode, playerName }) => {

        if (rooms[roomCode]) {
            socket.emit("roomError", "Room already exists!");
            return;
        }

        rooms[roomCode] = {
            players: [
                {
                    id: socket.id,
                    name: playerName,
                    score: 0
                }
            ],
            choices: {}
        };

        socket.join(roomCode);

        socket.emit("roomCreated", {
            roomCode: roomCode
        });

        console.log(
            `${playerName} created room ${roomCode}`
        );

    });


    // Join Room
    socket.on("joinRoom", ({ roomCode, playerName }) => {

        const room = rooms[roomCode];

        if (!room) {
            socket.emit("roomError", "Room not found!");
            return;
        }

        if (room.players.length >= 2) {
            socket.emit("roomError", "Room is full!");
            return;
        }

        room.players.push({
            id: socket.id,
            name: playerName,
            score: 0
        });

        socket.join(roomCode);

        io.to(roomCode).emit("gameStart", {
            players: room.players
        });

        console.log(
            `${playerName} joined room ${roomCode}`
        );

    });


    // Player Choice
    socket.on("playerChoice", ({ roomCode, choice }) => {

        const room = rooms[roomCode];

        if (!room) return;

        room.choices[socket.id] = choice;

        const choices = room.choices;

        if (Object.keys(choices).length === 2) {

            const player1 = room.players[0];
            const player2 = room.players[1];

            const choice1 = choices[player1.id];
            const choice2 = choices[player2.id];

            let result = "draw";


            if (
                (choice1 === "rock" && choice2 === "scissors") ||
                (choice1 === "paper" && choice2 === "rock") ||
                (choice1 === "scissors" && choice2 === "paper")
            ) {
                result = "player1";
                player1.score++;
            }

            else if (choice1 !== choice2) {
                result = "player2";
                player2.score++;
            }


            io.to(roomCode).emit("roundResult", {

                choice1: choice1,
                choice2: choice2,
                result: result,

                players: room.players

            });


            // Reset choices for next round
            room.choices = {};

        }

    });


    // Disconnect
    socket.on("disconnect", () => {

        console.log("Player disconnected:", socket.id);

        for (const roomCode in rooms) {

            const room = rooms[roomCode];

            const playerIndex = room.players.findIndex(
                player => player.id === socket.id
            );

            if (playerIndex !== -1) {

                room.players.splice(playerIndex, 1);

                room.choices = {};

                socket.to(roomCode).emit(
                    "opponentLeft",
                    "Your opponent left the game."
                );

                if (room.players.length === 0) {
                    delete rooms[roomCode];
                }

                break;
            }

        }

    });

});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(
        `GameHub server running on port ${PORT}`
    );
});
