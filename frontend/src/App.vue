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
      <div class="profile-card">
        <img src="../public/img/Aprendiz_Mago.png" alt="Aprenent de Mag" class="profile-avatar" />
        <div class="profile-info">
          <span class="badge">Perfil de l'Aprenent</span>
          <h3>NomUser</h3>
          <h5>Aprenent de màgia</h5>
        </div>
        <p>
          Benvingut, jove <span class="rosa">aprenent de màgia</span>! El teu
          <span class="rosa">viatge</span> cap a la mestria comença ara. Demostra el teu
          <span class="rosa">valor</span> i <span class="rosa">habilitat</span>, i la túnica d'un
          <span class="rosa">mag de veritat</span> t'espera!
        </p>
      </div>

      <div class="actions-container">
        <div class="action-card create-room-card">
          <span class="badge">Crear Sala</span>
          <input v-model="roomInput" placeholder="Nom de la sala" />
          <label> <input type="checkbox" v-model="isPrivateCreation" /> Sala Privada </label>
          <button @click="createRoom">Crear una nova sala</button>
        </div>

        <div class="action-card join-private-card">
          <span class="badge">Unir-se a sala Privada</span>
          <input v-model="privateCodeInput" placeholder="Codi d'Accés (6 dígits)" maxlength="6" />
          <button @click="joinPrivateRoom">Unir-se a Sala Privada</button>
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
            <button @click="joinExistingRoom(room.name)" :disabled="room.beingPlayed">
              Unir-se
            </button>
          </li>
        </ul>
      </div>
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
      <div id="partida">
        <GameEngine
          :socket="socket"
          :jugador="jugador"
          :llista-jug="jugadors"
          :room-name="currentRoom"
          :spell-text="spellText"
          :spell-category="spellCategory"
        />
      </div>
      <div id="tempsRestant">
        <TempsRestant :temps-inicial="tempsInicial" :socket="socket" />
      </div>
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
const spellText = ref([])
const spellCategory = ref('')

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
    if (vista.value === 'endGame') return

    roomState.value = room
    jugadors.value = [...room.players]
    const yo = room.players.find((p) => p.id === jugador.value.id)
    if (yo) Object.assign(jugador.value, yo)

    if (room.config && room.config.time) {
      tempsInicial.value = room.config.time
    }

    if (room.beingPlayed && jugador.value.role === 'spectator') {
      vista.value = 'game'
    }
  })

  socket.on('updateRanking', (ranking) => {
    if (vista.value === 'game') {
      jugadors.value = [...ranking]
    }
  })
  // ESTO CAMBIA LA VISTA A 'game' CUANDO EL SERVIDOR MANDA EL INICIO
  socket.on('gameStarted', ({ time, spellText: newSpellText, category }) => {
    vista.value = 'game'
    tempsInicial.value = time
    spellText.value = newSpellText || []
    spellCategory.value = category || ''
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
/* 1. IMPORTACIONES Y ESTILOS GLOBALES */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap');

body {
  margin: 0;
}

/* Estilo global para centrar el contenido */
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

hr {
  margin: 30px 0;
  border: 0;
  border-top: 1px solid rgba(136, 114, 255, 0.2); /* Borde lila */
}

/* 2. CONTENEDOR PRINCIPAL (FONDO) */
.fondo {
  position: relative; /* ¡MUY IMPORTANTE para los magos! */
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

/* 3. PÁGINA DE LOGIN (!isConnected) */

/* --- Contenedor del formulario --- */
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
  position: relative; /* Necesario para z-index */
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

/* --- Imágenes de Magos (Login) --- */
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

/* 4. PÁGINA DE SALAS (!joinedRoom) */

/* --- Layout principal de la página de salas (Grid) --- */
.rooms-page-container {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  grid-template-rows: auto 1fr;
  gap: 25px; /* Espacio entre los 3 bloques */
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* --- 4.1. Tarjeta de Perfil (Arriba-Izquierda) --- */
.profile-card {
  grid-column: 1 / 2;
  grid-row: 1 / 2;

  /* Estilo "Glassmorphism" */
  background-color: #15131e;
  border: 1px solid #cb95e6;
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  /* Maquetación interna 2x2 */
  display: grid;
  grid-template-columns: auto 1fr; /* Col 1 (avatar) auto, Col 2 (texto) resto */
  grid-template-rows: auto auto; /* Fila 1 (arriba) auto, Fila 2 (texto bajo) auto */
  gap: 8px;
  align-items: center;
}

/* --- 4.2. Contenedor de Acciones (Arriba-Derecha) --- */
.actions-container {
  grid-column: 2 / 3;
  grid-row: 1 / 2;

  /* Layout de 2 columnas */
  display: flex;
  flex-direction: row;
  gap: 20px; /* Espacio ENTRE las 2 tarjetas */
}

/* --- 4.3. Lista de Salas (Abajo) --- */
.rooms-grid-bottom {
  grid-column: 1 / 3; /* Ocupa todo el ancho de abajo */
  grid-row: 2 / 3;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* --- Estilos comunes para las tarjetas (Acciones y Lista) --- */
.actions-container,
.rooms-grid-bottom {
  padding: 25px;
  background-color: #15131e;
  border: 1px solid #cb95e6;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(203, 149, 230, 0.25);
}

/* --- 4.1. (Internos) Tarjeta de Perfil --- */
.profile-avatar {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  width: 90%;
  height: 90%;
  border-radius: 100%; /* Para hacerlo redondo */
  border: 1px solid #a88bff; /* Borde lila */
}

.profile-info {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
}

.profile-info h3,
.profile-info h5 {
  margin: 0;
  margin-left: 5px;
}

.profile-info h3 {
  font-size: 1.8rem;
  color: #ffffff;
}
.profile-info h5 {
  font-size: 1.1rem;
  font-weight: 400;
  color: #d8cfff; /* Un lila/blanco más suave */
}

/* Seleccionamos el paràgrafo <p> HIJO DIRECTO de .profile-card */
.profile-card > p {
  grid-row: 2 / 3; /* Fila 2 (la de abajo) */
  grid-column: 1 / 3; /* Ocupa todo el ancho */
  margin: 0;
  color: #e0e0e0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.profile-card .rosa {
  color: #cb95e6;
}

/* --- 4.2. (Internos) Contenedor de Acciones --- */

/* Badge (común para Perfil y Acciones) */
.profile-card .badge,
.actions-container .badge {
  background: linear-gradient(to right, #7b2cff, #a855f7); /* Morado */
  color: white;
  padding: 6px 16px;
  border-radius: 9999px; /* Forma de píldora */
  font-size: 1rem;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 10px; /* Espacio bajo el badge */
  text-align: center;
  width: 200px;
  align-self: center;
}
/*Es posa sense el border ja que sino semblan botons*/
.actions-container .badge {
  background: none;
}

.action-card {
  flex: 1; /* Cada tarjeta ocupa 50% */
  display: flex;
  flex-direction: column; /* Apila elementos internos verticalmente */
  gap: 15px; /* Espacio entre badge, input, botón, etc. */
}

/* Estilo para inputs de texto dentro de las tarjetas */
.action-card input[placeholder] {
  background-color: #15131e;
  border: 1px solid #cb95e6;
  border-radius: 10px;
  outline: none;
  color: #f0f0f0;
  width: 100%;
  padding: 12px 15px;
  box-sizing: border-box;
  text-align: left;
  font-size: 1rem;
}

.action-card input[placeholder]::placeholder {
  color: #a0a0a0; /* Un gris más suave para el placeholder */
  opacity: 1;
}

/* 1. Estilo del LABEL (el contenedor) como un botón "pill" */
.action-card label {
  display: flex;
  align-items: center;
  justify-content: center; /* Centramos el texto */
  cursor: pointer;
  font-size: 0.95rem;
  color: #e0e0e0;

  /* Estilo "normal" (no marcado) */
  background-color: transparent;
  border: 1px solid #ffffff; /* Borde blanco */
  border-radius: 15px; /* Forma de PÍLDORA */
  padding: 5px 10px; /* Padding */
  transition: 0.2s ease-in-out;

  width: 50%; /* Ancho del toggle */
}

/* 2. Ocultamos el checkbox real */
.action-card label input[type='checkbox'] {
  display: none; /* Lo ocultamos */
}

/* 3. Estilo CUANDO ESTÁ MARCADO (usando :has()) */
.action-card label:has(input[type='checkbox']:checked) {
  /* Estilo activo (verde) */
  background: linear-gradient(to right, #046e04, #55f79e);
  border-color: #45ce99;
  color: #ffffff;
}

/* 4. Hover para el estado normal */
.action-card label:not(:has(input[type='checkbox']:checked)):hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 5. Focus para accesibilidad */
.action-card label:has(input[type='checkbox']:focus-visible) {
  outline: 2px solid #6a6aff;
  outline-offset: 2px;
}

.action-card button {
  background-color: white;
  color: #15131e; /* Text oscuro */
  border: none;
  border-radius: 5px;
  width: 100%; /* Ocupa todo el ancho */
  padding: 12px 15px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

/* Efecto Hover (brillantor) */
.action-card button:hover,
.action-card button:focus {
  border-radius: 15px;
}

/* --- 4.3. (Internos) Lista de Salas --- */
.rooms-grid-bottom h2 {
  margin: 0;
  flex-shrink: 0;
}

.room-list {
  list-style: none;
  padding: 0;
  max-width: 100%;
  margin: 5px 0;
  flex-grow: 1; /* Hace que la lista ocupe el espacio vertical disponible */
  overflow-y: auto; /* AÑADE EL SCROLL AQUÍ */

  padding-right: 10px; /* Espacio para la barra de scroll */
}

/* Estilos de la barra de scroll (Webkit) */
.room-list::-webkit-scrollbar {
  width: 12px; /* Ancho de la barra */
}

.room-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
}

.room-list::-webkit-scrollbar-thumb {
  background-color: #a855f7; /* Color lila */
  border-radius: 10px;
  border: 3px solid #15131e; /* Borde oscuro para "separar" */
}

.room-list::-webkit-scrollbar-thumb:hover {
  background-color: #b875ff; /* Lila más claro */
}

.room-list::-webkit-scrollbar-corner {
  background: transparent;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  margin-bottom: 8px;
  /* Estilo oscuro para la lista */
  border: 1px solid rgba(136, 114, 255, 0.2);
  border-radius: 10px;
  background-color: rgba(21, 19, 30, 0.5);
  color: #f0f0f0;
}

.room-item button {
  background-color: #f0f0f0; /* Fondo gris claro */
  color: #15131e; /* Texto oscuro */
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 6px 14px; /* Padding más pequeño */
  font-size: 0.85rem; /* Fuente más pequeña */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.room-item button:hover,
.room-item button:focus {
  background-color: rgba(0, 0, 0, 0); /* Transparente */
  color: #f0f0f0; /* Texto claro */
}

.room-info {
  display: flex;
  gap: 15px;
  align-items: center;
}
.room-info strong {
  font-size: 1.1em;
  color: #ffffff;
}
.status-playing {
  color: #ffaa00; /* Naranja para "En partida" */
  font-style: italic;
}

.room-item button:hover:not(:disabled) {
  opacity: 0.8;
}
.room-item button:disabled {
  background-color: #555;
  background: #555;
  color: #999;
  cursor: not-allowed;
  opacity: 0.7;
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
