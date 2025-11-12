<template>
  <div v-if="notification.visible" :class="['notification', notification.type]">
    <span class="notification-message">{{ notification.message }}</span>
  </div>
  <div class="fondo" v-if="!isConnected">
    <img
      class="mago mago-fuego"
      src="../public/img/MagoFuego-removebg-preview.png"
      alt="Mago de Fuego"
    />
    <img
      class="mago mago-angelical"
      src="../public/img/MagoAngelical-removebg-preview.png"
      alt="Mago Angelical"
    />
    <img
      class="mago mago-obscuro"
      src="../public/img/MagoObscuro-removebg-preview.png"
      alt="Mago Obscuro"
    />
    <img
      class="mago mago-tierra"
      src="../public/img/MagoTierra-removebg-preview.png"
      alt="Mago de Tierra"
    />

    <div class="login-container">
      <div class="badge">
        <span>TYPE RACER ROYALE</span>
      </div>

      <h1 class="login-title">Desfés la teva màgia. Inicia sessió i continua la teva aventura.</h1>

      <div class="login-form">
        <input
          type="text"
          id="username"
          class="login-input"
          v-model="jugador.name"
          placeholder="Nom de Mag/a"
        />

        <button class="login-button" @click="sendNickname(jugador.name)">
          Inicia el teu Viatge
        </button>
      </div>
    </div>
  </div>

  <div class="fondo" v-else-if="!joinedRoom">
    <div class="rooms-page-container">
      <div class="rooms-grid-top">
        <div class="profile-card">
          <img src="../public/img/Aprendiz_Mago.png" alt="Aprenent de Mag" class="profile-avatar" />

          <div class="profile-info">
            <span class="badge">Perfil de l'Aprenent</span>
            <h3>NomUser</h3>
            <h5>Aprenent de màgia</h5>
          </div>

          <p>
            Benvingut, jove aprenent de màgia! El teu viatge cap a la mestria comença ara. Demostra
            el teu valor i habilitat, i la túnica d'un mag de veritat t'espera!
          </p>
        </div>
      </div>
      <div class="actions-container">
        <div class="action-card create-room-card">
          <input v-model="roomInput" placeholder="Nom de la sala" />
          <label> <input type="checkbox" v-model="isPrivateCreation" /> Sala Privada 🔒 </label>
          <button @click="createRoom">Crear una nova sala</button>
        </div>

        <div class="action-card join-private-card">
          <input v-model="privateCodeInput" placeholder="Codi d'Accés (6 dígits)" maxlength="6" />
          <button @click="joinPrivateRoom">Unir-se a Sala Privada amb Codi</button>
        </div>
      </div>
    </div>

    <div class="rooms-grid-bottom">
      <h2>Sales disponibles (Públiques)</h2>
      <ul class="room-list">
        <li v-for="room in rooms" :key="room.name" class="room-item">
          <div class="room-info">
            <strong>{{ room.name }}</strong>
            <span>👥 {{ room.playerCount }} jugadors</span>
            <span v-if="room.beingPlayed" class="status-playing"> | 🎮 En partida</span>
          </div>
          <button @click="joinExistingRoom(room.name)" :disabled="room.beingPlayed">Unir-se</button>
        </li>
      </ul>
    </div>
  </div>

  <div class="fondoLobby" v-else-if="vista === 'preGame'">
    <h2>Sala: {{ currentRoom }}</h2>
    <viewLobby
      :socket-c="socket"
      :llista-jug="jugadors"
      :is-admin="jugador.role === 'admin'"
      :jugador="jugador"
      :room-name="currentRoom"
      :room-state="roomState"
      @leave="leaveRoom"
    />
  </div>

  <div v-else-if="vista === 'game'">
    <div id="jugador">
      <!-- Div on mostrem la informació de la partida (els textos)-->
      <div id="partida">
        <!--Truquem al game Engine i enviem les props que rebrà aquest component-->
        <GameEngine
          :socket="socket"
          :jugador="jugador"
          :llista-jug="jugadors"
          :room-name="currentRoom"
        />
      </div>
      <!--Div on mostrem el temps restant de la partida-->
      <div id="tempsRestant">
        <TempsRestant :temps-inicial="tempsInicial" :socket="socket" />
      </div>
      <!--Div on llistem els usuaris de la partida i els accerts i errors d'aquests-->
      <div id="ranquing">
        <RankingComponent :llista-jug="jugadors" />
      </div>
    </div>
  </div>

  <div v-else-if="vista === 'endGame'">
    <h2>Partida terminada</h2>
    <RankingComponent :llista-jug="jugadors" />

    <div>
      <button @click="leaveRoom" class="btn-leave">Salir de la sala</button>
      <button @click="returnToLobby">Volver al lobby</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { io } from 'socket.io-client'
import RankingComponent from './components/RankingComponent.vue'
import viewLobby from './components/PreGame/lobby/viewLobby.vue'
import GameEngine from './components/Game/GameEngine.vue'
import TempsRestant from './components/Game/TempsRestant.vue'

