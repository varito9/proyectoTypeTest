<template>
  <div class="player-list-container">
    <div v-for="player in props.llistaJug" :key="player.id" class="player-card">
      <div class="player-content">
        <!-- Información del jugador -->
        <div class="player-info">
          <span v-if="player.id === props.jugador.id" class="you-indicator">(Tú)</span>

          <span v-if="player.role === 'admin'" title="Administrador">⭐</span>
          <span class="player-name">{{ player.name }}</span>
          <span class="status-indicator" :class="player.isReady ? 'ready' : 'not-ready'">
            {{ player.isReady ? 'Jugador' : 'Espectador' }}
          </span>
        </div>

        <!-- Botones solo si es admin -->
        <div v-if="props.isAdmin && player.id !== props.jugador.id" class="admin-actions">
          <button @click="setAdmin(player.id)" class="btn-admin">Hacer Admin</button>
          <button @click="deletePlayer(player.id)" class="btn-kick">Expulsar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['socketC', 'llistaJug', 'isAdmin', 'jugador', 'roomName'])

const socket = computed(() => props.socketC)

// Functions
function setAdmin(id) {
  // Verificar la conexión del socket antes de emitir
  if (socket.value && socket.value.connected && props.isAdmin && props.jugador?.id) {
    socket.value.emit('transferAdmin', {
      adminId: props.jugador.id,
      newAdminId: id,
      roomName: props.roomName,
    })
    console.log(`[playerList] Transferiendo admin a: ${id}`)
  } else {
    console.error('[playerList] No se pudo transferir admin: Faltan datos o no es admin.')
  }
}

function deletePlayer(id) {
  // Verificar la conexión del socket antes de emitir
  if (socket.value && socket.value.connected && props.isAdmin && props.jugador?.id) {
    socket.value.emit('kickPlayer', {
      adminId: props.jugador.id,
      playerId: id,
      roomName: props.roomName,
    })
    console.log(`[playerList] Expulsando jugador: ${id}`)
  } else {
    console.error('[playerList] No se pudo expulsar: Faltan datos o no es admin.')
  }
}
</script>

<style scoped>
/* Estilos necesarios para la lista */
.player-list-container {
  display: grid;
  /* 2 columnas. Cambia a repeat(3, 1fr) para 3 columnas */
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 24px;
  width: 100%;
}

/* 🎨 La tarjeta de jugador (Estilo de la imagen) */
.player-card {
  text-align: center;
  background-color: #1a1a2e; /* Fondo oscuro */
  border-radius: 16px;
  border: 2px solid #b366ff; /* Borde neón */
  box-shadow: 0 0 10px 1px rgba(179, 102, 255, 0.7); /* Resplandor */
  padding: 25px;
  height: 50px; /* Altura mínima */

  /* Flexbox para ordenar el contenido verticalmente */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* ¡Clave! Empuja el contenido */

  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.player-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0 18px 3px rgba(179, 102, 255, 0.9);
}

.player-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.player-info {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}
.player-name {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffffff;
}
.you-indicator {
  margin-right: 10px;
  color: #4dff8a; /* Verde brillante */
  font-weight: bold;
}

/* Sección de estado (centro) */
.status-indicator {
  margin-left: 20px;
  font-size: 1rem;
  font-weight: bold;
}

/* Sección de botones (abajo) */
.admin-actions {
  display: flex;
  gap: 2rem; /* Espacio entre botones */
  margin-top: 10px;
  margin-left: auto;
}
.btn-admin,
.btn-kick {
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s ease;
}
.btn-admin {
  background-color: #3a86ff;
  color: white;
}
.btn-admin:hover {
  background-color: #0056d3;
}
.btn-kick {
  background-color: #ff3a3a;
  color: white;
}
.btn-kick:hover {
  background-color: #c00;
}
</style>
