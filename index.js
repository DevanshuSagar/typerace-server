import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
    res.send("Server is up and running!");
});

app.use("/api/users", userRoutes);
app.use("/api/game", gameRoutes);

const games = {};

import getRandomWordsFromDB from "./services/textService.js";

io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("create-game", (gameSettings) => {
        const gameId = Math.random().toString(36).substring(2, 6).toUpperCase();
        games[gameId] = {
            id: gameId,
            players: [],
            status: "waiting",
            words: [],
            settings: gameSettings,
        };
        console.log(`Game created with ID: ${gameId}`);
        socket.emit("game-created", gameId);
    });

    socket.on("join-game", ({ gameId, username }) => {
        const game = games[gameId];
        if (game) {
            const playerExists = game.players.some(
                (player) => player.id === socket.id
            );
            if (!playerExists) {
                socket.join(gameId);
                socket.gameId = gameId;
                game.players.push({
                    id: socket.id,
                    username: username,
                    progress: 0,
                });
                console.log(`Player ${username} joined game ${gameId}`);
            }
            io.to(gameId).emit("game-update", game);
        } else {
            socket.emit("game-error", "Game not found.");
        }
    });

    socket.on("start-game", async (gameId) => {
        const game = games[gameId];
        if (game && game.players[0].id === socket.id) {
            try {
                const words = await getRandomWordsFromDB(game.settings);
                game.words = words;
                game.status = "inprogress";

                io.to(gameId).emit("game-update", game);
            } catch (error) {
                console.error("Failed to fetch game text:", error);
                io.to(gameId).emit("game-error", "Failed to start game.");
            }
        }
    });

    socket.on("update-settings", ({ gameId, newSettings }) => {
        const game = games[gameId];
        if (game && game.players[0]?.id === socket.id) {
            game.settings = newSettings;
            console.log(`Game ${gameId} settings updated by host.`);

            io.to(gameId).emit("game-update", game);
        }
    });

    socket.on("player-progress-update", ({ gameId, progress }) => {
        const game = games[gameId];
        if (game) {
            const player = game.players.find((p) => p.id === socket.id);
            if (player) {
                player.progress = progress;

                if (player.progress === game.words.length) {
                    // TODO for finish
                }

                io.to(gameId).emit("game-update", game);
            }
        }
    });

    socket.on("player-action", ({ gameId, action }) => {
        const game = games[gameId];
        if (game) {
            console.log(`Recived action in game ${gameId}:`, action);

            io.to(gameId).emit("game-update", game);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        const gameId = socket.gameId;

        if (gameId && games[gameId]) {
            const game = games[gameId];
            game.players = game.players.filter((p) => p.id !== socket.id);
            console.log(`Player ${socket.id} removed from game ${gameId}`);

            if (game.players.length === 0) {
                delete games[gameId];
                console.log(`Game ${gameId} is empty and has been closed.`);
            } else {
                io.to(gameId).emit("game-update", game);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
