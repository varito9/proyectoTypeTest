<template>
  <div class="main-content">
    <p class="welcome-text">
      Bienvenido {{ jugadorClient.name }}. Tienes el rol de
      <strong>{{ jugadorClient.role }}</strong> en la sala.
    </p>

    <div v-if="accessCodeToDisplay" class="access-code-box">
      Sala Privada 🔒 | Código de Acceso:
      <strong>{{ accessCodeToDisplay }}</strong>
      <p>Comparte este código para que otros se unan.</p>
    </div>

    <playerList
      :socket-c="socket"
      :llista-jug="llistaJugadors"
      :is-admin="isAdmin"
      :jugador="jugadorClient"
      :room-name="roomName"
    />
  </div>
  <div class="top-right-buttons">
    <button v-if="isAdmin" @click="changeTime" class="btn badget">
      Temps: {{ tempsEstablert }}
    </button>
    <button @click="leaveRoom" class="btn salir">Salir de la Sala</button>
  </div>

  <div class="action-bar">
    <button class="comenzar" v-if="isAdmin" :class="['btn', 'btn-start']" @click="startGame">
      Comenzar
    </button>
    <button
      v-if="!isAdmin"
      :class="['btn', imReady ? 'ready' : 'notReady']"
      @click="toggleReady(jugadorClient.id)"
    >
      {{ imReady ? 'Observar' : 'Jugar' }}
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
const emit = defineEmits(['leave'])

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
  if (socket.value && socket.value.connected && isAdmin.value) {
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

function leaveRoom() {
  emit('leave')
}
</script>

<style scoped>
.fondo {
  /* Layout principal */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: linear-gradient(to bottom, #1e1b2e 32%, #0058d1 100%);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);

  font-family: 'Poppins', sans-serif;
  color: #f0f0f0;
}

/* Contenedor de la info y lista de jugadores */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 1.5rem; /* Espacio entre los elementos de arriba */
}

.welcome-text {
  font-size: 1.2rem;
  text-align: center;
  margin: 0;
}
.welcome-text strong {
  color: #58a6ff; /* Un azul más brillante */
  text-transform: capitalize;
}

/* Ajusta el componente de la lista para que ocupe el espacio */

/* --- BARRA DE ACCIONES --- */

.action-bar {
  display: flex;
  flex-wrap: wrap; /* Para que se vea bien en pantallas pequeñas */
  justify-content: center;
  align-items: center;
  gap: 1rem; /* Espacio entre botones */
  width: 100%;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Estilo base de todos los botones */
.btn {
  padding: 0.75rem 1.5rem;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  color: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.top-right-buttons {
  position: fixed; /* se mantiene visible al hacer scroll */
  top: 4rem;
  right: 2rem;
  display: flex;
  gap: 3rem;
}

.badget {
  background: linear-gradient(to right, #2c2b53 0%, #f58b00 100%);
  border-radius: 100px;
  padding: 8px 20px;
}

.comenzar {
  background: linear-gradient(to right, #8d087b 0%, #000000 100%);
  border-radius: 100px;
  padding: 8px 20px;
}
.salir {
  background: linear-gradient(to right, #ff0202 0%, hsl(337, 100%, 71%) 100%);
  border-radius: 100px;
  padding: 8px 20px;
}

.ready {
  background: linear-gradient(to right, #360505 0%, hsl(337, 100%, 71%) 100%);
  border-radius: 100px;
  padding: 8px 20px;
}

.notReady {
  background: linear-gradient(to right, #8d087b 0%, #000000 100%);
  border-radius: 100px;
  padding: 8px 20px;
}
</style>
