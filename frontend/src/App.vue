<template>
  <div v-if="vista === 'preGame'">
    <div v-if="fase === 'nombre'" class="centered">
      <h2>Bienvenido a Type Racer Royale</h2>
      <input
        type="text"
        v-model="jugador.name"
        placeholder="Introduce tu nombre"
      />
      <button @click="guardarNombre">Continuar</button>
    </div>

    <div v-else-if="fase === 'rooms'" class="rooms-view">
      <h3>Hola {{ jugador.name }} Selecciona una sala</h3>

      <ul class="rooms-list">
        <li v-for="room in rooms" :key="room.id" class="room-item">
          <strong>{{ room.name }}</strong>
          <p>Jugadores: {{ room.playerCount }}/6</p>
          <button @click="joinRoom(room.id)" :disabled="room.playerCount >= 6">
            {{ room.playerCount >= 6 ? 'Sala Llena' : 'Unirse' }}
          </button>
        </li>
      </ul>

      <div class="create-room">
        <input
          v-model="roomInput"
          placeholder="Nombre de nueva sala"
        />
        <button @click="createRoom">Crear sala</button>
      </div>
    </div>

    <div v-else-if="fase === 'lobby'">
      <p>Estás en la sala: **{{ currentRoom }}**</p>
      <button @click="leaveRoom">Abandonar Sala</button> 
      <viewLobby
        :socket-c="socket"
        :llista-jug="jugadors"
        :jug="jugador"
        :room-id="currentRoom"
      />
    </div>
  </div>

  <div v-else-if="vista === 'game'">
    <div id="jugador" v-if="!isSpectator">
      <div id="partida">
        <GameEngine
          :socket="socket"
          :jugador="jugador"
          :es-espectador="isSpectator"
          :room-id="currentRoom"
        />
      </div>
      <div id="tempsRestant">
        <TempsRestant
          :tempsInicial="tempsRestant"
          :socket="socket"
          :room-id="currentRoom"
        />
      </div>
      <div id="ranquing">
        <RankingComponent :llista-jug="jugadors" />
      </div>
    </div>
  </div>

  <div v-else-if="vista === 'endGame'">
    <RankingComponent :llista-jug="jugadors" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue' 
import { io } from 'socket.io-client'
import viewLobby from './components/PreGame/lobby/viewLobby.vue'
import GameEngine from './components/Game/GameEngine.vue'
import TempsRestant from './components/Game/TempsRestant.vue'
import RankingComponent from './components/RankingComponent.vue'

//  Estados principales
const vista = ref('preGame')
const fase = ref('nombre') // 'nombre' → 'rooms' → 'lobby'

//  Jugador y socket
const jugador = ref({ name: '', id: null, status: '', role: '' })
const socket = ref(null)
const jugadors = ref([])

//  Configuración del juego
const tempsRestant = ref(-1)
const isSpectator = ref(false)
const currentRoom = ref('')
const roomInput = ref('')
const rooms = ref([])

function handleSuccessfulJoin(roomId, player) {
    currentRoom.value = roomId
    fase.value = 'lobby'
    Object.assign(jugador.value, player) 
}

function initSocket() {
    if (socket.value && socket.value.connected) return

    socket.value = io('http://localhost:3001')

    socket.value.on('connect', () => {
        console.log('Socket conectado ✅')
    })
    
    socket.value.on('updateRoomList', (roomList) => {
        rooms.value = Array.isArray(roomList) ? roomList : []
    })
    
    socket.value.on('roomCreatedAndJoined', ({ roomId, player }) => {
        handleSuccessfulJoin(roomId, player)
    })
    
    socket.value.on('joinedRoom', ({ roomId, player }) => {
        handleSuccessfulJoin(roomId, player)
    })
    
    socket.value.on('alreadyInRoom', ({ roomId }) => {
        fase.value = 'lobby'
        currentRoom.value = roomId
    })
    
    // 🆕 Aviso si la sala está en partida
    socket.value.on('roomIsPlaying', ({ roomId }) => {
        alert(`La sala ${roomId} ya ha comenzado y no puedes unirte.`)
    })
    
    socket.value.on('leftRoom', () => {
        console.log('Has abandonado la sala.')
        resetState() 
        fase.value = 'rooms' 
    })

    socket.value.on('setPlayerList', (playerList) => {
        jugadors.value = Array.isArray(playerList) ? [...playerList] : []
        const updated = jugadors.value.find((j) => j.id === jugador.value.id)
        if (updated) Object.assign(jugador.value, updated)
        isSpectator.value = jugador.value.role === 'spectator'
    })

    socket.value.on('gameStarted', (data) => {
        vista.value = 'game'
        if (data.time) iniciarComptador(data.time)
    })

    socket.value.on('playerKicked', ({ id }) => {
        if (id === jugador.value.id) {
            alert('Has sido expulsado de la sala.')
            resetState() 
            fase.value = 'nombre'
        }
    })

    socket.value.on('gameFinished', () => {
        vista.value = 'endGame'
    })
}

onMounted(() => {
    initSocket() 
})

onUnmounted(() => {
    if (socket.value) {
        socket.value.emit('leaveGame', { id: jugador.value.id }) 
        socket.value.disconnect()
    }
})

//  FASE 1: Introducir nombre

function guardarNombre() {
  if (!jugador.value.name.trim()) {
    jugador.value.name = 'Jugador anónimo'
  }
  if (!jugador.value.id) {
      jugador.value.id = Date.now()
  }
  fase.value = 'rooms'
}

//  FASE 2: Crear o unirse a una sala

function createRoom() {
  const roomName = roomInput.value.trim() || `Sala de ${jugador.value.name}`

  if (socket.value && socket.value.connected) {
    socket.value.emit('createRoom', {
      playerName: jugador.value.name,
      playerId: jugador.value.id,
      roomName: roomName
    })
    roomInput.value = ''
  } else {
      console.error('Socket no conectado.')
  }
}

function joinRoom(roomId) {
  if (socket.value && socket.value.connected) {
    socket.value.emit('joinRoom', {
      roomId: roomId,
      playerName: jugador.value.name,
      playerId: jugador.value.id
    })
  } else {
      console.error('Socket no conectado.')
  }
}

function leaveRoom() {
    if (socket.value && socket.value.connected && currentRoom.value) {
        socket.value.emit('leaveRoom', {
            roomId: currentRoom.value,
            playerId: jugador.value.id
        })
        currentRoom.value = ''
        fase.value = 'rooms'
        jugadors.value = []
    }
}


//  Control de partida
function iniciarComptador(tempsInici) {
    tempsRestant.value = tempsInici
    const interval = setInterval(() => {
      if (tempsRestant.value > 0) {
        tempsRestant.value--
      } else {
        clearInterval(interval)
        vista.value = 'endGame' 
      }
    }, 1000)
}

function resetState() {
    jugador.value = { name: jugador.value.name, id: jugador.value.id, status: '', role: '' }
    jugadors.value = []
    vista.value = 'preGame'
    currentRoom.value = ''
}
</script>

<style scoped>
/* Estilos sin cambios */
.centered {
text-align: center;
padding: 40px;
}

.rooms-view {
padding: 20px;
}

.rooms-list {
list-style: none;
display: flex;
flex-wrap: wrap;
gap: 16px;
}

.room-item {
border: 1px solid #ccc;
padding: 10px;
border-radius: 8px;
width: 200px;
}

.create-room {
margin-top: 20px;
}

.ready {
background-color: greenyellow;
}
.notReady {
background-color: red;
}
</style>