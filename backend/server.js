// REQUIREMENTS
const { error } = require("console");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get("/", (req, res) => res.send("Type Racer Royale backend ready 🏁"));

// DATA
let rooms = [];

//Funció per crear rooms
function createRoom(roomName, hostPlayer) {
  const room = {
    name: roomName,
    beingPlayed: false,
    config: { language: "cat", time: 5 },
    players: [hostPlayer],
    timer: null,
  };
  rooms.push(room);
  broadcastRoomList();
  return room;
}

// Trobar la Room per el seu nom
function findRoom(roomName) {
  return rooms.find((r) => r.name === roomName);
}

// Enviar l'estat actualitzar de la sala a tots en la sala
function broadcastRoomState(roomName) {
  const room = findRoom(roomName);
  if (room) {
    const { timer, ...roomState } = room;

    // Ahora emitimos el objeto 'roomState' limpio
    io.to(roomName).emit("updateRoomState", roomState);
  }
}

function broadcastRoomList() {
  const roomList = rooms.map((r) => ({
    name: r.name,
    playerCount: r.players.length,
    beingPlayed: r.beingPlayed,
  }));
  io.emit("roomList", roomList);
}

// Function to end the game and send the final ranking
// TODO: Add error-based ranking
function endGame(roomName) {
  const room = findRoom(roomName);
  if (!room) return;

  room.beingPlayed = false;

  const ranking = [...room.players]
    .filter((player) => player.role === "player")
    .sort((a, b) => b.points - a.points || a.errors - b.errors);

  io.to(roomName).emit("gameFinished", { ranking });

  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  } //TODO: Escuchar tambien el evento timeEnded que envia el frontendpara terminar la partida, si los dos se ejecutan, se termina la partida
  broadcastRoomState(roomName);
  broadcastRoomList();
}

/*
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
*/

//Canviem enviarLlistatJugadors per aquesta funció per a rooms
function broadcastRanking(roomName) {
  const room = findRoom(roomName);
  if (!room) return;

  const ranking = [...room.players]
    .filter((p) => p.role === "player")
    .sort((a, b) => b.points - a.points || a.errors - b.errors); //Aixó fa el mateix que compareFN ya que si b - a es igual 0 es sumen els

  io.to(roomName).emit("updateRanking", ranking);
}

// Start listening for server connections
io.on("connection", (socket) => {
  console.log("Player connected");

  // When a user sends their name and ID
  socket.on("setPlayerName", ({ name, id }) => {
    if (!name || id === undefined) return;

    socket.data.player = {
      // Player Info
      id: id,
      socketId: socket.id,
      name: name,
      role: "player", // enum: 'admin', 'player', 'spectator'
      // States
      isReady: false,
      // Game Stats
      points: 0,
      errors: 0,
    };

    console.log(`Jugador conectado: ${name} (${id})`);
    socket.emit("playerRegistered", socket.data.player);
  });

  socket.on("createRoom", ({ roomName }) => {
    const player = socket.data.player;

    if (!player) {
      return socket.emit("error", {
        message: "Jugador no registrado. Envía 'setPlayerName' primero.",
      });
    }

    if (findRoom(roomName)) {
      socket.emit("error", { message: "La sala ya existe." });
      return;
    }

    player.role = "admin";
    const room = createRoom(roomName, player);

    socket.join(roomName);
    broadcastRoomState(roomName);

    console.log(`${player.name} creó la sala ${roomName}`);
  });

  socket.on("joinRoom", ({ roomName }) => {
    const player = socket.data.player;

    if (!player) {
      return socket.emit("error", {
        message: "Jugador no registrado. Envía 'setPlayerName' primero.",
      });
    }

    const room = findRoom(roomName);
    if (!room) return socket.emit("error", { message: "Sala no encontrada" });

    if (room.players.length >= 6) {
      return socket.emit("error", { message: "La sala está plena" });
    }

    if (room.players.length === 0 && !room.beingPlayed) {
      player.role = "admin";
    }

    if (room.beingPlayed) {
      player.role = "spectator";
    }

    room.players.push(player);
    socket.join(roomName);

    broadcastRoomState(roomName);
    console.log(`${player.name} se unió a ${roomName}`);
  });

  socket.on("getRoomList", () => {
    broadcastRoomList();
  });

  // Listen when the user marks themselves as ready
  socket.on("setIsReady", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player) return;

    player.isReady = !player.isReady;
    broadcastRoomState(roomName);
  });

  // Admin can configure the game in the lobby
  socket.on("configGame", ({ roomName, id, newConfig }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find((p) => p.id === id && p.role === "admin");
    if (!admin) return;

    room.config = newConfig;
    broadcastRoomState(roomName);
  });

  // Listen when a player is expelled by their playerId
  socket.on("kickPlayer", ({ roomName, adminId, playerId }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find(
      (p) => p.id === adminId && p.role === "admin"
    );
    if (!admin) return;

    const kickedPlayer = room.players.find((p) => p.id === playerId);
    if (!kickedPlayer) return;

    io.to(kickedPlayer.socketId).emit("kicked");

    room.players = room.players.filter((p) => p.id !== playerId);
    broadcastRoomState(roomName);
  });

  // Transfer admin rights to a selected user
  socket.on("transferAdmin", ({ roomName, adminId, newAdminId }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const currentAdmin = room.players.find(
      (p) => p.id === adminId && p.role === "admin"
    );
    const newAdmin = room.players.find((p) => p.id === newAdminId);

    if (!currentAdmin || !newAdmin) return;

    currentAdmin.role = "player";
    newAdmin.role = "admin";

    io.to(newAdmin.socketId).emit("youAreNowAdmin");
    broadcastRoomState(roomName);
  });

  // Listen when the admin starts the game and set unready users as spectators
  socket.on("startGame", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find((p) => p.id === id && p.role === "admin");
    if (!admin) return;

    room.beingPlayed = true;

    room.players.forEach((p) => {
      if (p.id === admin.id) {
        p.isReady = true; // Forzarlo a 'listo'
        p.role = "admin"; // Asegurar que sigue siendo admin (y no espectador)
      }
      // Si es CUALQUIER OTRO jugador que no esté listo...
      else if (!p.isReady) {
        p.role = "spectator"; // Se convierte en espectador
      }
    });

    io.to(roomName).emit("gameStarted", { time: room.config.time });

    room.timer = setTimeout(() => {
      endGame(roomName);
    }, room.config.time * 1000);

    broadcastRoomState(roomName);
  });

  // Listen when points are added to a player
  socket.on("addPoints", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player || player.role === "spectator") return;

    player.points++;
    broadcastRanking(roomName);
  });

  socket.on("addErrors", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player || player.role === "spectator") return;

    player.errors++;
    broadcastRanking(roomName); // <--- Nuevo
  });

  socket.on("disconnect", () => {
    rooms.forEach((room) => {
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      room.players = room.players.filter((p) => p.socketId !== socket.id);

      if (player.role === "admin" && room.players.length > 0) {
        room.players[0].role = "admin";
        io.to(room.players[0].socketId).emit("youAreNowAdmin");
      }

      broadcastRoomState(room.name);
      broadcastRoomList();
    });
  });

  // Listen when a user wants to play again after a match
  socket.on("playAgain", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player) return;

    player.isReady = false;
    player.points = 0;
    player.errors = 0;

    broadcastRoomState(roomName);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
