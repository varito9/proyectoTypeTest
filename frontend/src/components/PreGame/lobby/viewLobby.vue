<template>
  <p>
    Benvingut {{ jugadorClient.name }} en aquesta partida tens el rol de {{ jugadorClient.role }}
  </p>
  <!-- Llista pel admin-->
  <div>
    <playerList
      :llista-jug="llistaJugadors"
      :is-admin="isAdmin"
      :jugador="jugadorClient"
    />
    <!--Botons-->
    <button v-if="isAdmin" v-bind:class="isMajority ? '' : 'disabled'" @click="startGame">
      Començar
    </button>
    <button v-bind:class="imReady ? 'ready' : 'notReady'" @click="toggleReady(jugadorClient.id)">
      Preparat
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { socket } from '@/socket'; // Importamos el socket
import playerList from './playerList.vue'

//props
const props = defineProps(['llistaJug', 'jug'])
const llistaJugadors = computed(() => props.llistaJug)
const jugadorClient = computed(() => props.jug || {})

const imReady = ref(false)

// Computed per actualitzar-se quan canviïn les dades
const isMajority = computed(() => {
  if (!llistaJugadors.value || !Array.isArray(llistaJugadors.value)) return false
  return (
    llistaJugadors.value.filter((player) => player.isReady === true).length >=
    Math.round(llistaJugadors.value.length / 2)
  )
})

const isAdmin = computed(() => {
  return jugadorClient.value?.role === 'admin'
})

//funcions
function startGame() {
  if (jugadorClient.value?.id) {
    socket.emit('startGame', { id: jugadorClient.value.id })
  }
}

function toggleReady(id) {
  if (id) {
    socket.emit('setIsReady', { id })
  }
}
</script>

<style scoped></style>
