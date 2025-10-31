const { error } = require("console");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get("/", (req, res) => res.send("Backend Type Racer Royale listo 🏁"));

let jugadors = [];
let partidaEnCurs = false;
let configuracioPartida = {
  idioma: "cat",
  temps: 60,
};
let temporitzador = null;

// Funció per enviar la llista de jugadors a tots els clients connectats
function broadcastPlayerList() {
  io.emit("setPlayerList", jugadors);
}

// Funció per eliminar un jugador de la partida (Encara no s'utilitza)
function eliminarJugador(idJugador) {
  if (!partidaEnCurs) return;

  const jugador = jugadors.find((j) => j.id === idJugador);
  if (!jugador) return;

  jugador.rol = "espectador";
  broadcastPlayerList();
}

// Funció per acabar la partida i enviar la classificació final
function acabarPartida() {
  partidaEnCurs = false;

  const classificacio = [...jugadors]
    .filter((j) => j.rol === "jugador")
    .sort((a, b) => b.puntuacio - a.puntuacio);

  io.emit("PartidaFinalitzada", { classificacio });
  clearTimeout(temporitzador);
}

//Començen amb la connexió del servidor
io.on("connection", (socket) => {
  console.log("Jugador conectat");

  // Quan un usuari ens envia el seu nom i id
  socket.on("setPlayerName", ({ name, id }) => {
    if (!name || id === undefined) return;

    const jugadorsActius = jugadors.filter((j) => j.rol === "espectador");
    if (jugadorsActius.length >= 6) {
      socket.emit("lobbyLleno", { mensaje: "El lobby ya está lleno." });
      return;
    }

    const admin = jugadors.some((j) => j.admin);

    const jugador = {
      id, // id enviat des del frontend
      name: name,
      preparat: false,
      admin: !admin, // el primero en unirse será admin
      rol: partidaEnCurs ? "espectador" : "jugador",
      puntuacio: 0,
      errors: 0,
    };

    jugadors.push(jugador);

    console.log(`L'usuari ${name}  s'ha unit amb id ${id}`);
    broadcastPlayerList(); // Enviem la llista actualitzada a tothom
  });

  //escoltem l'ordre de quan l'usuari li dona a preparat
  socket.on("setPreparat", ({ id }) => {
    const jugador = jugadors.find((j) => j.id === id);
    if (!jugador) return;

    jugador.preparat = !jugador.preparat;

    jugador.rol = jugador.preparat && !partidaEnCurs ? "jugador" : "espectador";

    console.log(`Jugador ${jugador.name} preparat: ${jugador.preparat}`);
    broadcastPlayerList();
  });

  //Admin pot escollir la configuració de la partida al lobby
  socket.on("configurarPartida", ({ id, novaConfig }) => {
    const admin = jugadors.find((j) => j.id === id && j.admin);
    if (!admin) return;

    configuracioPartida = { ...configuracioPartida, ...novaConfig };
    io.emit("configuracioActualizada", configuracioPartida);
  });

  //Escolta quan expulsem al jugador que te el idJugador
  socket.on("expulsarJugador", ({ adminId, idJugador }) => {
    const admin = jugadors.find((j) => j.id === adminId && j.admin);
    if (!admin) return;

    const expulsat = jugadors.find((j) => j.id === idJugador);
    if (!expulsat) return;

    // Notifiquem al frontend que ha estat expulsat
    io.emit("expulsat", { id: idJugador });

    jugadors = jugadors.filter((j) => j.id !== idJugador);
    console.log(`Jugador ${expulsat.name} ha estat expulsat per l'admin`);
    broadcastPlayerList();
  });

  //Transferir l'admin a l'usuari escollit
  socket.on("transferirAdmin", ({ adminId, idNuevoAdmin }) => {
    const adminActual = jugadors.find((j) => j.id === adminId && j.admin);
    const adminNuevo = jugadors.find((j) => j.id === idNuevoAdmin);

    if (!adminActual || !adminNuevo) return;

    adminActual.admin = false;

    adminNuevo.admin = true;

    console.log(
      `${adminActual.name} ha transferit l'admin a ${adminNuevo.name}`
    );
    broadcastPlayerList();
  });

  // Escolta quan l'admin comença el joc i posa als usuaris no preparats com espectadors
  socket.on("IniciarJoc", ({ id }) => {
    const admin = jugadors.find((j) => j.id === id && j.admin);
    if (!admin) return;

    partidaEnCurs = true;

    jugadors.forEach((j) => {
      if (!j.preparat) {
        j.rol = "espectador";
      }
    });
    io.emit("JocIniciat", {
      jugadores: jugadors,
      temps: configuracioPartida.temps,
    });

    temporitzador = setTimeout(() => {
      acabarPartida();
    }, configuracioPartida.temps * 1000);
  });

  //socket que escolta els punts sumats al jugador
  socket.on("sumarPunts", ({ id }) => {
    const jugador = jugadors.find((j) => j.id === id);
    if (!jugador || jugador.rol !== "jugador") return;

    jugador.puntuacio++;
  });

  socket.on("sumarErrors", ({ id }) => {
    const jugador = jugadors.find((j) => j.id === id);
    if (!jugador || jugador.rol !== "jugador") return;

    jugador.errors++;
  });

  //En cas de l'usuari premi el boto de sortir es desconecta
  socket.on("sortir", ({ id }) => {
    const jugador = jugadors.find((j) => j.id === id);
    if (!jugador) return;

    if (jugador.admin) {
      const nouAdmin = jugadors.find((j) => j.id !== id);
      if (nouAdmin) {
        nouAdmin.admin = true;
      }
    }

    jugadors = jugadors.filter((j) => j.id !== id);

    broadcastPlayerList();
    socket.disconnect();
  });

  //Escoltem quan l'usuari vol tornar a jugar després d'una partida
  socket.on("tornarAJugar", ({ id }) => {
    const jugador = jugadors.find((j) => j.id === id);
    if (!jugador) return;

    jugador.preparat = false;
    jugador.puntuacio = 0;
    jugador.rol = "jugador";
    broadcastPlayerList();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
