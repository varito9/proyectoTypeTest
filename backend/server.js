// REQUIREMENTS
const { error } = require("console");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto"); // 🔑 Importado para generar códigos

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get("/", (req, res) => res.send("Type Racer Royale backend ready 🏁"));

// DATA
let rooms = [];

// Funció per crear rooms
function createRoom(roomName, hostPlayer, isPrivate = false) {
  const room = {
    name: roomName,
    beingPlayed: false,
    config: { language: "cat", time: 5 },
    players: [hostPlayer],
    timer: null,
    isPrivate: isPrivate,
    accessCode: isPrivate ? randomUUID().substring(0, 6).toUpperCase() : null, // Código de 6 caracteres
  };
  rooms.push(room);
  broadcastRoomList();
  return room;
}

// Trobar la Room per el seu nom
function findRoom(roomName) {
  return rooms.find((r) => r.name === roomName);
}

// Trobar la Room per el seu codi d'accés
function findRoomByCode(accessCode) {
  if (!accessCode) return null;
  const upperCaseCode = accessCode.toUpperCase();
  return rooms.find((r) => r.accessCode === upperCaseCode);
}

// Enviar l'estat actualitzar de la sala a tots en la sala
function broadcastRoomState(roomName) {
  const room = findRoom(roomName);
  if (room) {
    const { timer, ...roomState } = room;
    io.to(roomName).emit("updateRoomState", roomState);
  }
}

// Solo enviamos salas públicas en la lista
function broadcastRoomList() {
  const roomList = rooms
    .filter((r) => !r.isPrivate)
    .map((r) => ({
      name: r.name,
      playerCount: r.players.length,
      beingPlayed: r.beingPlayed,
    }));
  io.emit("roomList", roomList);
}

// Function to end the game and send the final ranking
function endGame(roomName) {
  const room = findRoom(roomName);
  if (!room) return;

  room.beingPlayed = false;

  // Resetear roles de espectadores que eran players antes del juego
  room.players.forEach((p) => {
    if (p.role !== "admin") {
      p.role = "player";
    }
    p.isReady = false;
  });

  const ranking = [...room.players]
    .filter((player) => player.role === "player")
    .sort((a, b) => b.points - a.points || a.errors - b.errors);

  io.to(roomName).emit("gameFinished", { ranking });

  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
  broadcastRoomState(roomName);
  broadcastRoomList();
}

// Enviem el rànquing actualitzat
function broadcastRanking(roomName) {
  const room = findRoom(roomName);
  if (!room) return;

  const ranking = [...room.players]
    .filter((p) => p.role !== "spectator")
    .sort((a, b) => b.points - a.points || a.errors - b.errors);

  io.to(roomName).emit("updateRanking", ranking);
}

