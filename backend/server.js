const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get("/", (req, res) => res.send("Backend Type Racer Royale listo 🏁"));

const jugadors = [];

function broadcastPlayerList() {
  io.emit("updatePlayerList", Object.values(jugadors));
}

//Començen amb la connexió del servidor
io.on("connection", (socket) => {
    socket.on("setPlayer", (player) => {
        if (jugadors.length == 0 ) {
            player.admin = true;
        }
        jugadors.push(player)
    }
    
    const admin = Object.values(jugadors).some(j => j.admin);

    jugadors {
        id: socket.id,
        name: name,
        preparat: false, 
        admin: !admin 
    }
    
  console.log("Jugador conectat:", socket.id);


  // Desconnexió de l'usuari
  socket.on("disconnect", () => {
    console.log("Jugador desconectat:", socket.id);
    delete jugadors[socket.id];
    broadcastPlayerList(); // Informem a la resta que algú ha marxat
  });

  // Quan un usuari ens envia el seu nom
  socket.on("setPlayerName", (name) => {
    jugadors[socket.id] = { id: socket.id, name: name };
    console.log(`L'usuari ${socket.id} ara es diu: ${name}`);
    broadcastPlayerList(); // Enviem la llista actualitzada a tothom
  });

  //escoltem l'ordre de quan l'usuari li dona a preparat 
  socket.on("usuariPreparat", () => {
    jugadors[socket.id].preparat = !jugadors[socket.id].preparat;

    console.log(`Jugador ${jugadors[socket.id].name} preparat: ${jugadors[socket.id].preparat}`);
    .name
    broadcastPlayerList();
  });

  socket.on("usuariAdmin", () =>  {

  })
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
