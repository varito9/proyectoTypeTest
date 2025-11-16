<template>
  <div v-if="notification.visible" :class="['notification', notification.type]">
    <span class="notification-message">{{ notification.message }}</span>
  </div>
  <div v-if="isPortalActive" class="portal-overlay centrar">
    <div class="portal-frame">
      <div class="portal"></div>
    </div>
  </div>

  <div class="fondo" v-if="!isConnected">
    <div class="epic-login-container">
      <div class="magic-particles-login">
        <div class="particle-layer-login particle-layer-login-1"></div>
        <div class="particle-layer-login particle-layer-login-2"></div>
        <div class="particle-layer-login particle-layer-login-3"></div>
        <div class="particle-layer-login particle-layer-login-4"></div>
        <div class="particle-layer-login particle-layer-login-5"></div>
      </div>

      <img class="mago mago-fuego" src="/img/MagoFuego-removebg-preview.png" alt="Mag de foc" />
      <img
        class="mago mago-angelical"
        src="/img/MagoAngelical-removebg-preview.png"
        alt="Mag Angelical"
      />
      <img class="mago mago-obscuro" src="/img/MagoObscuro-removebg-preview.png" alt="Mag Obscur" />
      <img class="mago mago-tierra" src="/img/MagoTierra-removebg-preview.png" alt="Mag de Terra" />
      <!-- <img
        class="mago mago-hielo"
        src="/img/MagoHielo.png"
        alt="Mag de Hielo"
      />
      <img
        class="mago mago-agua"
        src="/img/MagoAgua.png"
        alt="Mag de Agua"
      /> -->

      <h1 class="epic-title">MagicTypeRoyale</h1>

      <div class="login-form">
        <input
          type="text"
          id="username"
          class="login-input"
          v-model="jugador.name"
          placeholder="Nom de Mag/a"
          @keydown.enter="sendNickname(jugador.name)"
        />

        <button class="login-button" @click="sendNickname(jugador.name)">Entra a la Batalla</button>
      </div>
    </div>
  </div>

  <div class="fondo" v-else-if="!joinedRoom">
    <!-- Partículas mágicas flotantes -->
    <div class="magic-particles">
      <div class="particle-layer particle-layer-1"></div>
      <div class="particle-layer particle-layer-2"></div>
      <div class="particle-layer particle-layer-3"></div>
      <div class="particle-layer particle-layer-4"></div>
      <div class="particle-layer particle-layer-5"></div>
    </div>

    <div class="rooms-page-container">
      <div class="profile-card">
        <div class="profile-avatar-wrapper">
          <img src="/img/Aprendiz_Mago.png" alt="Aprenent de Mag" class="profile-avatar" />
        </div>
        <div class="profile-info">
          <span class="badge">Perfil de l'aprenent</span>
          <span class="profile-label">Nom del mag</span>
          <h3>{{ jugador.name }}</h3>
          <span class="profile-label">Títol del mag</span>
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
          <span class="badge">Obrir un portal</span>
          <input v-model="roomInput" placeholder="Anomena el teu portal..." />
          <label> <input type="checkbox" v-model="isPrivateCreation" />Portal Privat</label>
          <button @click="createRoom">Activar portal</button>
        </div>

        <div class="action-card join-private-card">
          <span class="badge">Unir-se a portal privat</span>
          <input
            v-model="privateCodeInput"
            placeholder="Contrasenya Arcana (6 digits)"
            maxlength="6"
          />
          <button @click="joinPrivateRoom">Entrar al portal privat</button>
        </div>
      </div>

      <div class="rooms-grid-bottom">
        <h2>Portals detectats</h2>
        <ul class="room-list">
          <li v-for="room in rooms" :key="room.name" class="room-item">
            <div class="room-info">
              <strong>{{ room.name }}</strong>
              <span>👥 {{ room.playerCount }}/6 mags</span>
              <span v-if="room.beingPlayed" class="status-playing"> | 🎮 En partida</span>
            </div>
            <button @click="joinExistingRoom(room.name)">Creuar portal</button>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="fondoLobby" v-else-if="vista === 'preGame'">
    <!-- Partículas mágicas flotantes para Lobby -->
    <div class="magic-particles-lobby">
      <div class="particle-layer-lobby particle-layer-lobby-1"></div>
      <div class="particle-layer-lobby particle-layer-lobby-2"></div>
      <div class="particle-layer-lobby particle-layer-lobby-3"></div>
      <div class="particle-layer-lobby particle-layer-lobby-4"></div>
      <div class="particle-layer-lobby particle-layer-lobby-5"></div>
    </div>

    <div class="lobby-header">
      <span class="lobby-label">Nom portal</span>
      <h1 class="lobby-room-name">{{ currentRoom }}</h1>
      <p class="lobby-subtitle">
        Abraça el teu poder arcà i dirigeix la sala com un autèntic mag. Com més flueixis amb la
        màgia, més llegendari serà el vostre duel.
      </p>
    </div>
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

  <div class="fondoLobby" v-else-if="vista === 'game'">
    <div class="game-layout">
      <div class="game-main">
        <GameEngine
          :socket="socket"
          :jugador="jugador"
          :llista-jug="jugadors"
          :room-name="currentRoom"
          :spell-text="spellText"
          :spell-category="spellCategory"
        />
      </div>
      <aside class="game-sidebar">
        <div class="game-timer">
          <TempsRestant :temps-inicial="tempsInicial" :socket="socket" />
        </div>
        <div class="game-ranking">
          <RankingComponent :llista-jug="jugadors" />
        </div>
      </aside>
    </div>
  </div>

  <div class="fondoLobby" v-else-if="vista === 'bookAnimation'">
    <BookAnimation :nextView="'game'" @animation-finished="handleAnimationFinished" />
  </div>

  <div v-else-if="vista === 'endGame'" class="fondo">
    <div class="ranking">
      <h2>Partida acabada</h2>
      <RankingComponent :llista-jug="jugadors" />
    </div>
    <div class="botonesEndGame">
      <button @click="returnToLobby" class="btn-time">Seguir en el portal</button>
      <button @click="leaveRoom" class="btn salir">Sortir del portal</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { socket } from './socket.js' // Importa la instancia centralizada
import RankingComponent from './components/RankingComponent.vue'
import viewLobby from './components/PreGame/lobby/viewLobby.vue'
import BookAnimation from './components/BookAnimation.vue'
import GameEngine from './components/Game/GameEngine.vue'
import TempsRestant from './components/Game/TempsRestant.vue'