// Start listening for server connections
io.on("connection", (socket) => {
  console.log("Player connected");

  // When a user sends their name and ID
  socket.on("setPlayerName", ({ name, id }) => {
    if (!name || id === undefined) return;

    socket.data.player = {
      id: id,
      socketId: socket.id,
      name: name,
      role: "player",
      isReady: false,
      points: 0,
      errors: 0,
    };

    console.log(`Jugador conectado: ${name} (${id})`);
    socket.emit("playerRegistered", socket.data.player);
  });

  // Listener para crear sala
  socket.on("createRoom", ({ roomName, isPrivate = false }) => {
    const player = socket.data.player;
    if (!player)
      return socket.emit("error", { message: "Jugador no registrado." });
    if (findRoom(roomName))
      return socket.emit("error", { message: "La sala ya existe." });

    player.role = "admin";
    const room = createRoom(roomName, player, isPrivate);

    socket.join(roomName);
    broadcastRoomState(roomName);

    console.log(
      `${player.name} creó la sala ${roomName} (Privada: ${isPrivate})`
    );
  });

  // Listener para unirse a sala (por nombre o código)
  socket.on("joinRoom", ({ roomName, accessCode }) => {
    const player = socket.data.player;
    if (!player)
      return socket.emit("error", { message: "Jugador no registrado." });

    let room;
    const codeToSearch = accessCode ? accessCode.toUpperCase() : null;

    if (codeToSearch) {
      room = findRoomByCode(codeToSearch);
    } else if (roomName) {
      room = findRoom(roomName);
    }

    if (!room)
      return socket.emit("error", {
        message: "Sala no encontrada o código incorrecto.",
      });

    if (room.isPrivate) {
      if (!codeToSearch || room.accessCode !== codeToSearch) {
        return socket.emit("error", {
          message: "Código de acceso incorrecto.",
        });
      }
    } else {
      if (codeToSearch) {
        return socket.emit("error", {
          message: "Error en la unión. Esta sala no requiere código.",
        });
      }
    }

    if (room.players.length >= 6)
      return socket.emit("error", { message: "La sala está plena" });

    if (room.players.length === 0 && !room.beingPlayed) {
      player.role = "admin";
    }

    if (room.beingPlayed) {
      player.role = "spectator";
    }

    player.isReady = false;
    player.points = 0;
    player.errors = 0;

    room.players.push(player);
    socket.join(room.name);

    if (codeToSearch) {
      socket.emit("roomJoined", { roomName: room.name });
    }

    broadcastRoomState(room.name);
    console.log(`${player.name} se unió a ${room.name}`);
  });

  socket.on("getRoomList", () => {
    broadcastRoomList();
  });

  // Listo / No Listo
  socket.on("setIsReady", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player) return;

    player.isReady = !player.isReady;
    broadcastRoomState(roomName);
  });

  // Configuración de juego (se mantiene)
  socket.on("configGame", ({ roomName, id, newConfig }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find((p) => p.id === id && p.role === "admin");
    if (!admin) return;

    room.config = newConfig;
    broadcastRoomState(roomName);
  });

  // Expulsar jugador
  socket.on("kickPlayer", ({ roomName, adminId, playerId }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find(
      (p) => p.id === adminId && p.role === "admin"
    );
    if (!admin) return;

    const kickedPlayer = room.players.find((p) => p.id === playerId);
    if (!kickedPlayer) return;

    io.sockets.sockets.get(kickedPlayer.socketId)?.leave(roomName);
    io.to(kickedPlayer.socketId).emit("kicked");

    room.players = room.players.filter((p) => p.id !== playerId);

    if (kickedPlayer.role === "admin" && room.players.length > 0) {
      room.players[0].role = "admin";
      io.to(room.players[0].socketId).emit("youAreNowAdmin");
    }

    if (room.players.length === 0) {
      rooms = rooms.filter((r) => r.name !== roomName);
      broadcastRoomList();
      return;
    }

    broadcastRoomState(roomName);
  });

  // Transferir Admin
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

  // Iniciar juego (se mantiene)
  socket.on("startGame", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find((p) => p.id === id && p.role === "admin");
    if (!admin) return;

    room.beingPlayed = true;

    room.players.forEach((p) => {
      p.points = 0;
      p.errors = 0;
      if (p.id === admin.id) {
        p.isReady = true;
        p.role = "admin";
      } else if (!p.isReady) {
        p.role = "spectator";
      }
    });

    io.to(roomName).emit("gameStarted", { time: room.config.time });

    room.timer = setTimeout(() => {
      endGame(roomName);
    }, room.config.time * 1000);

    broadcastRoomState(roomName);
  });

  // Puntos y Errores (se mantienen)
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
    broadcastRanking(roomName);
  });

  // Desconexión (se mantiene)
  socket.on("disconnect", () => {
    rooms.forEach((room) => {
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      room.players = room.players.filter((p) => p.socketId !== socket.id);

      if (player.role === "admin" && room.players.length > 0) {
        room.players[0].role = "admin";
        io.to(room.players[0].socketId).emit("youAreNowAdmin");
      }

      if (room.players.length === 0) {
        rooms = rooms.filter((r) => r.name !== room.name);
        broadcastRoomList();
        return;
      }

      broadcastRoomState(room.name);
      broadcastRoomList();
    });
    console.log("Player disconnected");
  });

  // Jugar de nuevo (se mantiene)
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
