<template>
  <div v-if="!isConnected">
    <h2>Introduce tu nombre</h2>
    <input type="text" v-model="jugador.name" placeholder="Tu nombre" />
    <button @click="sendNickname(jugador.name)">Continuar</button>
  </div>

  <div v-else-if="!joinedRoom">
    <h2>Salas disponibles</h2>

    <button @click="loadRooms">Actualizar lista</button>

    <ul>
      <li v-for="room in rooms" :key="room.name">
        <strong>{{ room.name }}</strong>
        — {{ room.playerCount }} jugadores
        <span v-if="room.beingPlayed"> | En partida</span>

        <button @click="joinExistingRoom(room.name)">Unirse</button>
      </li>
    </ul>

    <h3>Crear nueva sala</h3>
    <input v-model="roomInput" placeholder="Nombre de la sala" />
    <button @click="createRoom">Crear sala</button>
  </div>

  <div v-else-if="vista === 'preGame'">
    <h2>Sala: {{ currentRoom }}</h2>
    <viewLobby
      :socket-c="socket"
      :llista-jug="jugadors"
      :is-admin="jugador.role === 'admin'"
      :jugador="jugador"
      :room-name="currentRoom"
    />
  </div>

  <div v-else-if="vista === 'game'">
    <GameEngine :socket="socket" :jugador="jugador" :room-name="currentRoom" />
    <TempsRestant :tempsInicial="tempsRestant" />
    <RankingComponent :llista-jug="jugadors" />
  </div>

  <div v-else-if="vista === 'endGame'">
    <h2>Partida terminada</h2>
    <RankingComponent :llista-jug="jugadors" />
    <button @click="returnToLobby">Volver al lobby</button>
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
const isConnected = ref(false) // Sigue en 'false' hasta que el servidor confirme
const joinedRoom = ref(false)
const jugador = ref({ name: '', id: null, role: 'player' })
const jugadors = ref([])
const tempsRestant = ref(-1)

const currentRoom = ref('')
const roomInput = ref('')

// --- CONEXIÓN Y EVENTOS ---

function tryConn() {
  if (socket && socket.connected) return
  socket = io('http://localhost:3001')

  // Escuchamos la confirmación del servidor
  socket.on('playerRegistered', (playerData) => {
    console.log('Servidor ha confirmado el registro:', playerData)
    Object.assign(jugador.value, playerData) // Sincroniza el jugador

    // AHORA SÍ es seguro mostrar la lista de salas
    isConnected.value = true
    loadRooms() // Carga la lista de salas
  })

  // --- Listeners Principales ---
  socket.on('roomList', (list) => {
    rooms.value = list
  })

  socket.on('updateRoomState', (room) => {
    jugadors.value = [...room.players]
    const yo = room.players.find((p) => p.id === jugador.value.id)
    if (yo) Object.assign(jugador.value, yo)
  })

  socket.on('updateRanking', (ranking) => {
    if (vista.value === 'game') {
      jugadors.value = [...ranking]
    }
  })

  socket.on('gameStarted', ({ time }) => {
    vista.value = 'game'
    iniciarComptador(time)
  })

  socket.on('gameFinished', ({ ranking }) => {
    jugadors.value = [...ranking]
    vista.value = 'endGame'
  })

  socket.on('kicked', () => {
    alert('Has sido expulsado de la sala.')
    resetToRoomList()
  })

  socket.on('error', ({ message }) => {
    alert(`Error del servidor: ${message}`)
    joinedRoom.value = false
    currentRoom.value = ''
  })

  socket.on('youAreNowAdmin', () => {
    alert('Te han transferido el rol de Administrador.')
    jugador.value.role = 'admin'
  })
}

// --- ACCIONES DEL USUARIO ---

// 1. Enviar nombre (Pantalla 1)
function sendNickname(nickname) {
  if (!nickname.trim()) return

  jugador.value.id = jugador.value.id || Date.now()
  jugador.value.name = nickname.trim()

  tryConn() // Conecta al socket (esto registrará el listener de 'playerRegistered')

  // Emitimos, pero ya NO cambiamos isConnected.value aquí.
  // El listener 'playerRegistered' se encargará.
  socket.emit('setPlayerName', {
    name: jugador.value.name,
    id: jugador.value.id,
  })
}

// 2. Cargar salas (Pantalla 2)
function loadRooms() {
  if (!socket || !socket.connected) tryConn()
  socket.emit('getRoomList')
}

// 2. Unirse a sala (Pantalla 2)
function joinExistingRoom(roomName) {
  socket.emit('joinRoom', { roomName })
  currentRoom.value = roomName
  joinedRoom.value = true
  vista.value = 'preGame'
}

// 2. Crear sala (Pantalla 2)
function createRoom() {
  if (!roomInput.value.trim()) return
  socket.emit('createRoom', { roomName: roomInput.value.trim() })
  currentRoom.value = roomInput.value.trim()
  joinedRoom.value = true
  vista.value = 'preGame'
}

// ... (resto de tus funciones: iniciarComptador, returnToLobby, resetToRoomList) ...
function iniciarComptador(t) {
  tempsRestant.value = t
  const interval = setInterval(() => {
    if (tempsRestant.value > 0) tempsRestant.value--
    else clearInterval(interval)
  }, 1000)
}

function returnToLobby() {
  socket.emit('playAgain', { roomName: currentRoom.value, id: jugador.value.id })
  vista.value = 'preGame'
  tempsRestant.value = -1
}

function resetToRoomList() {
  joinedRoom.value = false
  currentRoom.value = ''
  vista.value = 'preGame'
  jugadors.value = []
  loadRooms()
}
</script>

<style scoped>
/* Estos estilos venían del código anterior */
.ready {
  background-color: greenyellow;
}
.notReady {
  background-color: red;
}
</style>
