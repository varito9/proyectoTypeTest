<template>
  <ul>
    <li v-for="player in props.llistaJug" :key="player.id">
      {{ player.name }}
      <span v-if="player.id === props.jugador.id">(Tú)</span>
      <span v-if="player.role === 'admin'">⭐</span>

      <template v-if="props.isAdmin && player.id !== props.jugador.id">
        <button @click="setAdmin(player.id)">Convertir en administrador</button>
        <button @click="deletePlayer(player.id)">Expulsar jugador</button>
      </template>

      <span v-if="player.isReady">Jugador</span>
      <span v-else>Espectador</span>
      <div class="estat" :class="player.isReady ? 'ready' : 'notReady'"></div>
    </li>
  </ul>
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
ul {
  list-style: none;
  padding: 0;
}
li {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.estat {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.ready {
  background-color: greenyellow;
}
.notReady {
  background-color: red;
}
</style>
