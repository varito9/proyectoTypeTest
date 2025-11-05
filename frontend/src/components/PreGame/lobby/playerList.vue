<template>
  <ul v-if="isAdmin">
    <li v-for="player in llistaJugadors" :key="player.id">
      <button @click="setAdmin(player.id)">⭐</button>
      {{ player.name }}
      <button @click="deletePlayer(player.id)">❌</button>
      <div class="estat" :class="player.isReady ? 'ready' : 'notReady'"></div>
    </li>
  </ul>

  <ul v-else>
    <li v-for="player in llistaJugadors" :key="player.id">
      {{ player.name }}
      <div class="estat" :class="player.isReady ? 'ready' : 'notReady'"></div>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['socketC', 'llistaJug', 'isAdmin', 'jugador', 'roomId'])
const socket = computed(() => props.socketC)
const llistaJugadors = computed(() => props.llistaJug)

function setAdmin(id) {
  socket.value.emit('transferAdmin', {
    adminId: props.jugador.id,
    newAdminId: id,
    roomId: props.roomId,
  })
}

function deletePlayer(id) {
  socket.value.emit('kickPlayer', {
    adminId: props.jugador.id,
    playerId: id,
    roomId: props.roomId,
  })
}
</script>

<style scoped>
.ready {
  background-color: greenyellow;
}
.notReady {
  background-color: red;
}
</style>