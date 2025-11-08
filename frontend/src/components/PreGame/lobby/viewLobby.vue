<template>
  <p>
    Bienvenido {{ jugadorClient.name }}. Tienes el rol de **{{ jugadorClient.role }}** en la sala.
  </p>

  <div v-if="accessCodeToDisplay" class="access-code-box">
    Sala Privada 🔒 | Código de Acceso:
    <strong>{{ accessCodeToDisplay }}</strong>
    <p>Comparte este código para que otros se unan.</p>
  </div>
  <div>
    <playerList
      :socket-c="socket"
      :llista-jug="llistaJugadors"
      :is-admin="isAdmin"
      :jugador="jugadorClient"
      :room-name="roomName"
    />

    <button v-if="isAdmin" @click="changeTime">Temps: {{ tempsEstablert }}</button>
    <button
      v-if="isAdmin"
      :class="isMajority ? '' : 'disabled'"
      @click="startGame"
      :disabled="!isMajority"
    >
      Comenzar
    </button>
    <button :class="imReady ? 'ready' : 'notReady'" @click="toggleReady(jugadorClient.id)">
      {{ imReady ? 'Listo ✔️' : 'No Listo ❌' }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import playerList from './playerList.vue'

const props = defineProps(['socketC', 'llistaJug', 'jugador', 'roomName', 'roomState'])
const socket = computed(() => props.socketC)
const llistaJugadors = computed(() => props.llistaJug)
const jugadorClient = computed(() => props.jugador || {})

// Aquest valor ara es llegeix de les props que venen del servidor
const tempsEstablert = computed(() => {
  if (props.roomState && props.roomState.config) {
    return props.roomState.config.time
  }
  return 60 // Un valor per defecte si la prop encara no ha arribat
})
const imReady = computed(() => jugadorClient.value.isReady)
const currentRoomState = computed(() => props.roomState || {})

const accessCodeToDisplay = computed(() => {
  if (currentRoomState.value && currentRoomState.value.isPrivate) {
    return currentRoomState.value.accessCode
  }
  return null
})

// LÓGICA DE MAYORÍA CORREGIDA
const isMajority = computed(() => {
  if (!llistaJugadors.value) return false

  const playersInGame = llistaJugadors.value.filter(
    (p) => p.role === 'player' || p.role === 'admin',
  )

  if (playersInGame.length === 0) return false

  const readyPlayers = playersInGame.filter((player) => player.isReady === true).length

  return playersInGame.length === 1 ? true : readyPlayers >= Math.ceil(playersInGame.length / 2)
})

const isAdmin = computed(() => jugadorClient.value.role === 'admin')

function changeTime() {
  let newTime = 60
  const currentTime = tempsEstablert.value

  switch (currentTime) {
    case 60:
      newTime = 90
      break
    case 90:
      newTime = 120
      break
    case 120:
      newTime = 30
      break
    case 30:
      newTime = 60
      break
    default:
      newTime = 60
  }

  if (socket.value && socket.value.connected && isAdmin.value) {
    socket.value.emit('configGame', {
      roomName: props.roomName,
      id: jugadorClient.value.id,
      newConfig: {
        // Asegúrate de enviar la config completa (incluyendo idioma)
        language: props.roomState.config.language || 'cat',
        time: newTime,
      },
    })
  }
}

function startGame() {
  // Verificar conexión antes de emitir
  if (socket.value && socket.value.connected && isAdmin.value && isMajority.value) {
    socket.value.emit('startGame', {
      id: jugadorClient.value.id,
      roomName: props.roomName,
      tempsEstablert: tempsEstablert.value,
    })
    console.log(`[viewLobby] Intentando iniciar partida en: ${props.roomName}`)
  } else {
    console.error(
      '[viewLobby] No se pudo iniciar partida: Socket desconectado, no es Admin, o falta mayoría.',
    )
  }
}

function toggleReady(id) {
  // Verificar conexión antes de emitir
  if (socket.value && socket.value.connected) {
    socket.value.emit('setIsReady', { id, roomName: props.roomName })
  } else {
    console.error('No se pudo cambiar estado: Socket no conectado.')
  }
}
</script>

<style scoped>
/* Estilos para el botón de comenzar */
.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Estilos para la caja del código de acceso */
.access-code-box {
  margin: 20px auto;
  padding: 15px;
  border: 2px dashed green;
  background-color: #e6ffe6;
  border-radius: 5px;
  text-align: center;
  max-width: 400px;
}
</style>
