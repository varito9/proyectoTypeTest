// REQUIREMENTS
const { error } = require("console");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto"); // 🔑 Importado para generar códigos
const mysql = require("mysql2/promise"); // 💾 Importar mysql2 con soporte para promesas

const nodeEnv = process.env.NODE_ENV;
let port;
const corsOptions = {};

if (nodeEnv === "production") {
  console.log("Running in production mode");
  port = process.env.PORT || 3001; // El puerto interno para producción
  corsOptions.origin =
    process.env.FRONTEND_URL || "https://magictyperoyale.daw.inspedralbes.cat";
} else {
  console.log("Running in development mode");
  port = 3001; // Puerto de desarrollo
  // En desarrollo, permite cualquier origen
  corsOptions.origin = "*";
}
/*f */
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
const dbConfig = {
  host: process.env.DB_HOST || "localhost", // Usar la variable de entorno o localhost
  user: process.env.MYSQL_USER || "trr_user_dev",
  password: process.env.MYSQL_PASSWORD || "trr_password_dev",
  database: process.env.MYSQL_DATABASE || "trr_db_dev",
};

let dbConnection;

/**
 * Función para crear la tabla si no existe y poblar con datos usando prepared statements.
 */
async function initializeDatabase() {
  if (!dbConnection) {
    console.error(
      "No hay conexión a la base de datos, omitiendo inicialización."
    );
    return;
  }
  const tableName = "datos_ejemplo";

  try {
    console.log(`Verificando la tabla '${tableName}'...`);
    // 1. Crear la tabla si no existe (usando IF NOT EXISTS)
    await dbConnection.execute(CREATE_TABLE_SQL);
    console.log(`Tabla '${tableName}' asegurada.`);

    // 2. Comprobar si ya hay datos
    const [rows] = await dbConnection.execute(
      `SELECT COUNT(*) as count FROM ${tableName} `
    );
    const count = rows[0].count;

    if (count === 0) {
      console.log(`Tabla '${tableName}' vacía.Insertando datos iniciales...`);

      // 3. Usar prepared statements para insertar datos de forma segura
      const insertQuery = `INSERT IGNORE INTO ${tableName} (categoria, mag, linea_orden, titol, linea_texto) VALUES(?, ?, ?, ?, ?)`;

      let insertedCount = 0;
      for (const row of SPELL_DATA) {
        try {
          await dbConnection.execute(insertQuery, row);
          insertedCount++;
        } catch (err) {
          console.warn(`Fila duplicada(ignorada): ${row.join(", ")} `);
        }
      }

      console.log(
        `¡Datos iniciales insertados exitosamente! Total de ${insertedCount} filas.`
      );
    } else {
      console.log(
        `Tabla '${tableName}' ya contiene ${count} filas.Inicialización omitida.`
      );
    }
  } catch (err) {
    console.error("Error durante la inicialización de la base de datos:", err);
  }
}

async function connectToDatabase() {
  try {
    dbConnection = await mysql.createConnection(dbConfig);
    console.log("Conectado a la base de datos MySQL exitosamente! 💾");

    // 🔑 LLAMAR A LA FUNCIÓN DE INICIALIZACIÓN AQUÍ
    await initializeDatabase();
  } catch (err) {
    console.error("Error al conectar con la base de datos MySQL:", err);
    // En un entorno real, aquí deberías manejar reintentos o un mensaje de error más robusto.
  }
}

connectToDatabase();
// ----------------------------------------

app.get("/", (req, res) => res.send("Type Racer Royale backend ready 🏁"));

