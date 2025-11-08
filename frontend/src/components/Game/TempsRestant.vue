<template>
  <div id="tempsRestant">
    <h1>Temps Restant: {{ tempsRestant }}s</h1>
  </div>
</template>

<script setup>
import { ref, onUnmounted, watch } from 'vue'

// Definim les dades que rebem del pare (App.vue)
const props = defineProps({
  tempsInicial: {
    type: Number,
    required: true,
  },
  socket: { type: Object, required: true },
})

const tempsRestant = ref(props.tempsInicial)

// 'watch' per actualitzar el temps si la prop canvia així agafa el nou temps quan comença la partida

watch(
  () => props.tempsInicial,
  (newTime) => {
    tempsRestant.value = newTime
  },
)
//ESCOLTEM EL SERVIDOR
props.socket.on('updateTime', ({ time }) => {
  tempsRestant.value = time
})

// Netegem el listener
onUnmounted(() => {
  props.socket.off('updateTime')
})
</script>

<style scoped>
h1 {
  color: #333;
  font-size: 1.8rem;
}
</style>
