<template>
  <div class="main-content">
    <div v-if="accessCodeToDisplay" class="access-code-box">
      Portal Privat | Clau Arcana:
      <strong>{{ accessCodeToDisplay }}</strong>
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
    <button v-if="isAdmin" @click="changeTime" class="btn btn-time">
      <span class="btn-time-label">Durada del Ritual</span>
      <span class="btn-time-value">{{ tempsEstablert }}s</span>
    </button>
    <button @click="leaveRoom" class="btn salir">Trencar el Vincle</button>
  </div>

  <div class="action-bar">
    <button class="comenzar" v-if="isAdmin" :class="['btn', 'btn-start']" @click="startGame">
      Començar
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
      newTime = 180
      break
    case 180:
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
  gap: 1.5rem; /* Espacio entre botones */
  width: 100%;
}

.action-bar .btn {
  min-width: 200px;
  min-height: 60px;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  right: 3rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  z-index: 10;
}

.badget {
  background: linear-gradient(to right, #2c2b53 0%, #f58b00 100%);
  border-radius: 100px;
  padding: 8px 20px;
}

.btn-time,
.salir {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  min-height: 56px;
  padding: 0 34px;
  line-height: 1;
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

.btn-time-label {
  opacity: 0.9;
}

.btn-time-value {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(17, 10, 35, 0.6);
  border: 1px solid rgba(255, 220, 180, 0.45);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #ffe3bf;
}

.comenzar {
  background: linear-gradient(135deg, #8d087b 0%, #2b0f6b 50%, #000000 100%);
  color: #fefbff;
  text-transform: uppercase;
  border: 1px solid rgba(197, 141, 255, 0.45);
  box-shadow: 0 15px 35px rgba(141, 8, 123, 0.35);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.comenzar:hover,
.comenzar:focus {
  transform: translateY(-3px);
  box-shadow: 0 22px 45px rgba(141, 8, 123, 0.45);
  filter: brightness(1.05);
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
}

.salir:hover,
.salir:focus {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.salir:active {
  transform: translateY(0);
  box-shadow: none;
  filter: brightness(0.95);
}

.ready {
  background: linear-gradient(135deg, #360505 0%, #8d082f 45%, hsl(337, 100%, 71%) 100%);
  color: #fff6ff;
  border: 1px solid rgba(250, 110, 150, 0.4);
  text-transform: uppercase;
  box-shadow: 0 15px 35px rgba(141, 8, 47, 0.3);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.notReady {
  background: linear-gradient(135deg, #8d087b 0%, #4720a8 60%, #000000 100%);
  color: #fdf3ff;
  border: 1px solid rgba(162, 113, 255, 0.4);
  text-transform: uppercase;
  box-shadow: 0 15px 35px rgba(71, 32, 168, 0.35);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.ready:hover,
.ready:focus,
.notReady:hover,
.notReady:focus {
  transform: translateY(-3px);
  box-shadow: 0 22px 45px rgba(71, 32, 168, 0.45);
  filter: brightness(1.05);
}

@media (min-width: 768px) {
  .fondo {
    border-radius: 20px; /* Restaura bordes redondeados */
    padding: 2rem; /* Más padding */
    min-height: auto; /* Ya no necesita 100vh */
  }

  .main-content {
    gap: 1.5rem; /* Más espacio */
    padding-top: 0; /* Ya no necesita el padding para botones fijos */
  }

  /* Vuelve a colocar los botones arriba a la derecha */
  .top-right-buttons {
    position: fixed;
    top: 4rem;
    right: 3rem;
    left: auto; /* Resetea left */
    flex-direction: row; /* En fila */
    align-items: center;
    gap: 2rem; /* Espacio original */
    width: auto; /* Ancho automático */
    padding: 0; /* Sin padding */
  }

  .btn-time,
  .salir {
    width: auto; /* Ancho automático */
    min-height: 56px;
    padding: 0 34px;
    font-size: 0.9rem; /* Restaura fuente */
  }

  .salir {
    font-size: 0.96rem;
    padding: 0 38px;
  }

  .btn-time-value {
    padding: 6px 14px;
    font-size: 1.05rem;
  }

  .welcome-text {
    font-size: 1.2rem;
  }
}

.access-code-box {
  position: fixed;
  top: 4rem;
  z-index: 2;
}
</style>
