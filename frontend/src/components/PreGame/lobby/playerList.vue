<template>
  <ul>
    <li v-for="player in props.llistaJug" :key="player.id">
      {{ player.name }}
      <span v-if="player.id === props.jugador.id">(Tú)</span>
      <span v-if="player.role === 'admin'">⭐</span>

      <!-- Solo el admin ve los botones y nunca sobre sí mismo -->
      <template v-if="props.isAdmin && player.id !== props.jugador.id">
        <button @click="setAdmin(player.id)">Convertir en administrador</button>
        <button @click="deletePlayer(player.id)">Expulsar jugador</button>
      </template>

      <span v-if="player.isReady">Preparat</span>
      <span v-else>No Preparat</span>
      <div class="estat" :class="player.isReady ? 'ready' : 'notReady'"></div>
    </li>
  </ul>
</template>

<script setup>
import { socket } from '@/socket';
const props = defineProps(['llistaJug', 'isAdmin', 'jugador'])

// ES BORRA ELS COMPUTED NO FAN FALTA PODEM INDICARLO DIRECTAMENT DESDE props del pare viewLobby

//Functions
function setAdmin(id) {
  if (props.isAdmin && props.jugador?.id) {
    socket.emit('transferAdmin', { adminId: props.jugador.id, newAdminId: id })
  }
}

function deletePlayer(id) {
  if (props.isAdmin && props.jugador?.id) {
    socket.emit('kickPlayer', { adminId: props.jugador.id, playerId: id })
  }
}
</script>
