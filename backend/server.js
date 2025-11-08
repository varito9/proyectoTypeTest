// REQUIREMENTS
const { error } = require("console");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const nodeEnv = process.env.NODE_ENV;
let port;
const corsOptions = {};

if (nodeEnv === "production") {
  console.log("Running in production mode");
  port = process.env.PORT || 3001; // El puerto interno para producción
  // En producción, solo permite peticiones desde la URL del frontend definida en .env
  corsOptions.origin = process.env.FRONTEND_URL;
} else {
  console.log("Running in development mode");
  port = 3001; // Puerto de desarrollo
  // En desarrollo, permite cualquier origen
  corsOptions.origin = "*";
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

app.get("/", (req, res) => res.send("Type Racer Royale backend ready 🏁"));

// DATA
let players = [];
let beingPlayed = false;
let gameConfig = {
  language: "cat",
};
let timer = null;
let gameStats = [
  { id: 0, textEntrat: "", indexParaulaActiva: 0 },
  { id: 1, textEntrat: "", indexParaulaActiva: 0 },
  { id: 2, textEntrat: "", indexParaulaActiva: 0 },
  { id: 3, textEntrat: "", indexParaulaActiva: 0 },
  { id: 4, textEntrat: "", indexParaulaActiva: 0 },
  { id: 5, textEntrat: "", indexParaulaActiva: 0 },
];
let spectators = [];

// Function to send the player list to all connected clients
function broadcastPlayerList() {
  io.emit("setPlayerList", players);
}

// Function to remove a player from the game (not used yet)
function deletePlayer(playerId) {
  if (!beingPlayed) return;

  const deletingPlayer = players.find((player) => player.id === playerId);
  if (!deletingPlayer) return;

  deletingPlayer.role = "spectator";
  broadcastPlayerList();
}

// Function to end the game and send the final ranking
// TODO: Add error-based ranking
function endGame() {
  beingPlayed = false;

  const ranking = [...players]
    .filter((player) => player.role !== "spectator")
    .sort((a, b) => b.points - a.points);

  io.emit("gameFinished", { ranking });
  clearTimeout(timer);
  //TODO: Escuchar tambien el evento timeEnded que envia el frontendpara terminar la partida, si los dos se ejecutan, se termina la partida
}

function enviarLlistatJugadors() {
  players.sort(compareFN);
  console.log(players);
  //Send the updateRanking to everyone
  io.emit("updateRanking", players);

  function compareFN(a, b) {
    if (a.points > b.points) {
      return -1;
    } else if (b.points > a.points) {
      return 1;
    } else if (a.points == b.points) {
      if (a.errors > b.errors) {
        return 1;
      } else if (b.errors > a.errors) {
        return -1;
      }
    }
  }
}

// Start listening for server connections
io.on("connection", (socket) => {
  console.log("Player connected");

  // When a user sends their name and ID
  socket.on("setPlayerName", ({ name, id }) => {
    if (!name || id === undefined) return;

    if (players.length >= 6) {
      socket.emit("gameFull", { message: "The lobby is already full." });
      return;
    }

    let role = "player";
    if (players.length === 0) {
      role = "admin";
    }

    const player = {
      // Player Info
      id: id,
      socketId: socket.id,
      name: name,
      role: role, // enum: 'admin', 'player', 'spectator'
      // States
      isReady: false,
      // Game Stats
      points: 0,
      errors: 0,
    };

    players.push(player);
    players.sort((a, b) => b.id - a.id);

    if (beingPlayed) {
      player.role = "spectator";
      spectators.push(player.id);
      io.to(player.socketId).emit("spectatorGameView", gameStats);
    }

    console.log(`User ${player.name} joined with id ${player.id}`);
    broadcastPlayerList(); // Send updated list to everyone
  });

  // Listen when the user marks themselves as ready
  socket.on("setIsReady", ({ id }) => {
    const changingPlayer = players.find((player) => player.id === id);
    if (!changingPlayer) return;

    changingPlayer.isReady = !changingPlayer.isReady;
    players = players.filter((player) => player.id !== changingPlayer.id);
    players.push(changingPlayer);
    players.sort((a, b) => b.id - a.id);

    console.log(
      `Player ${changingPlayer.name} ready: ${changingPlayer.isReady}`
    );
    broadcastPlayerList();
  });

  // Admin can configure the game in the lobby
  socket.on("configGame", ({ id, newConfig }) => {
    const admin = players.find(
      (player) => player.id === id && player.role === "admin"
    );
    if (!admin) return;

    gameConfig = newConfig;
    io.emit("gameConfigured", gameConfig);
  });

  // Listen when a player is expelled by their playerId
  socket.on("kickPlayer", ({ adminId, playerId }) => {
    const admin = players.find((p) => p.id === adminId && p.role === "admin");
    if (!admin) return;

    const kickedPlayer = players.find((p) => p.id === playerId);
    if (!kickedPlayer) return;

    // Notify the frontend that the player has been kicked
    io.to(kickedPlayer.socketId).emit("kicked");

    players = players.filter((p) => p.id !== playerId);
    console.log(`Player ${kickedPlayer.name} has been kicked by the admin`);
    broadcastPlayerList();
  });

  // Transfer admin rights to a selected user
  socket.on("transferAdmin", ({ adminId, newAdminId }) => {
    const currentAdmin = players.find(
      (p) => p.id === adminId && p.role === "admin"
    );
    const newAdmin = players.find((p) => p.id === newAdminId);

    if (!currentAdmin || !newAdmin) return;

    currentAdmin.role = "player";
    newAdmin.role = "admin";

    io.to(newAdmin.socketId).emit("youAreNowAdmin");

    console.log(
      `${currentAdmin.name} has transferred admin rights to ${newAdmin.name}`
    );
    broadcastPlayerList();
  });

  // Listen when the admin starts the game and set unready users as spectators
  socket.on("startGame", ({ id, tempsEstablert }) => {
    const admin = players.find((p) => p.id === id && p.role === "admin");
    if (!admin) return;

    beingPlayed = true;

    players.forEach((p) => {
      if (!p.isReady) p.role = "spectator";
    });

    spectators = players.filter((p) => p.role === "spectator").map((p) => p.id);
    const tempsDePartida = tempsEstablert || 60;

    gameStats = players
      .filter((p) => p.role !== "spectator")
      .map((p) => ({
        id: p.id,
        textEntrat: "",
        indexParaulaActiva: 0,
        paraules: [],
      }));

    gameConfig.time = tempsEstablert || 60;
    io.emit("gameStarted", { time: gameConfig.time });
    broadcastPlayerList();

    timer = setTimeout(() => {
      endGame();
    }, tempsDePartida * 1000);
  });
  //
  // Listen when points are added to a player
  socket.on("addPoints", ({ id }) => {
    console.log("sumemCorrecte");
    const player = players.find((p) => p.id === id);
    if (!player || player.role === "spectator") return;

    player.points++;
    enviarLlistatJugadors();
  });

  // Listen when errors are added to a player
  socket.on("addErrors", ({ id }) => {
    console.log("sumemError");
    const player = players.find((p) => p.id === id);
    if (!player || player.role === "spectator") return;

    player.errors++;
    enviarLlistatJugadors();
  });

  socket.on("playerGameStatus", ({ data }) => {
    //rep: {id: 0, textEntrat: '', indexParaulaActiva: 0}
    const newEntry = data;
    gameStats.forEach((player) => {
      if (player.id == newEntry.id) {
        player.textEntrat = newEntry.textEntrat;
        player.indexParaulaActiva = newEntry.indexParaulaActiva;
        player.paraules = newEntry.paraules;
      }
    });
    spectators.forEach((spectatorId) => {
      const spectatorPlayer = players.find((p) => p.id === spectatorId);
      if (spectatorPlayer) {
        io.to(spectatorPlayer.socketId).emit("spectatorGameView", gameStats);
      }
    });
  });
  //quan l'espectador canvia al jugador que vol mirar
  socket.on("spectatorChangeView", ({ id }) => {
    const player = players.find((p) => p.id === id);
    if (!player) return;

    if (!spectators.includes(player.id)) {
      spectators.push(player.id);
    }

    io.to(player.socketId).emit("spectatorGameView", gameStats);
  });

  /*gameStats = gameStats.filter((p) => p.id !== newEntry.id);
    gameStats.push(newEntry);
    gameStats.sort((a,b) => b.id - a.id) 
    /* Envio: [
      {id: 0, textEntrat: '', indexParaulaActiva: 0},
      {id: 1, textEntrat: '', indexParaulaActiva: 0},
      {id: 2, textEntrat: '', indexParaulaActiva: 0},
      {id: 3, textEntrat: '', indexParaulaActiva: 0}
    ]*/

  socket.on("disconnect", () => {
    const player = players.find((p) => p.socketId === socket.id);
    if (!player) return;

    console.log(`Player ${player.name} disconnected`);

    if (player.role === "admin") {
      const newAdmin = players.find((p) => p.id !== player.id);
      if (newAdmin) {
        newAdmin.role = "admin";
        io.to(newAdmin.socketId).emit("youAreNowAdmin"); // opcional

        console.log(`new admin ${newAdmin.name}`);
      }
    }
    // Lógica de reasignar admin y eliminar jugador
    players = players.filter((p) => p.socketId !== socket.id);
    spectators = spectators.filter((sid) => sid !== player.id);
    broadcastPlayerList();
  });

  // Listen when a user wants to play again after a match
  socket.on("playAgain", ({ id }) => {
    const player = players.find((p) => p.id === id);
    if (!player) return;

    player.isReady = false;
    player.points = 0;
    player.role = "player";
    spectators = spectators.filter((sid) => sid !== id);

    broadcastPlayerList();
  });
});

server.listen(port, () => console.log(`Server listening on port ${port}`));
