<template>
  <div v-if="!isConnected">
    <h2 class="centrar">Introduce tu nombre</h2>
    <div class="centro">
      <input type="text" v-model="jugador.name" placeholder="Tu nombre" />
      <button @click="sendNickname(jugador.name)">Continuar</button>
    </div>
  </div>

  <div v-else-if="!joinedRoom">
    <h2>Salas disponibles (Públicas)</h2>

    <ul class="room-list">
      <li v-for="room in rooms" :key="room.name" class="room-item">
        <div class="room-info">
          <strong>{{ room.name }}</strong>
          <span>👥 {{ room.playerCount }} jugadores</span>
          <span v-if="room.beingPlayed" class="status-playing"> | 🎮 En partida</span>
        </div>
        <button @click="joinExistingRoom(room.name)">Unirse</button>
      </li>
    </ul>

    <hr />

    <h3>Crear nueva sala</h3>
    <input v-model="roomInput" placeholder="Nombre de la sala" />
    <label> <input type="checkbox" v-model="isPrivateCreation" /> Sala Privada 🔒 </label>
    <button @click="createRoom">Crear sala</button>

    <hr />

    <h3>Unirse a Sala Privada con Código</h3>
    <input v-model="privateCodeInput" placeholder="Código de Acceso (6 digitos)" maxlength="6" />
    <button @click="joinPrivateRoom">Unirse</button>
  </div>

  <div v-else-if="vista === 'preGame'">
    <h2>Sala: {{ currentRoom }}</h2>
    <viewLobby
      :socket-c="socket"
      :llista-jug="jugadors"
      :is-admin="jugador.role === 'admin'"
      :jugador="jugador"
      :room-name="currentRoom"
      :room-state="roomState"
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
          :spell-text="spellText"
          :spell-category="spellCategory"
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
import { socket } from './socket.js' // Importa la instancia centralizada
import RankingComponent from './components/RankingComponent.vue'
import viewLobby from './components/PreGame/lobby/viewLobby.vue'
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
  })
socket.on('updateRanking', (ranking) => {
  if (vista.value === 'game') {
    jugadors.value = [...ranking]
  }
})

socket.on('gameStarted', ({ time }) => {
  vista.value = 'game'
  tempsInicial.value = time
})

socket.on('gameFinished', ({ ranking }) => {
  jugadors.value = [...ranking]
  vista.value = 'endGame'
})

socket.on('error', ({ message }) => {
  alert(`Error del servidor: ${message}`)
  if (joinedRoom.value) {
    if (currentRoom.value === '' && !roomState.value) {
      joinedRoom.value = false
      currentRoom.value = ''
      vista.value = 'preGame'
      loadRooms()
    }
  }
})

socket.on('kicked', () => {
  alert("Expulsat per l'admin")
  socket.disconnect()
  resetToRoomList()
})

socket.on('youAreNowAdmin', () => {
  jugador.value.role = 'admin'
})

// --- ACCIONES DEL USUARIO ---

function tryConn() {
  if (socket.connected) return
  socket.connect()
}

function sendNickname(nickname) {
  if (!nickname || nickname.trim() === '') return

  const playerId = jugador.value.id || Date.now()
  jugador.value.id = playerId
  jugador.value.name = nickname.trim()

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
  if (!socket.connected) return alert('Socket no conectado. Inténtalo de nuevo.')
  socket.emit('joinRoom', { roomName })
  currentRoom.value = roomName
  joinedRoom.value = true
  vista.value = 'preGame'
}

function joinPrivateRoom() {
  if (!socket.connected) return alert('Socket no conectado. Inténtalo de nuevo.')
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
  if (!socket.connected) return alert('Socket no conectado. Inténtalo de nuevo.')
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
  if (!socket.connected) return alert('Socket no conectado. Recarga la página.')
  socket.emit('playAgain', { roomName: currentRoom.value, id: jugador.value.id })
  vista.value = 'preGame'
  tempsInicial.value = -1
}

function leaveRoom() {
  if (!socket.connected) return alert('Socket no conectado. Recarga la página.')
  socket.emit('leaveRoom', { roomName: currentRoom.value, id: jugador.value.id })
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

<style scoped>
.centrar {
  text-align: center;
}
.centro {
  display: flex;
  justify-content: center;
  align-items: center;
}
.ready {
  background-color: greenyellow;
}
.notReady {
  background-color: red;
}
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
  background-color: #f9f9f9;
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
</style>
