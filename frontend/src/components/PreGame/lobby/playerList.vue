<template>
  <div class="player-list-container">
    <div class="player-grid">
      <div v-for="player in props.llistaJug" :key="player.id" class="player-slot">
        <div class="player-card" :class="{ self: player.id === props.jugador.id }">
          <div class="player-avatar">
            <img src="/img/Aprendiz_Mago.png" alt="Avatar de jugador" />
          </div>
          <div class="player-info">
            <span class="player-name" :class="{ self: player.id === props.jugador.id }">
              {{ player.name }}
            </span>
            <span class="player-role" :class="{ admin: player.role === 'admin' }">
              {{ roleLabel(player) }}
            </span>
          </div>

          <div v-if="props.isAdmin && player.id !== props.jugador.id" class="admin-actions">
            <button @click="setAdmin(player.id)" class="btn-admin">Fer Admin</button>
            <button @click="deletePlayer(player.id)" class="btn-kick">Expulsar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['socketC', 'llistaJug', 'isAdmin', 'jugador', 'roomName'])

const socket = computed(() => props.socketC)

function roleLabel(player) {
  if (player.role === 'admin') return 'Archimago'
  if (player.isReady) {
    return 'Mago'
  } else {
    return 'Espectro'
  }
}

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
  display: flex;
  justify-content: center;
  padding: 0px 24px 0px 24px;
  width: 100%;
  box-sizing: border-box;
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(320px, 1fr));
  grid-template-rows: repeat(3, minmax(140px, auto));
  gap: 20px 48px;
  width: min(80%, 100%);
}

.player-slot {
  display: flex;
  justify-content: center;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
}

/* 🎨 La tarjeta de jugador (Estilo de la imagen) */
.player-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(14, 10, 25, 0.8);
  border: 2px solid rgba(187, 168, 255, 0.6);
  border-radius: 22px;
  padding: 18px 24px;
  box-shadow: 0 12px 30px rgba(71, 40, 135, 0.35);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  width: 100%;
  height: 60%;
}

.player-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 38px rgba(142, 84, 255, 0.45);
  border-color: rgba(203, 149, 230, 0.9);
}

.player-card.self {
  border-color: rgba(77, 255, 138, 0.7);
  box-shadow: 0 16px 36px rgba(77, 255, 138, 0.3);
}

.player-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(203, 149, 230, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.player-name {
  font-size: 1.45rem;
  font-weight: 500;
  color: #f4f3ff;
  letter-spacing: 0.01em;
}

.player-name.self {
  color: #4dff8a;
  font-weight: 600;
}

.player-role {
  font-size: 0.95rem;
  color: #a59bd6;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.player-role.admin {
  color: #ffcf6b;
}

/* Sección de botones (abajo) */
.admin-actions {
  display: flex;
  gap: 1rem; /* Espacio entre botones */
  margin-left: auto;
}
/* modificacion targetes*/
.btn-admin,
.btn-kick {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.92rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
  color: #0e0a19;
  background-clip: padding-box;
}
.btn-admin {
  background: linear-gradient(135deg, #62b5ff 0%, #8dd0ff 100%);
}
.btn-admin:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(98, 181, 255, 0.45);
}
.btn-kick {
  background: linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%);
  color: #170b1f;
}
.btn-kick:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(255, 95, 109, 0.45);
}

.btn-admin:active,
.btn-kick:active {
  transform: translateY(0);
  box-shadow: none;
  filter: brightness(0.95);
}
</style>