let socket = null

const rooms = ref([])
const vista = ref('preGame')
const isConnected = ref(false)
const joinedRoom = ref(false)
const jugador = ref({ name: '', id: null, role: 'player' })
const jugadors = ref([])
const tempsInicial = ref(0)

const currentRoom = ref('')
const roomInput = ref('')

const roomState = ref(null)
const isPrivateCreation = ref(false)
const privateCodeInput = ref('')

const notification = ref({ message: '', type: 'info', visible: false })
let notificationTimer = null

function showNotification(message, type = 'info', duration = 3000) {
  // Si ya hay una notificación, la limpia para mostrar la nueva
  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }
  notification.value = { message, type, visible: true }

  notificationTimer = setTimeout(() => {
    notification.value.visible = false
  }, duration)
}

// --- CONEXIÓN Y EVENTOS ---

function tryConn() {
  if (socket && socket.connected) return
  socket = io('http://localhost:3001')

  socket.on('playerRegistered', (playerData) => {
    Object.assign(jugador.value, playerData)
    isConnected.value = true
    loadRooms()
  })

  socket.on('roomList', (list) => {
    rooms.value = list
  })
  socket.on('roomJoined', ({ roomName }) => {
    currentRoom.value = roomName
  })

  socket.on('updateRoomState', (room) => {
    roomState.value = room
    jugadors.value = [...room.players]
    const yo = room.players.find((p) => p.id === jugador.value.id)
    if (yo) Object.assign(jugador.value, yo)

    if (room.config && room.config.time) {
      tempsInicial.value = room.config.time
    }
  })

  socket.on('updateRanking', (ranking) => {
    if (vista.value === 'game') {
      jugadors.value = [...ranking]
    }
  })
  // ESTO CAMBIA LA VISTA A 'game'
  socket.on('gameStarted', ({ time }) => {
    vista.value = 'game'
    tempsInicial.value = time
    showNotification('¡La partida ha començat', 'success')
  })

  socket.on('gameFinished', ({ ranking }) => {
    jugadors.value = [...ranking]
    vista.value = 'endGame'
    showNotification('¡Partida acabada!', 'info')
  })

  socket.on('error', ({ message }) => {
    showNotification(message, 'error')
    if (joinedRoom.value) {
      if (currentRoom.value === '' && !roomState.value) {
        joinedRoom.value = false
        currentRoom.value = ''
        vista.value = 'preGame'
        loadRooms()
      }
    }
  })

  //expulsar al jugador i notificar-lo
  socket.on('kicked', () => {
    showNotification('Has sido expulsado por el admin', 'error', 5000)
    socket.disconnect()
    resetToRoomList()
  })
  //Transferim l'admin
  socket.on('youAreNowAdmin', () => {
    jugador.value.role = 'admin'
    showNotification('¡Eres el nou administrador!', 'info')
  })

  socket.on('lobbyNotification', ({ message, type }) => {
    showNotification(message, type, 4000) // 4 segundos
  })
}

// --- ACCIONES DEL USUARIO ---

function sendNickname(nickname) {
  if (!nickname || nickname.trim() === '') return

  // Generar un ID únic per al jugador abans de connectar
  const playerId = jugador.value.id || Date.now()
  jugador.value.id = playerId
  jugador.value.name = nickname.trim()

  tryConn()

  socket.emit('setPlayerName', {
    name: jugador.value.name,
    id: jugador.value.id,
  })
}

function loadRooms() {
  if (!socket || !socket.connected) tryConn()
  socket.emit('getRoomList')
}

function joinExistingRoom(roomName) {
  if (!socket || !socket.connected) return alert('Socket no conectado. Inténtalo de nuevo.')

  socket.emit('joinRoom', { roomName })
  currentRoom.value = roomName
  joinedRoom.value = true
  vista.value = 'preGame'
}

function joinPrivateRoom() {
  if (!socket || !socket.connected) return alert('Socket no conectado. Inténtalo de nuevo.')
  const code = privateCodeInput.value.trim().toUpperCase()

  if (code.length !== 6) {
    alert('Por favor, introduce el código de 6 dígitos.')
    return
  }

  socket.emit('joinRoom', { accessCode: code })
  joinedRoom.value = true
  vista.value = 'preGame'
  privateCodeInput.value = ''
}

function createRoom() {
  if (!socket || !socket.connected) return alert('Socket no conectado. Inténtalo de nuevo.')
  const name = roomInput.value.trim()
  if (!name) return

  socket.emit('createRoom', {
    roomName: name,
    isPrivate: isPrivateCreation.value,
  })
  currentRoom.value = name
  joinedRoom.value = true
  vista.value = 'preGame'
}

function returnToLobby() {
  if (!socket || !socket.connected) return alert('Socket no conectado. Recarga la página.')
  socket.emit('playAgain', { roomName: currentRoom.value, id: jugador.value.id })
  vista.value = 'preGame'
  tempsInicial.value = -1
}