let rooms = [];
// Mapea el mago (name) con su categoría (category) de la BDD.
// He añadido categorías asumidas para los magos que no son 'Foc' basándome en los ejemplos típicos.
const mageDefinitions = [
  {
    name: "Mag de Foc",
    category: "foc", // 🔑 Coincide con tu ejemplo 'foc'
    powerUp: "Ignicio",
    description: "Posa accent a totes les lletres",
  },
  {
    name: "Mag de Gel",
    category: "gel", // 🔑 CORRECCIÓN: Coincide con 'gel' en la BDD
    powerUp: "Congelar",
    description: "Congela l'input, no saps en quina palabra et trobes",
  },
  {
    name: "Mag d'Aigua",
    category: "aigua", // 🔑 CORRECCIÓN: Coincide con 'aigua' en la BDD
    powerUp: "Tsunami",
    description:
      "Si no escrius la paraula que toca tens que tornar a escriure tota la frase",
  },
  {
    name: "Mag Oscur",
    category: "foscor", // 🔑 CORRECCIÓN: Coincide con 'foscor' en la BDD
    powerUp: "Apagon",
    description: "Torna tota la pantalla molt oscura ",
  },
  {
    name: "Mag de Llum",
    category: "llum", // 🔑 CORRECCIÓN: Coincide con 'llum' en la BDD
    powerUp: "Flash",
    description: "Il·lumina la pantalla de forma intermitent",
  },
  {
    name: "Mag de Jungla",
    category: "selva", // 🔑 CORRECCIÓN: Coincide con 'selva' en la BDD
    powerUp: "Enredadera",
    description: "Posa a tota una paraula plena de caràcters especials",
  },
];

// ----------------------------------------------------
// NUEVA FUNCIÓN: Obtener textos de la BDD
// ----------------------------------------------------
async function getRandomSpellText(category, limit = null) {
  if (!dbConnection) return null;

  try {
    // 1. Obtener una lista de TÍTULOS y MAG (nivel/id numérico) únicos para esa categoría.
    const [titles] = await dbConnection.execute(
      `SELECT DISTINCT titol, mag FROM datos_ejemplo WHERE categoria = ? `,
      [category]
    );

    if (titles.length === 0) {
      console.warn(
        `No se encontraron conjuros para la categoría: ${category} `
      );
      return null;
    }

    // 2. Elegir un conjuro (titol/mag) aleatorio
    const randomTitleIndex = Math.floor(Math.random() * titles.length);
    const { titol, mag: rawMag } = titles[randomTitleIndex];
    const mag = Number.parseInt(rawMag, 10); // Explicitly cast to integer
    if (Number.isNaN(mag)) {
      console.error(
        `[ERROR] 'mag' is NaN for category: ${category}, titol: ${titol}, rawMag: ${rawMag}`
      );
      return null;
    }

    // 3. Obtener todas las líneas de texto para ese conjuro, ordenadas por linea_orden.
    let query = `SELECT linea_texto FROM datos_ejemplo WHERE categoria = ? AND titol = ? AND mag = ? ORDER BY linea_orden ASC`;
    const params = [category, titol, mag];

    if (limit) {
      const numericLimit = Number.parseInt(limit, 10); // Explicitly cast to integer
      if (Number.isNaN(numericLimit)) {
        console.error(
          `[ERROR] 'limit' is NaN for category: ${category}, titol: ${titol}, limit: ${limit}`
        );
        return null;
      }
      query += ` LIMIT ${numericLimit} `;
    }

    console.log(`[DEBUG] Query for spell text: ${query} `);
    console.log(
      `[DEBUG] Parameters for spell text: ${JSON.stringify(params)} `
    );

    const [lines] = await dbConnection.execute(query, params);

    // 4. Mapear el resultado para obtener solo un array de strings (las líneas de texto)
    const textLines = lines.map((row) => row.linea_texto.trim());

    console.log(
      `Conjuro seleccionado para ${category}: ${titol} (Mag: ${mag}). Líneas: ${textLines.length}`
    );
    return textLines; // 🔑 CORRECCIÓN: Faltaba este return. Sin él, la función devolvía undefined.
  } catch (error) {
    console.error("Error al obtener el texto del conjuro:", error);
    return null; // En caso de error, devuelve null
  }
}
// ----------------------------------------------------

