<template>
  <p>
    Bienvenido {{ jugadorClient.name }}. Tienes el rol de {{ jugadorClient.role }} en la sala.
  </p>
  <div>
    <playerList
      :socket-c="socket"
      :llista-jug="llistaJugadors"
      :is-admin="isAdmin"
      :jugador="jugadorClient"
      :room-id="roomId"
    />
    <button v-if="isAdmin" :class="isMajority ? '' : 'disabled'" @click="startGame">Comenzar</button>
    <button :class="imReady ? 'ready' : 'notReady'" @click="toggleReady(jugadorClient.id)">
      Preparado
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import playerList from './playerList.vue'

const props = defineProps(['socketC', 'llistaJug', 'jug', 'roomId'])
const socket = computed(() => props.socketC)
const llistaJugadors = computed(() => props.llistaJug)
const jugadorClient = computed(() => props.jug || {})

const imReady = ref(false)

const isMajority = computed(() => {
  if (!llistaJugadors.value) return false
  return (
    llistaJugadors.value.filter((player) => player.isReady === true).length >=
    Math.round(llistaJugadors.value.length / 2)
  )
})

const isAdmin = computed(() => jugadorClient.value.role === 'admin')

function startGame() {
  socket.value.emit('startGame', { id: jugadorClient.value.id, roomId: props.roomId })
}

function toggleReady(id) {
  imReady.value = !imReady.value
  socket.value.emit('setIsReady', { id, roomId: props.roomId })
}
</script>