function leaveRoom() {
  if (!socket || !socket.connected) return alert('Socket no conectado. Recarga la página.')

  // Avisamos al servidor que este jugador abandona la sala
  socket.emit('leaveRoom', { roomName: currentRoom.value, id: jugador.value.id })

  // Volvemos a la lista de salas
  resetToRoomList()
}

function resetToRoomList() {
  joinedRoom.value = false
  currentRoom.value = ''
  vista.value = 'preGame'
  jugadors.value = []
  roomState.value = null
  loadRooms()
}
</script>

<style>
/* 1. CODI PER LA LOGIN PAGE */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap');

body {
  margin: 0;
}
/* Estil global per centrar el contingut */
#app {
  font-family: 'Poppins', sans-serif;
  margin: 0;
  background-color: #15131e;
  color: #f0f0f0;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

button,
input {
  font-family: inherit;
}

/* --- ESTILS DEL CONTENEDOR 'fondo' --- */
.fondo {
  position: relative; /* ¡MUY IMPORTANTE! */
  background: linear-gradient(to bottom, #15131e 32%, #006aff 100%);
  border-radius: 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  padding: 20px;
  width: 98%;
  height: 95%;
  min-width: 98%;
  min-height: 95%;
}

.fondoLobby {
  position: relative; /* ¡MUY IMPORTANTE! */
  background: linear-gradient(to bottom, #15131e 32%, #006aff 100%);
  border-radius: 25px;
  padding: 20px;
  width: 98%;
  height: 95%;
  text-align: center;
}

/* --- ESTILS DEL LOGIN CONTAINER --- */
.login-container {
  position: relative; /* Necesario para que z-index funcione */
  z-index: 2;
  width: 50%;
  text-align: center; /* Centra el texto */
  height: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.login-container .login-title {
  font-weight: 400;
}

.login-container .badge {
  background: linear-gradient(to right, #2c2b53 0%, #6a6aff 100%);
  border-radius: 100px;
  color: white;
  padding: 8px 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.login-container .login-input {
  background-color: transparent;
  border: none;
  outline: none;
  border-bottom: 2px solid #cb95e6;
  color: #f0f0f0;
  width: 70%;
  padding: 10px 0;
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.login-container .login-input::placeholder {
  color: #cb95e6;
  opacity: 1;
}

.login-container .login-button {
  background: linear-gradient(to right, #ffffff 0%, #5866ff 100%);
  color: #15131e;
  border-radius: 100px;
  font-size: 1rem;
  padding: 10px 30px;
  cursor: pointer;
  transition: 0.3s ease-in-out;
  border: solid 1px transparent;
  background-clip: padding-box;
}

.login-container .login-button:hover,
.login-container .login-button:focus {
  background: transparent;
  border-color: #ffffff;
  color: #ffffff;
  outline: none;
}

/* --- ESTILS DELS MAGS (LOGIN) --- */
.mago {
  position: absolute;
  width: 20%;
  height: auto;
  z-index: 1;
}
.mago-obscuro {
  bottom: -80px;
  left: -10px;
  transform: rotate(20deg);
  width: 30%;
}
.mago-tierra {
  bottom: -70px;
  right: 15px;
  transform: rotate(-20deg);
  width: 30%;
}
.mago-fuego {
  top: -130px;
  left: 20px;
  transform: rotate(145deg);
  width: 30%;
}
.mago-angelical {
  top: -150px;
  right: 50px;
  transform: rotate(-150deg);
  width: 31%;
}
/* --- (NOU CSS) ESTILS PÀGINA DE SALES (!joinedRoom) --- */
/* --- (CSS ANTIC) ESTILS DE LES LLISTES DE SALES --- */
/* Mantenim els estils originals per la llista de sales públiques */

.room-list {
  list-style: none;
  padding: 0;
  max-width: 500px;
  margin: 20px auto;
}
.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9; /* Nota: Això ho haurem de canviar per assemblar-se al disseny fosc */
}
.room-info {
  display: flex;
  gap: 15px;
  align-items: center;
}
.room-info strong {
  font-size: 1.1em;
}
.status-playing {
  color: orange;
  font-style: italic;
}
.room-item button {
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.room-item button:hover:not(:disabled) {
  background-color: #0056b3;
}
.room-item button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
hr {
  margin: 30px 0;
  border: 0;
  border-top: 1px solid #eee;
}

.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 8px;
  color: #ffffff;
  z-index: 1000;
  font-weight: 500;
  font-size: 1.1rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease-out;
}

/* Diferents tipus de notificació */
.notification.info {
  background: linear-gradient(to right, #ff058e 0%, #000000 100%);
}

.notification.success {
  background: linear-gradient(to right, #04832100, #1e7e34); /* Verd */
}

.notification.error {
  background: linear-gradient(to right, #ff0202 0%, hsl(337, 100%, 71%) 100%);
}
</style>