//Funció per asignar admin
function assignNewAdmin(room) {
  if (room.players.length === 0) return;

  let newAdmin = null;

  if (room.beingPlayed) {
    newAdmin = room.players.find((p) => p.role !== "spectator");
  } else {
    newAdmin = room.players[0];
  }

  if (newAdmin) {
    newAdmin.role = "admin";
    io.to(newAdmin.socketId).emit("youAreNowAdmin");
  } // Si els que queden només son espectadors els jugadors la sala es queda temporalment sense admin fins que acabi el joc ja que en EndGame es reasigna
}

// Funció per crear rooms
function createRoom(roomName, hostPlayer, isPrivate = false) {
  const isRoom = findRoom(roomName);

  if (!isRoom) {
    const room = {
      name: roomName,
      beingPlayed: false,
      config: { language: "cat", time: 60 },
      players: [hostPlayer],
      timer: null,
      isPrivate: isPrivate,
      accessCode: isPrivate ? randomUUID().substring(0, 6).toUpperCase() : null, // Código de 6 caracteres

      // --- NUEVAS PROPIEDADES ---
      gameStats: [], // Para guardar el progreso de cada jugador
      spectatorIds: [], // Para saber a quién enviar los datos
      spellText: [], // 🔑 Guardaremos el texto (array de líneas) del conjuro
      // -------------------------
    };
    rooms.push(room);
    broadcastRoomList();
    return room;
  } else {
    return 0;
  }
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

//Eliminar Rooms sense cap jugador
function removeEmptyRooms() {
  const before = rooms.length;
  rooms = rooms.filter((room) => room.players.length > 0);
  if (rooms.length !== before) {
    broadcastRoomList();
  }
}

// Function to end the game and send the final ranking
function endGame(roomName) {
  const room = findRoom(roomName);
  if (!room) return;

  room.beingPlayed = false;

  const ranking = [...room.players]
    .filter((player) => player.role === "player" || player.role === "admin")
    .sort((a, b) => b.points - a.points || a.errors - b.errors);

  //netejem els stats
  room.gameStats = [];
  room.spectatorIds = [];
  room.spellText = []; // 🔑 Limpiar el texto del conjuro

  let adminExists = false;

  // Resetear roles de espectadores que eran players antes del juego
  room.players.forEach((p) => {
    p.debuff = { type: null, duration: 0 };
    if (p.role === "admin") {
      adminExists = true;
      p.isReady = true;
    } else if (p.role === "spectator") {
      // Si era espectador, pasa al lobby com jugador,
      p.role = "player";
      p.isReady = true;
    } else {
      p.role = "player";
      p.isReady = true;
    }
  });

  if (!adminExists && room.players.length > 0) {
    room.players[0].role = "admin";
    room.players[0].isReady = true;
    io.to(room.players[0].socketId).emit("youAreNowAdmin");
  }

  io.to(roomName).emit("gameFinished", { ranking });

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  broadcastRoomState(roomName);
  broadcastRoomList();
  removeEmptyRooms();
}

// Enviem el rànquing actualitzat
function broadcastRanking(roomName) {
  const room = findRoom(roomName);
  if (!room) return;

  const ranking = [...room.players]
    .filter((p) => p.role !== "spectator")
    .sort((a, b) => b.points - a.points || a.errors - b.errors);

  io.to(roomName).emit("updateRanking", { ranking });
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
      isReady: true,
      points: 0,
      errors: 0,

      //powerups
      mage: null,
      powerUpEarned: false,
      correctWordsInARow: 0,
      madeErrorThisWord: false,
      debuff: { type: null, duration: 0 },
    };

    console.log(`Jugador conectado: ${name} (${id})`);
    socket.emit("playerRegistered", socket.data.player);
  });

  // Listener para crear sala
  socket.on("createRoom", ({ roomName, isPrivate = false }) => {
    const player = socket.data.player;
    if (!player)
      return socket.emit("error", { message: "Jugador no registrat." });
    if (findRoom(roomName))
      return socket.emit("error", { message: "La sala ja existeix." });

    player.role = "admin";
    const room = createRoom(roomName, player, isPrivate);

    if (room != 0) {
      socket.join(roomName);
      broadcastRoomState(roomName);
      socket.emit("roomCreated", { roomName, isPrivate });

      console.log(
        `${player.name} creó la sala ${roomName} (Privada: ${isPrivate})`
      );
    } else {
      socket.emit("roomAlreadyCreated");
    }
  });

  // Listener para unirse a sala (por nombre o código)
  socket.on("joinRoom", ({ roomName, accessCode }) => {
    const player = socket.data.player;
    if (!player)
      return socket.emit("error", { message: "Jugador no registrat." });

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
          message: "Error a la unió. Aquesta sala no requiereix codi.",
        });
      }
    }

    if (room.players.length >= 6)
      return socket.emit("error", { message: "La sala està plena" });

    if (room.beingPlayed) {
      player.role = "spectator";

      if (!room.spectatorIds.includes(player.id)) {
        room.spectatorIds.push(player.id);
      }

      //emitim al jugador que s'uneix quan la partida esta empezada
      io.to(player.socketId).emit("spectatorGameView", room.gameStats);
    } else {
      player.role = "player";
    }

    player.isReady = true;
    player.points = 0;
    player.errors = 0;

    room.players.push(player);
    socket.join(room.name);

    socket.emit("roomJoined", { roomName: room.name });

    broadcastRoomState(room.name);
    broadcastRoomList();
    console.log(`${player.name} se unió a ${room.name}`);

    const joinMsg = `${player.name} s'ha unit a la sala.`;
    socket.broadcast
      .to(room.name)
      .emit("lobbyNotification", { message: joinMsg, type: "info" });
  });

  socket.on("getRoomList", () => {
    broadcastRoomList();
  });

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

    removeEmptyRooms();
    broadcastRoomState(roomName);
    const kickMsg = `${kickedPlayer.name} ha estat expulsat per l'admin.`;
    io.to(roomName).emit("lobbyNotification", {
      message: kickMsg,
      type: "error",
    });
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

  socket.on("startGame", async ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find((p) => p.id === id && p.role === "admin");
    if (!admin) return;

    room.beingPlayed = true;
    const tempsRestant = room.config.time;

    // 1. Determinar quins jugadors juguen i quins miren
    const playingPlayers = [];
    const spectators = [];

    room.players.forEach((p) => {
      // Reset stats per a tothom
      p.points = 0;
      p.errors = 0;
      p.powerUpEarned = false;
      p.correctWordsInARow = 0;
      p.debuff = { type: null, duration: 0 };
      p.mage = null;

      // Assignar rol
      if (p.id === admin.id || (p.isReady && p.role !== "spectator")) {
        p.role = p.id === admin.id ? "admin" : "player";
        playingPlayers.push(p);
      } else {
        p.role = "spectator";
        spectators.push(p);
      }
    });

    const gameDataForSpectators = [];
    //Es fa uno copia per no accionar directament al array de mags
    let availableMages = [...mageDefinitions];

    // 2. Per a cada jugador, assignar mag i obtenir text
    for (const player of playingPlayers) {
      const randomIndex = Math.floor(Math.random() * availableMages.length);
      player.mage = availableMages.splice(randomIndex, 1)[0];

      const spellLines = await getRandomSpellText(player.mage.category, 20);

      const spellTextForPlayer =
        !spellLines || spellLines.length === 0
          ? [{ text: "el text no ha carregat correctament.", estat: "pendent" }]
          : spellLines.map((line) => ({
              text: line.toLowerCase(),
              estat: "pendent",
            }));

      console.log(
        `[startGame] Player ${player.name} (${player.id}) assigned mage category: ${player.mage.category}`
      );
      if (spellTextForPlayer.length > 0) {
        console.log(
          `[startGame] Player ${
            player.name
          } received spell text snippet: "${spellTextForPlayer[0].text.substring(
            0,
            50
          )}..."`
        );
      } else {
        console.log(
          `[startGame] Player ${player.name} received no spell text.`
        );
      }

      // Enviar l'event individualment a cada jugador
      io.to(player.socketId).emit("gameStarted", {
        time: tempsRestant,
        spellText: spellTextForPlayer,
        category: player.mage.category,
      });
      console.log(
        `[DEBUG] Sending to player ${player.name} (ID: ${player.id}, SocketID: ${player.socketId}):`
      );
      console.log(`[DEBUG]   Category: ${player.mage.category}`);
      console.log(
        `[DEBUG]   Spell Text (first line): ${
          spellTextForPlayer.length > 0 ? spellTextForPlayer[0].text : "N/A"
        }`
      );

      // Preparar dades per als espectadors
      gameDataForSpectators.push({
        id: player.id,
        name: player.name,
        textEntrat: "",
        indexParaulaActiva: 0,
        paraules: spellTextForPlayer,
      });
    }

    // 3. Actualitzar l'estat de la sala per als espectadors
    room.gameStats = gameDataForSpectators;
    room.spectatorIds = spectators.map((p) => p.id);

    // 4. Iniciar el temporitzador del joc
    if (room.timer) clearInterval(room.timer);
    broadcastRoomState(roomName);
    broadcastRoomList();

    spectators.forEach((spectator) => {
      io.to(spectator.socketId).emit("gameStarted", {
        time: tempsRestant,
        spellText: [],
      });
      io.to(spectator.socketId).emit("spectatorGameView", room.gameStats);
    });

    let remainingTime = tempsRestant;
    room.timer = setInterval(() => {
      remainingTime--;
      room.players.forEach((p) => {
        if (p.debuff.duration > 0) {
          p.debuff.duration--;
          if (p.debuff.duration === 0) {
            p.debuff.type = null;
            io.to(p.socketId).emit("debuffEnded");
          }
        }
      });

      if (remainingTime <= 0) {
        endGame(roomName);
      } else {
        io.to(roomName).emit("updateTime", { time: remainingTime });
      }
    }, 1000);
  });

  // Puntos y Errores (se mantienen)
  socket.on("addPoints", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player || player.role === "spectator") return;

    if (!player.powerUpEarned) {
      if (player.madeErrorThisWord) {
        // El jugador cometió un error, no incrementa la racha
        player.madeErrorThisWord = false;
        player.correctWordsInARow = 0;
      } else {
        // Palabra perfecta, incrementa la racha
        player.correctWordsInARow++;
      }

      if (player.correctWordsInARow === 1) {
        player.powerUpEarned = true;
        io.to(player.socketId).emit("powerUpReady", player.mage);
      }
    }

    player.points++;
    broadcastRanking(roomName);
  });

  socket.on("addErrors", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player || player.role === "spectator") return;

    player.errors++;
    player.correctWordsInARow = 0;
    player.madeErrorThisWord = true;

    if (player.powerUpEarned) {
      player.powerUpEarned = false;
    }

    if (player.debuff.type === "Tsunami") {
      player.debuff.type = null;
      player.debuff.duration = 0;

      // Avisa al client que ha de resetejar el seu progrés
      io.to(player.socketId).emit("tsunamiHit");
      io.to(player.socketId).emit("debuffEnded");
    }

    broadcastRanking(roomName);
  });

  //Us de powerUps
  socket.on("usePowerUp", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const attacker = room.players.find((p) => p.id === id);
    if (!attacker || !attacker.mage) return;

    // Trobar objectius (tots menys l'atacant i espectadors)
    const targets = room.players.filter(
      (p) => p.id !== id && p.role !== "spectator" && p.debuff.type === null // No atacar a algú que ja està sota un efecte
    );

    if (targets.length === 0) {
      // Si no hi ha objectius, notificar a l'atacant i no fer res més
      return io.to(attacker.socketId).emit("powerUpFailed", {
        message: "No s'ha trobat un objectiu vàlid.",
      });
    }

    const target = targets[Math.floor(Math.random() * targets.length)];
    const powerUpType = attacker.mage.powerUp;
    const durationInSeconds = 10;

    target.debuff = { type: powerUpType, duration: durationInSeconds };

    io.to(target.socketId).emit("debuffReceived", {
      type: powerUpType,
      duration: durationInSeconds * 1000,
    });

    //PowerUps Ilimitats
    attacker.powerUpEarned = false;
    attacker.correctWordsInARow = 0;

    // Avisar a l'atacant que el seu power-up s'ha utilitzat correctament
    io.to(attacker.socketId).emit("powerUpUsed");
  });

  // data  conté: {id: 0, textEntrat: '', indexParaulaActiva: 0, paraules: []}
  socket.on("playerGameStatus", ({ roomName, data }) => {
    const room = findRoom(roomName);
    if (!room || !room.beingPlayed) return;

    const playerStat = room.gameStats.find((p) => p.id === data.id);
    if (playerStat) {
      playerStat.textEntrat = data.textEntrat;
      playerStat.indexParaulaActiva = data.indexParaulaActiva;
      playerStat.paraules = data.paraules;
    } else {
      return;
    }
    const updatedGameStats = room.gameStats;

    room.spectatorIds.forEach((spectatorId) => {
      // Busca el socketId del espectador (que está en room.players)
      const spectatorSocketId = room.players.find(
        (p) => p.id === spectatorId
      )?.socketId;

      if (spectatorSocketId) {
        io.to(spectatorSocketId).emit("spectatorGameView", updatedGameStats);
      }
    });
  });

  socket.on("disconnect", () => {
    rooms.forEach((room) => {
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      room.spectatorIds = room.spectatorIds.filter((id) => id !== player.id);
      room.gameStats = room.gameStats.filter((p) => p.id !== player.id);

      room.players = room.players.filter((p) => p.socketId !== socket.id);

      if (player.role === "admin") {
        assignNewAdmin(room);
      }

      if (room.players.length === 0 && room.timer) {
        clearInterval(room.timer);
        room.timer = null;
        console.log(`[TIMER] Timer netejat per a la sala buida: ${room.name}`);
      }

      const disconnectMsg = `${player.name} s'ha desconnectat.`;
      io.to(room.name).emit("lobbyNotification", {
        message: disconnectMsg,
        type: "info",
      });

      removeEmptyRooms();
      broadcastRoomState(room.name);
      broadcastRoomList();
    });
    console.log("Player disconnected");
  });

  // Jugar de nuevo (se mantienen)
  socket.on("playAgain", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player) return;

    player.isReady = true;
    player.points = 0;
    player.errors = 0;

    broadcastRoomState(roomName);
  });

  //socket que escolta quan un jgador es marxa al acabar la partida
  socket.on("leaveRoom", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player) return;

    // Sacamos al jugador
    room.players = room.players.filter((p) => p.id !== id);
    socket.leave(roomName);

    console.log(`${player.name} ha salido de la sala ${roomName} `);

    const leaveMsg = `${player.name} ha sortit de la sala.`;
    io.to(room.name).emit("lobbyNotification", {
      message: leaveMsg,
      type: "info",
    });
    // Si era admin, pasar rol al siguiente jugador
    if (player.role === "admin") {
      assignNewAdmin(room);
    }

    if (room.players.length === 0 && room.timer) {
      clearInterval(room.timer);
      room.timer = null;
      console.log(`[TIMER] Timer netejat per a la sala buida: ${room.name}`);
    }

    // Refrescar estat
    removeEmptyRooms();
    broadcastRoomList();
    broadcastRoomState(roomName);
  });
});

server.listen(port, () => console.log(`Server listening on port ${port}`));