const rooms = ref([])
const vista = ref('preGame')
const isConnected = ref(false) // Estado de la aplicación: el usuario ha introducido nombre
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
const isPortalActive = ref(false)

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

// --- CONEXIÓN Y EVENTOS (se definen una sola vez) ---

socket.on('connect', () => {
  // Si el jugador ya tenía un nombre (p.ej., por reconexión),
  // lo re-registramos en el servidor.
  if (jugador.value.name) {
    socket.emit('setPlayerName', {
      name: jugador.value.name,
      id: jugador.value.id,
    })
  }
})

socket.on('playerRegistered', (playerData) => {
  Object.assign(jugador.value, playerData)
  isConnected.value = true // El jugador está "logueado"
  loadRooms()
})

socket.on('roomList', (list) => {
  rooms.value = list
})
socket.on('roomJoined', ({ roomName }) => {
  setTimeout(() => {
    isPortalActive.value = false // Cierra el portal
    currentRoom.value = roomName
    //si el servidor envia que hem entrar a la sala, cambiem de vista i cambiem el valor de joinedRoom
    joinedRoom.value = true
    vista.value = 'preGame'
  }, 3000)
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

socket.on('updateRanking', ({ ranking }) => {
  if (vista.value === 'game') {
    jugadors.value = [...ranking]
  }
})
// ESTO CAMBIA LA VISTA A 'bookAnimation' CUANDO EL SERVIDOR MANDA EL INICIO
socket.on('gameStarted', ({ time, spellText: newSpellText, category }) => {
  vista.value = 'bookAnimation'
  tempsInicial.value = time
  spellText.value = newSpellText || []
  spellCategory.value = category || ''
  showNotification('La partida ha començat', 'success')
})

socket.on('gameFinished', ({ ranking }) => {
  jugadors.value = [...ranking]
  vista.value = 'endGame'
})

socket.on('error', ({ message }) => {
  isPortalActive.value = false
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
  showNotification('Has sigut expulsat del Portal', 'error', 5000)
  resetToRoomList()
})

socket.on('roomCreated', ({ roomName }) => {
  setTimeout(() => {
    isPortalActive.value = false // Cierra el portal

    // La lógica que tenías para entrar al lobby
    currentRoom.value = roomName
    joinedRoom.value = true
    vista.value = 'preGame'
    showNotification(`Portal ${roomName} activat`, 'info', 3000)
  }, 3000) // 5000 ms = 5 segundos
})

//Transferim l'admin
socket.on('youAreNowAdmin', () => {
  jugador.value.role = 'admin'
  showNotification('Ets el nou administrador!', 'info')
})

socket.on('lobbyNotification', ({ message, type }) => {
  showNotification(message, type, 4000) // 4 segundos
})

socket.on('roomAlreadyCreated', ({ message }) => {
  isPortalActive.value = false

  showNotification(message, 4000)
})

// --- ACCIONES DEL USUARIO ---

function tryConn() {
  if (socket.connected) return
  socket.connect()
}

function sendNickname(nickname) {
  const trimmedName = nickname.trim()
  if (!trimmedName) {
    showNotification("Has d'introduir un nom", 'error')
    return
  }
  if (trimmedName.length > 15) {
    showNotification('El nom no pot tenir més de 15 caràcters', 'error')
    return
  }
  // Generar un ID únic per al jugador abans de connectar
  const playerId = jugador.value.id || Date.now()
  jugador.value.id = playerId
  jugador.value.name = trimmedName

  tryConn() // Asegura que el socket esté conectando

  // El cliente de socket.io encola los eventos si no está conectado,
  // así que podemos emitir inmediatamente.
  socket.emit('setPlayerName', {
    name: jugador.value.name,
    id: jugador.value.id,
  })
}

function loadRooms() {
  tryConn() // Asegura la conexión antes de pedir la lista de salas
  socket.emit('getRoomList')
}

function joinExistingRoom(roomName) {
  if (!socket || !socket.connected) return alert('Socket no conectat. Intenta-ho de nou.')

  isPortalActive.value = true
  socket.emit('joinRoom', { roomName })
  currentRoom.value = roomName
}

function joinPrivateRoom() {
  if (!socket || !socket.connected) return alert('Socket no conectat. Intenta-ho de nou.')
  const code = privateCodeInput.value.trim().toUpperCase()

  if (code.length !== 6) {
    showNotification('El codi ha de tenir 6 dígits', 'error')
    return
  }
  isPortalActive.value = true

  socket.emit('joinRoom', { accessCode: code })
  privateCodeInput.value = ''
}

function createRoom() {
  if (!socket || !socket.connected) return alert('Socket no conectat. Intenta-ho de nou.')
  const name = roomInput.value.trim()

  if (!name) {
    showNotification('El portal ha de tenir un nom', 'error')
    return
  }
  if (name.length > 15) {
    showNotification('El nom del portal no pot tenir més de 15 caràcters', 'error')
    return
  }
  isPortalActive.value = true
  socket.emit('createRoom', {
    roomName: name,
    isPrivate: isPrivateCreation.value,
  })
}

function returnToLobby() {
  if (!socket || !socket.connected) return alert('Socket no conectat. Torna a carregar la pàgina.')
  socket.emit('playAgain', { roomName: currentRoom.value, id: jugador.value.id })
  vista.value = 'preGame'
  tempsInicial.value = -1
}

function leaveRoom() {
  if (!socket || !socket.connected) return alert('Socket no conectat. Torna a carregar la pàgina.')

  // Avisamos al servidor que este jugador abandona la sala
  socket.emit('leaveRoom', { roomName: currentRoom.value, id: jugador.value.id })
  resetToRoomList()
}

function resetToRoomList() {
  joinedRoom.value = false
  currentRoom.value = ''
  vista.value = 'preGame'
  jugadors.value = []
  roomState.value = null
  jugador.value.role = 'player'
  loadRooms()
}

function handleAnimationFinished() {
  vista.value = 'game'
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
.epic-login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: relative;
  z-index: 2;
}

.epic-title {
  font-family: 'Cinzel', serif;
  font-size: 5rem;
  font-weight: 700;
  color: #fff;
  text-shadow:
    0 0 10px #fff,
    0 0 20px #fff,
    0 0 30px #ff00ff,
    0 0 40px #ff00ff,
    0 0 50px #ff00ff,
    0 0 60px #ff00ff,
    0 0 70px #ff00ff;
  margin-bottom: 2rem;
  animation: flicker 1.5s infinite alternate;
  z-index: 3;
}

.mago {
  position: absolute;
  width: 25%; /* Adjusted size to fit all mages */
  height: auto;
  z-index: 2;
  transition: transform 0.3s ease-in-out;
}
.mago-obscuro {
  bottom: 0;
  left: 0;
  transform: rotate(15deg);
}
.mago-tierra {
  bottom: 0;
  right: 0;
  transform: rotate(-15deg);
}
.mago-fuego {
  top: 0;
  left: 0;
  transform: rotate(-15deg) scaleX(-1); /* Flipped to face inwards */
}
.mago-angelical {
  top: 0;
  right: 0;
  transform: rotate(15deg) scaleX(-1); /* Flipped to face inwards */
}
/* .mago-hielo {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30%;
}
.mago-agua {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30%;
} */

.login-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  z-index: 3;
}

.login-input {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #8a2be2;
  border-radius: 50px;
  color: #fff;
  font-size: 1.2rem;
  padding: 0.8rem 1.5rem;
  text-align: center;
  width: 300px;
  transition: all 0.3s ease;
}

.login-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.login-input:focus {
  outline: none;
  border-color: #ff00ff;
  box-shadow: 0 0 15px #ff00ff;
}

.login-button {
  background: linear-gradient(45deg, #8a2be2, #ff00ff);
  border: none;
  border-radius: 50px;
  color: #fff;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0.8rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
}

.login-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(255, 0, 255, 0.8);
}

@keyframes flicker {
  0%,
  18%,
  22%,
  25%,
  53%,
  57%,
  100% {
    text-shadow:
      0 0 10px #fff,
      0 0 20px #fff,
      0 0 30px #ff00ff,
      0 0 40px #ff00ff,
      0 0 50px #ff00ff,
      0 0 60px #ff00ff,
      0 0 70px #ff00ff;
  }
  20%,
  24%,
  55% {
    text-shadow: none;
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* --- Partículas Mágicas Flotantes para Login --- */
.magic-particles-login {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.particle-layer-login {
  position: absolute;
  width: 100%;
  height: 100%;
  background-repeat: repeat;
  opacity: 0.9;
}

/* Capa 1: Partículas doradas grandes y brillantes */
.particle-layer-login-1 {
  background-image:
    radial-gradient(8px 8px at 8% 15%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 25% 45%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(10px 10px at 45% 75%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(7px 7px at 65% 25%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(9px 9px at 85% 55%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 12% 65%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(8px 8px at 92% 12%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(7px 7px at 35% 8%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(9px 9px at 75% 88%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 18% 92%, rgba(255, 215, 0, 0.9), transparent);
  background-size: 200% 200%;
  animation: float-particles-login-1 20s ease-in-out infinite;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.8));
}

/* Capa 2: Partículas blancas brillantes medianas */
.particle-layer-login-2 {
  background-image:
    radial-gradient(5px 5px at 15% 28%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 55% 68%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(4px 4px at 78% 12%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(7px 7px at 22% 88%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(5px 5px at 72% 48%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 42% 22%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(4px 4px at 88% 78%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(7px 7px at 5% 58%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(5px 5px at 38% 95%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 95% 35%, rgba(255, 255, 255, 0.95), transparent);
  background-size: 180% 180%;
  animation: float-particles-login-2 25s ease-in-out infinite;
  animation-delay: -3s;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.9));
}

/* Capa 3: Partículas púrpuras mágicas */
.particle-layer-login-3 {
  background-image:
    radial-gradient(6px 6px at 32% 38%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 62% 18%, rgba(168, 139, 255, 0.95), transparent),
    radial-gradient(7px 7px at 12% 58%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(5px 5px at 82% 38%, rgba(168, 139, 255, 0.9), transparent),
    radial-gradient(6px 6px at 52% 78%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 28% 13%, rgba(168, 139, 255, 0.95), transparent),
    radial-gradient(7px 7px at 92% 68%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(5px 5px at 48% 88%, rgba(168, 139, 255, 0.9), transparent),
    radial-gradient(6px 6px at 72% 23%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 18% 82%, rgba(168, 139, 255, 0.95), transparent);
  background-size: 160% 160%;
  animation: float-particles-login-3 30s ease-in-out infinite;
  animation-delay: -6s;
  filter: drop-shadow(0 0 4px rgba(168, 139, 255, 0.8));
}

/* Capa 4: Partículas brillantes pequeñas (efecto sparkle intenso) */
.particle-layer-login-4 {
  background-image:
    radial-gradient(3px 3px at 10% 20%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 35% 52%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(2px 2px at 60% 32%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 85% 72%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(2px 2px at 20% 82%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 75% 12%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(2px 2px at 45% 62%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(3px 3px at 90% 42%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(2px 2px at 15% 5%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 65% 92%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(2px 2px at 30% 28%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 80% 58%, rgba(255, 255, 255, 1), transparent);
  background-size: 150% 150%;
  animation:
    float-particles-login-4 18s ease-in-out infinite,
    sparkle-particles-login 3s ease-in-out infinite;
  animation-delay: -9s, 0s;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 1));
}

/* Capa 5: Partículas doradas pequeñas adicionales */
.particle-layer-login-5 {
  background-image:
    radial-gradient(4px 4px at 5% 30%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 40% 15%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 70% 45%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 25% 70%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 88% 25%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 50% 85%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 15% 50%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 95% 65%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 60% 10%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 35% 95%, rgba(255, 215, 0, 0.9), transparent);
  background-size: 170% 170%;
  animation: float-particles-login-5 22s ease-in-out infinite;
  animation-delay: -12s;
  filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.7));
}

/* Animaciones de flotación para Login */
@keyframes float-particles-login-1 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      75% 88%,
      18% 92%;
    transform: translate(0, 0);
  }
  25% {
    background-position:
      10% 10%,
      30% 40%,
      50% 60%,
      70% 80%,
      90% 20%,
      25% 80%,
      95% 25%,
      50% 20%,
      85% 98%,
      28% 102%;
    transform: translate(8px, -15px);
  }
  50% {
    background-position:
      20% 20%,
      40% 50%,
      60% 70%,
      80% 90%,
      100% 30%,
      35% 90%,
      105% 35%,
      60% 30%,
      95% 108%,
      38% 112%;
    transform: translate(-8px, -25px);
  }
  75% {
    background-position:
      10% 10%,
      30% 40%,
      50% 60%,
      70% 80%,
      90% 20%,
      25% 80%,
      95% 25%,
      50% 20%,
      85% 98%,
      28% 102%;
    transform: translate(8px, -15px);
  }
}

@keyframes float-particles-login-2 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      25% 90%,
      75% 50%,
      45% 25%,
      38% 95%,
      95% 35%;
    transform: translate(0, 0);
  }
  33% {
    background-position:
      -10% 10%,
      10% 40%,
      30% 60%,
      50% 80%,
      70% 20%,
      15% 100%,
      65% 60%,
      35% 35%,
      28% 105%,
      85% 45%;
    transform: translate(-12px, 8px);
  }
  66% {
    background-position:
      10% -10%,
      30% 20%,
      50% 40%,
      70% 60%,
      90% 0%,
      35% 80%,
      85% 40%,
      55% 15%,
      48% 85%,
      105% 25%;
    transform: translate(12px, -8px);
  }
}

@keyframes float-particles-login-3 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 60%,
      85% 40%,
      55% 80%,
      25% 15%,
      18% 82%;
    transform: translate(0, 0);
  }
  25% {
    background-position:
      15% 15%,
      35% 45%,
      55% 65%,
      75% 85%,
      95% 25%,
      30% 75%,
      100% 55%,
      70% 95%,
      40% 30%,
      33% 97%;
    transform: translate(10px, 10px);
  }
  50% {
    background-position:
      -15% -15%,
      5% 15%,
      25% 35%,
      45% 55%,
      65% 5%,
      0% 45%,
      70% 25%,
      40% 65%,
      10% 0%,
      3% 67%;
    transform: translate(-10px, -10px);
  }
  75% {
    background-position:
      15% 15%,
      35% 45%,
      55% 65%,
      75% 85%,
      95% 25%,
      30% 75%,
      100% 55%,
      70% 95%,
      40% 30%,
      33% 97%;
    transform: translate(10px, 10px);
  }
}

@keyframes float-particles-login-4 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      65% 90%,
      18% 5%,
      30% 28%,
      80% 58%;
    transform: translate(0, 0);
  }
  50% {
    background-position:
      20% 20%,
      40% 50%,
      60% 70%,
      80% 90%,
      100% 30%,
      35% 90%,
      105% 35%,
      60% 30%,
      85% 110%,
      38% 25%,
      50% 48%,
      100% 78%;
    transform: translate(-6px, 6px);
  }
}

@keyframes float-particles-login-5 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      60% 10%,
      35% 95%;
    transform: translate(0, 0);
  }
  33% {
    background-position:
      12% 12%,
      32% 42%,
      52% 62%,
      72% 82%,
      92% 22%,
      27% 82%,
      97% 27%,
      52% 22%,
      72% 22%,
      47% 107%;
    transform: translate(7px, -12px);
  }
  66% {
    background-position:
      -12% -12%,
      8% 18%,
      28% 38%,
      48% 58%,
      68% -2%,
      3% 58%,
      73% 3%,
      28% -2%,
      48% -2%,
      23% 83%;
    transform: translate(-7px, 12px);
  }
}

@keyframes sparkle-particles-login {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* --- Contenedor del formulario --- */
.fondoLobby {
  position: relative; /* ¡MUY IMPORTANTE! */
  background: linear-gradient(180deg, #141021 0%, #1c1535 38%, #0057ff 100%);
  border-radius: 25px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  padding: 40px 60px;
  width: 98%;
  height: 95%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
  overflow: hidden;
}

/* --- Partículas Mágicas Flotantes para Lobby --- */
.magic-particles-lobby {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.particle-layer-lobby {
  position: absolute;
  width: 100%;
  height: 100%;
  background-repeat: repeat;
  opacity: 0.9;
}

/* Capa 1: Partículas doradas grandes y brillantes */
.particle-layer-lobby-1 {
  background-image:
    radial-gradient(8px 8px at 8% 15%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 25% 45%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(10px 10px at 45% 75%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(7px 7px at 65% 25%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(9px 9px at 85% 55%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 12% 65%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(8px 8px at 92% 12%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(7px 7px at 35% 8%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(9px 9px at 75% 88%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 18% 92%, rgba(255, 215, 0, 0.9), transparent);
  background-size: 200% 200%;
  animation: float-particles-lobby-1 20s ease-in-out infinite;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.8));
}

/* Capa 2: Partículas blancas brillantes medianas */
.particle-layer-lobby-2 {
  background-image:
    radial-gradient(5px 5px at 15% 28%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 55% 68%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(4px 4px at 78% 12%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(7px 7px at 22% 88%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(5px 5px at 72% 48%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 42% 22%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(4px 4px at 88% 78%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(7px 7px at 5% 58%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(5px 5px at 38% 95%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 95% 35%, rgba(255, 255, 255, 0.95), transparent);
  background-size: 180% 180%;
  animation: float-particles-lobby-2 25s ease-in-out infinite;
  animation-delay: -3s;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.9));
}

/* Capa 3: Partículas púrpuras mágicas */
.particle-layer-lobby-3 {
  background-image:
    radial-gradient(6px 6px at 32% 38%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 62% 18%, rgba(168, 139, 255, 0.95), transparent),
    radial-gradient(7px 7px at 12% 58%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(5px 5px at 82% 38%, rgba(168, 139, 255, 0.9), transparent),
    radial-gradient(6px 6px at 52% 78%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 28% 13%, rgba(168, 139, 255, 0.95), transparent),
    radial-gradient(7px 7px at 92% 68%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(5px 5px at 48% 88%, rgba(168, 139, 255, 0.9), transparent),
    radial-gradient(6px 6px at 72% 23%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 18% 82%, rgba(168, 139, 255, 0.95), transparent);
  background-size: 160% 160%;
  animation: float-particles-lobby-3 30s ease-in-out infinite;
  animation-delay: -6s;
  filter: drop-shadow(0 0 4px rgba(168, 139, 255, 0.8));
}

/* Capa 4: Partículas brillantes pequeñas (efecto sparkle intenso) */
.particle-layer-lobby-4 {
  background-image:
    radial-gradient(3px 3px at 10% 20%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 35% 52%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(2px 2px at 60% 32%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 85% 72%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(2px 2px at 20% 82%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 75% 12%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(2px 2px at 45% 62%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(3px 3px at 90% 42%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(2px 2px at 15% 5%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 65% 92%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(2px 2px at 30% 28%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 80% 58%, rgba(255, 255, 255, 1), transparent);
  background-size: 150% 150%;
  animation:
    float-particles-lobby-4 18s ease-in-out infinite,
    sparkle-particles-lobby 3s ease-in-out infinite;
  animation-delay: -9s, 0s;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 1));
}

/* Capa 5: Partículas doradas pequeñas adicionales */
.particle-layer-lobby-5 {
  background-image:
    radial-gradient(4px 4px at 5% 30%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 40% 15%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 70% 45%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 25% 70%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 88% 25%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 50% 85%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 15% 50%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 95% 65%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 60% 10%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 35% 95%, rgba(255, 215, 0, 0.9), transparent);
  background-size: 170% 170%;
  animation: float-particles-lobby-5 22s ease-in-out infinite;
  animation-delay: -12s;
  filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.7));
}

/* Animaciones de flotación para Lobby */
@keyframes float-particles-lobby-1 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      75% 88%,
      18% 92%;
    transform: translate(0, 0);
  }
  25% {
    background-position:
      10% 10%,
      30% 40%,
      50% 60%,
      70% 80%,
      90% 20%,
      25% 80%,
      95% 25%,
      50% 20%,
      85% 98%,
      28% 102%;
    transform: translate(8px, -15px);
  }
  50% {
    background-position:
      20% 20%,
      40% 50%,
      60% 70%,
      80% 90%,
      100% 30%,
      35% 90%,
      105% 35%,
      60% 30%,
      95% 108%,
      38% 112%;
    transform: translate(-8px, -25px);
  }
  75% {
    background-position:
      10% 10%,
      30% 40%,
      50% 60%,
      70% 80%,
      90% 20%,
      25% 80%,
      95% 25%,
      50% 20%,
      85% 98%,
      28% 102%;
    transform: translate(8px, -15px);
  }
}

@keyframes float-particles-lobby-2 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      25% 90%,
      75% 50%,
      45% 25%,
      38% 95%,
      95% 35%;
    transform: translate(0, 0);
  }
  33% {
    background-position:
      -10% 10%,
      10% 40%,
      30% 60%,
      50% 80%,
      70% 20%,
      15% 100%,
      65% 60%,
      35% 35%,
      28% 105%,
      85% 45%;
    transform: translate(-12px, 8px);
  }
  66% {
    background-position:
      10% -10%,
      30% 20%,
      50% 40%,
      70% 60%,
      90% 0%,
      35% 80%,
      85% 40%,
      55% 15%,
      48% 85%,
      105% 25%;
    transform: translate(12px, -8px);
  }
}

@keyframes float-particles-lobby-3 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 60%,
      85% 40%,
      55% 80%,
      25% 15%,
      18% 82%;
    transform: translate(0, 0);
  }
  25% {
    background-position:
      15% 15%,
      35% 45%,
      55% 65%,
      75% 85%,
      95% 25%,
      30% 75%,
      100% 55%,
      70% 95%,
      40% 30%,
      33% 97%;
    transform: translate(10px, 10px);
  }
  50% {
    background-position:
      -15% -15%,
      5% 15%,
      25% 35%,
      45% 55%,
      65% 5%,
      0% 45%,
      70% 25%,
      40% 65%,
      10% 0%,
      3% 67%;
    transform: translate(-10px, -10px);
  }
  75% {
    background-position:
      15% 15%,
      35% 45%,
      55% 65%,
      75% 85%,
      95% 25%,
      30% 75%,
      100% 55%,
      70% 95%,
      40% 30%,
      33% 97%;
    transform: translate(10px, 10px);
  }
}

@keyframes float-particles-lobby-4 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      65% 90%,
      18% 5%,
      30% 28%,
      80% 58%;
    transform: translate(0, 0);
  }
  50% {
    background-position:
      20% 20%,
      40% 50%,
      60% 70%,
      80% 90%,
      100% 30%,
      35% 90%,
      105% 35%,
      60% 30%,
      85% 110%,
      38% 25%,
      50% 48%,
      100% 78%;
    transform: translate(-6px, 6px);
  }
}

@keyframes float-particles-lobby-5 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      60% 10%,
      35% 95%;
    transform: translate(0, 0);
  }
  33% {
    background-position:
      12% 12%,
      32% 42%,
      52% 62%,
      72% 82%,
      92% 22%,
      27% 82%,
      97% 27%,
      52% 22%,
      72% 22%,
      47% 107%;
    transform: translate(7px, -12px);
  }
  66% {
    background-position:
      -12% -12%,
      8% 18%,
      28% 38%,
      48% 58%,
      68% -2%,
      3% 58%,
      73% 3%,
      28% -2%,
      48% -2%,
      23% 83%;
    transform: translate(-7px, 12px);
  }
}

@keyframes sparkle-particles-lobby {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

.game-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.game-main {
  background: rgba(15, 12, 30, 0.65);
  border: 1px solid rgba(136, 114, 255, 0.35);
  border-radius: 22px;
  padding: 0;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.game-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.game-timer {
  flex: 0 0 auto;
  display: flex;
  justify-content: center; /* centra horitzontalment el títol del temps */
}

.lobby-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: -10px;
  position: relative;
  z-index: 2;
}

.lobby-label {
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #bba8ff;
}

.lobby-room-name {
  margin: -20px 0 0 0;
  font-size: 4rem;
  font-weight: 300;
  color: #f5f0ff;
  letter-spacing: 0.02em;
}

.lobby-subtitle {
  margin: 4px 0 0 0;
  font-size: 1.15rem;
  max-width: 640px;
  color: rgba(229, 223, 255, 0.78);
  line-height: 1.6;
}

/* --- ESTILS DEL LOGIN CONTAINER --- */
.login-container {
  position: relative; /* Necesario para z-index */
  z-index: 3;
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
  z-index: 2;
}
.mago-obscuro {
  bottom: -80px;
  left: -100px;
  transform: rotate(20deg);
  width: 35%;
}
.mago-tierra {
  bottom: -160px;
  right: 0px;
  transform: rotate(-20deg);
  width: 37%;
}
.mago-fuego {
  top: -190px;
  left: -50px;
  transform: rotate(145deg);
  width: 35%;
}
.mago-angelical {
  top: -230px;
  right: 50px;
  transform: rotate(-150deg);
  width: 35%;
}

/* 4. PÁGINA DE SALAS (!joinedRoom) */

/* --- Partículas Mágicas Flotantes --- */
.magic-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.particle-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  background-repeat: repeat;
  opacity: 0.9;
}

/* Capa 1: Partículas doradas grandes y brillantes */
.particle-layer-1 {
  background-image:
    radial-gradient(8px 8px at 8% 15%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 25% 45%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(10px 10px at 45% 75%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(7px 7px at 65% 25%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(9px 9px at 85% 55%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 12% 65%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(8px 8px at 92% 12%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(7px 7px at 35% 8%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(9px 9px at 75% 88%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(6px 6px at 18% 92%, rgba(255, 215, 0, 0.9), transparent);
  background-size: 200% 200%;
  animation: float-particles-1 20s ease-in-out infinite;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.8));
}

/* Capa 2: Partículas blancas brillantes medianas */
.particle-layer-2 {
  background-image:
    radial-gradient(5px 5px at 15% 28%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 55% 68%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(4px 4px at 78% 12%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(7px 7px at 22% 88%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(5px 5px at 72% 48%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 42% 22%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(4px 4px at 88% 78%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(7px 7px at 5% 58%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(5px 5px at 38% 95%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(6px 6px at 95% 35%, rgba(255, 255, 255, 0.95), transparent);
  background-size: 180% 180%;
  animation: float-particles-2 25s ease-in-out infinite;
  animation-delay: -3s;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.9));
}

/* Capa 3: Partículas púrpuras mágicas */
.particle-layer-3 {
  background-image:
    radial-gradient(6px 6px at 32% 38%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 62% 18%, rgba(168, 139, 255, 0.95), transparent),
    radial-gradient(7px 7px at 12% 58%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(5px 5px at 82% 38%, rgba(168, 139, 255, 0.9), transparent),
    radial-gradient(6px 6px at 52% 78%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 28% 13%, rgba(168, 139, 255, 0.95), transparent),
    radial-gradient(7px 7px at 92% 68%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(5px 5px at 48% 88%, rgba(168, 139, 255, 0.9), transparent),
    radial-gradient(6px 6px at 72% 23%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(4px 4px at 18% 82%, rgba(168, 139, 255, 0.95), transparent);
  background-size: 160% 160%;
  animation: float-particles-3 30s ease-in-out infinite;
  animation-delay: -6s;
  filter: drop-shadow(0 0 4px rgba(168, 139, 255, 0.8));
}

/* Capa 4: Partículas brillantes pequeñas (efecto sparkle intenso) */
.particle-layer-4 {
  background-image:
    radial-gradient(3px 3px at 10% 20%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 35% 52%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(2px 2px at 60% 32%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 85% 72%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(2px 2px at 20% 82%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 75% 12%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(2px 2px at 45% 62%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(3px 3px at 90% 42%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(2px 2px at 15% 5%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(3px 3px at 65% 92%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(2px 2px at 30% 28%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 80% 58%, rgba(255, 255, 255, 1), transparent);
  background-size: 150% 150%;
  animation:
    float-particles-4 18s ease-in-out infinite,
    sparkle-particles 3s ease-in-out infinite;
  animation-delay: -9s, 0s;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 1));
}

/* Capa 5: Partículas doradas pequeñas adicionales */
.particle-layer-5 {
  background-image:
    radial-gradient(4px 4px at 5% 30%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 40% 15%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 70% 45%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 25% 70%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 88% 25%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 50% 85%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 15% 50%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(5px 5px at 95% 65%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(3px 3px at 60% 10%, rgba(255, 215, 0, 0.95), transparent),
    radial-gradient(4px 4px at 35% 95%, rgba(255, 215, 0, 0.9), transparent);
  background-size: 170% 170%;
  animation: float-particles-5 22s ease-in-out infinite;
  animation-delay: -12s;
  filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.7));
}

/* Animaciones de flotación */
@keyframes float-particles-1 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      75% 88%,
      18% 92%;
    transform: translate(0, 0);
  }
  25% {
    background-position:
      10% 10%,
      30% 40%,
      50% 60%,
      70% 80%,
      90% 20%,
      25% 80%,
      95% 25%,
      50% 20%,
      85% 98%,
      28% 102%;
    transform: translate(8px, -15px);
  }
  50% {
    background-position:
      20% 20%,
      40% 50%,
      60% 70%,
      80% 90%,
      100% 30%,
      35% 90%,
      105% 35%,
      60% 30%,
      95% 108%,
      38% 112%;
    transform: translate(-8px, -25px);
  }
  75% {
    background-position:
      10% 10%,
      30% 40%,
      50% 60%,
      70% 80%,
      90% 20%,
      25% 80%,
      95% 25%,
      50% 20%,
      85% 98%,
      28% 102%;
    transform: translate(8px, -15px);
  }
}

@keyframes float-particles-2 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      25% 90%,
      75% 50%,
      45% 25%,
      38% 95%,
      95% 35%;
    transform: translate(0, 0);
  }
  33% {
    background-position:
      -10% 10%,
      10% 40%,
      30% 60%,
      50% 80%,
      70% 20%,
      15% 100%,
      65% 60%,
      35% 35%,
      28% 105%,
      85% 45%;
    transform: translate(-12px, 8px);
  }
  66% {
    background-position:
      10% -10%,
      30% 20%,
      50% 40%,
      70% 60%,
      90% 0%,
      35% 80%,
      85% 40%,
      55% 15%,
      48% 85%,
      105% 25%;
    transform: translate(12px, -8px);
  }
}

@keyframes float-particles-3 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 60%,
      85% 40%,
      55% 80%,
      25% 15%,
      18% 82%;
    transform: translate(0, 0);
  }
  25% {
    background-position:
      15% 15%,
      35% 45%,
      55% 65%,
      75% 85%,
      95% 25%,
      30% 75%,
      100% 55%,
      70% 95%,
      40% 30%,
      33% 97%;
    transform: translate(10px, 10px);
  }
  50% {
    background-position:
      -15% -15%,
      5% 15%,
      25% 35%,
      45% 55%,
      65% 5%,
      0% 45%,
      70% 25%,
      40% 65%,
      10% 0%,
      3% 67%;
    transform: translate(-10px, -10px);
  }
  75% {
    background-position:
      15% 15%,
      35% 45%,
      55% 65%,
      75% 85%,
      95% 25%,
      30% 75%,
      100% 55%,
      70% 95%,
      40% 30%,
      33% 97%;
    transform: translate(10px, 10px);
  }
}

@keyframes float-particles-4 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      65% 90%,
      18% 5%,
      30% 28%,
      80% 58%;
    transform: translate(0, 0);
  }
  50% {
    background-position:
      20% 20%,
      40% 50%,
      60% 70%,
      80% 90%,
      100% 30%,
      35% 90%,
      105% 35%,
      60% 30%,
      85% 110%,
      38% 25%,
      50% 48%,
      100% 78%;
    transform: translate(-6px, 6px);
  }
}

@keyframes float-particles-5 {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      15% 70%,
      85% 15%,
      40% 10%,
      60% 10%,
      35% 95%;
    transform: translate(0, 0);
  }
  33% {
    background-position:
      12% 12%,
      32% 42%,
      52% 62%,
      72% 82%,
      92% 22%,
      27% 82%,
      97% 27%,
      52% 22%,
      72% 22%,
      47% 107%;
    transform: translate(7px, -12px);
  }
  66% {
    background-position:
      -12% -12%,
      8% 18%,
      28% 38%,
      48% 58%,
      68% -2%,
      3% 58%,
      73% 3%,
      28% -2%,
      48% -2%,
      23% 83%;
    transform: translate(-7px, 12px);
  }
}

@keyframes sparkle-particles {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

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
  position: relative;
  z-index: 2;
}

/* --- 4.1. Tarjeta de Perfil (Arriba-Izquierda) --- */
.profile-card {
  grid-column: 1 / 2;
  grid-row: 1 / 2;

  /* Estilo "Glassmorphism" */
  background-color: #15131e;
  border: 1px solid #cb95e6;
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  /* Maquetación interna 2x2 */
  display: grid;
  grid-template-columns: 180px 1fr; /* Col 1 (avatar), Col 2 (texto) */
  grid-template-rows: auto auto; /* Fila 1 (arriba) auto, Fila 2 (texto bajo) auto */
  column-gap: 30px;
  row-gap: 20px;
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
  padding: 35px;
  background-color: #15131e;
  border: 1px solid #cb95e6;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(203, 149, 230, 0.25);
}

/* --- 4.1. (Internos) Tarjeta de Perfil --- */
.profile-avatar-wrapper {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  position: relative;
  width: 180px;
  height: 180px;
  justify-self: center;
  align-self: center;
  overflow: visible;
}

/* Anillo mágico giratorio */
.profile-avatar-wrapper::before {
  content: '';
  position: absolute;
  top: -15px;
  left: -15px;
  right: -15px;
  bottom: -15px;
  background:
    radial-gradient(circle, rgba(168, 139, 255, 0.5) 0%, transparent 70%),
    repeating-conic-gradient(
      from 0deg at 50% 50%,
      rgba(138, 43, 226, 0.15) 0deg,
      transparent 15deg,
      rgba(168, 139, 255, 0.15) 30deg,
      transparent 45deg
    );
  border-radius: 50%;
  z-index: 0;
  animation: rotate 20s linear infinite;
}

/* Destellos mágicos - Partículas flotantes */
.profile-avatar-wrapper::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 220px;
  background-image:
    radial-gradient(3px 3px at 20% 30%, rgba(255, 215, 0, 1), transparent),
    radial-gradient(2px 2px at 60% 70%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 50% 50%, rgba(168, 139, 255, 1), transparent),
    radial-gradient(1px 1px at 80% 10%, rgba(255, 215, 0, 0.8), transparent),
    radial-gradient(3px 3px at 90% 40%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 33% 60%, rgba(168, 139, 255, 0.8), transparent),
    radial-gradient(1px 1px at 66% 20%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(3px 3px at 10% 80%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(2px 2px at 40% 90%, rgba(168, 139, 255, 0.7), transparent),
    radial-gradient(2px 2px at 70% 50%, rgba(255, 215, 0, 0.9), transparent),
    radial-gradient(1px 1px at 25% 75%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(2px 2px at 15% 45%, rgba(168, 139, 255, 0.9), transparent),
    radial-gradient(1px 1px at 85% 65%, rgba(255, 215, 0, 0.8), transparent);
  background-size:
    200% 200%,
    150% 150%,
    180% 180%,
    160% 160%,
    170% 170%,
    140% 140%,
    190% 190%,
    130% 130%,
    120% 120%,
    110% 110%,
    100% 100%,
    105% 105%,
    115% 115%;
  background-position:
    0% 0%,
    20% 30%,
    40% 50%,
    60% 70%,
    80% 10%,
    30% 60%,
    70% 20%,
    10% 80%,
    50% 90%,
    70% 50%,
    25% 75%,
    15% 45%,
    85% 65%;
  animation:
    sparkle 3s ease-in-out infinite,
    float-sparkles 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
  border-radius: 50%;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.15);
  }
}

@keyframes float-sparkles {
  0%,
  100% {
    background-position:
      0% 0%,
      20% 30%,
      40% 50%,
      60% 70%,
      80% 10%,
      30% 60%,
      70% 20%,
      10% 80%,
      50% 90%,
      70% 50%,
      25% 75%,
      15% 45%,
      85% 65%;
  }
  25% {
    background-position:
      10% 10%,
      30% 40%,
      50% 60%,
      70% 80%,
      90% 20%,
      40% 70%,
      80% 30%,
      20% 90%,
      60% 100%,
      80% 60%,
      35% 85%,
      25% 55%,
      95% 75%;
  }
  50% {
    background-position:
      20% 20%,
      40% 50%,
      60% 70%,
      80% 90%,
      100% 30%,
      50% 80%,
      90% 40%,
      30% 100%,
      70% 110%,
      90% 70%,
      45% 95%,
      35% 65%,
      105% 85%;
  }
  75% {
    background-position:
      10% 10%,
      30% 40%,
      50% 60%,
      70% 80%,
      90% 20%,
      40% 70%,
      80% 30%,
      20% 90%,
      60% 100%,
      80% 60%,
      35% 85%,
      25% 55%,
      95% 75%;
  }
}

.profile-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid rgba(168, 139, 255, 0.7);
  box-shadow:
    0 0 30px rgba(168, 139, 255, 0.8),
    0 0 60px rgba(255, 215, 0, 0.5),
    inset 0 0 30px rgba(138, 43, 226, 0.3);
  z-index: 1;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.25) 0%, transparent 70%);
  animation: pulse-glow 2.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow:
      0 0 30px rgba(168, 139, 255, 0.8),
      0 0 60px rgba(255, 215, 0, 0.5),
      inset 0 0 30px rgba(138, 43, 226, 0.3);
    border-color: rgba(168, 139, 255, 0.7);
  }
  50% {
    box-shadow:
      0 0 45px rgba(168, 139, 255, 1),
      0 0 90px rgba(255, 215, 0, 0.7),
      inset 0 0 45px rgba(138, 43, 226, 0.5);
    border-color: rgba(168, 139, 255, 0.9);
  }
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

.profile-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #bba8ff;
  margin-left: 5px;
  margin-bottom: 2px;
  margin-top: 16px;
}

.profile-info .profile-label:first-of-type {
  margin-top: 8px;
}

/* Seleccionamos el paràgrafo <p> HIJO DIRECTO de .profile-card */
.profile-card > p {
  grid-row: 2 / 3; /* Fila 2 (la de abajo) */
  grid-column: 1 / 3; /* Ocupa todo el ancho */
  margin: 15px 0 0 0;
  color: #e0e0e0;
  font-size: 1.05rem;
  line-height: 1.75;
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
  padding: 12px 28px;
  border-radius: 9999px; /* Forma de píldora */
  font-size: 1.1rem;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 10px; /* Espacio bajo el badge */
  text-align: center;
  min-width: 220px;
  align-self: center;
}

.action-card {
  flex: 1; /* Cada tarjeta ocupa 50% */
  display: flex;
  flex-direction: column; /* Apila elementos internos verticalmente */
  gap: 28px; /* Más espacio entre badge, input, botón, etc. */
}

/* Estilo para inputs de texto dentro de las tarjetas */
.action-card input[placeholder] {
  background-color: #15131e;
  border: 1px solid #cb95e6;
  border-radius: 10px;
  outline: none;
  color: #f0f0f0;
  width: 100%;
  padding: 16px 18px;
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
  padding: 10px 20px; /* Padding */
  transition: 0.2s ease-in-out;

  width: 60%; /* Ancho del toggle */
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
  background: linear-gradient(135deg, #f8f9ff 0%, #cdbaff 55%, #8d75ff 100%);
  color: #140f2b;
  border: 1px solid rgba(207, 189, 255, 0.55);
  border-radius: 18px;
  width: 100%; /* Ocupa todo el ancho */
  padding: 18px 24px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(117, 74, 255, 0.2);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

/* Efecto Hover (brillantor) */
.action-card button:hover,
.action-card button:focus {
  transform: translateY(-2px);
  box-shadow: 0 18px 38px rgba(117, 74, 255, 0.3);
  filter: brightness(1.05);
}

/* --- 4.3. (Internos) Lista de Salas --- */
.rooms-grid-bottom h2 {
  margin: 5px 0 15px 0;
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
  padding: 16px 20px;
  margin-bottom: 18px;
  /* Estilo oscuro para la lista */
  border: 1px solid rgba(122, 98, 255, 0.35);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(69, 51, 151, 0.65), rgba(16, 14, 30, 0.85));
  color: #f0f0f0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
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

.notification {
  position: fixed;
  bottom: 8rem;
  left: 6rem;
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
  background: linear-gradient(to right, #ff058e 0%, #000000 100%);
}

.notification.error {
  background: linear-gradient(to right, #ff0202 0%, hsl(337, 100%, 71%) 100%);
}

.salir {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff4fac 0%, #ff6f61 40%, #ffc371 100%);
  border-radius: 999px;
  padding: 0 38px;
  font-size: 0.96rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #fff7ff;
  border: 1px solid rgba(255, 215, 240, 0.55);
  text-transform: uppercase;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
  min-height: 56px;
  box-shadow: 0 12px 26px rgba(227, 132, 240, 0.35);
}

.salir:hover,
.salir:focus {
  box-shadow: 0 18px 38px rgba(255, 139, 240, 0.45);

  transform: translateY(-2px);
  filter: brightness(1.08);
}

.salir:active {
  transform: translateY(0);
  box-shadow: none;
  filter: brightness(0.95);
}

.btn-time {
  gap: 14px;
  background: linear-gradient(135deg, #251d4a 0%, #4f3fbf 35%, #ffb347 100%);
  border: 1px solid rgba(255, 238, 206, 0.6);
  color: #fff9f3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(90, 57, 180, 0.35);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
  border-radius: 999px;
  min-height: 56px;
  padding: 0 34px;
}

.btn-time:hover,
.btn-time:focus {
  transform: translateY(-2px);
  box-shadow: 0 18px 38px rgba(90, 57, 180, 0.45);
  filter: brightness(1.08);
}

.btn-time:active {
  transform: translateY(0);
  box-shadow: none;
  filter: brightness(0.95);
}
.botonesEndGame {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50%;
  gap: 4rem;
}
/* fons principal */
.fondo {
  /* Layout principal */
  background: linear-gradient(180deg, #141021 0%, #1c1535 38%, #0057ff 100%);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);

  font-family: 'Poppins', sans-serif;
  color: #f0f0f0;
}

.ranking h2 {
  color: #ffffff;
  text-align: center;
  font-size: 2.5rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  margin-bottom: 2rem;

  /* APLIQUEM LA FONT MÀGICA */
  font-family: 'Cinzel', serif;

  /* EFECTE DE RESPLENDOR MÀGIC (daurat/blanc), no NEON (magenta) 
    Aquí està el canvi clau que has demanat.
  */
  text-shadow:
    0 0 15px #ffd700,
    /* Resplendor daurat més potent */ 0 0 8px #ffffff; /* Resplendor blanc subtil per a la nitidesa */
}

.portal-overlay {
  position: fixed; /* Ocupa toda la pantalla */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 0, 20, 0.85); /* Fondo oscuro */
  backdrop-filter: blur(5px);
  z-index: 9999; /* Por encima de todo */
  /* El .centrar se encargará de alinearlo */
}

.centrar {
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes portal-spin {
  0% {
    transform: rotate(359deg);
  }
}
.portal-frame {
  --portal-color: violet;
  width: 500px;
  aspect-ratio: 1;
  --portal-browserbugfix: perspective(2077px) translateZ(-0.1px);
  transform: var(--portal-browserbugfix,) scaleX(0.7);
  filter: contrast(1.75);
  overflow: hidden;
}
.portal,
.portal::before {
  position: absolute;
  inset: 0;
  animation: portal-spin 7s infinite linear;
}
.portal {
  --portal-img: url(https://i.imgur.com/oNjtnOI.png);
  --portal-mask: var(--portal-img) top left / 100% 100% no-repeat;
  -webkit-mask: var(--portal-mask);
  mask: var(--portal-mask);
}
.portal::before {
  content: '';
  animation-direction: reverse;
  background: linear-gradient(black -25%, transparent 50%, white 125%), var(--portal-color);
}
</style>
