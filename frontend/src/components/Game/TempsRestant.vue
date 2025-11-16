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
  /* Tipografía potente y legible */
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 2.2rem;
  letter-spacing: 0.5px;
  margin: 0;

  /* Color y brillo mágico, consistente con el juego */
  color: #ffffff;
  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.45),
    0 0 10px rgba(0, 242, 255, 0.5),
    0 0 18px rgba(103, 29, 199, 0.35);
  filter: drop-shadow(0 0 6px rgba(0, 242, 255, 0.25));
  position: relative;
  display: inline-block;
  padding: 8px 14px;
  border-radius: 12px;
  backdrop-filter: blur(2px);
}

/* Línea de brillo sutil por debajo */
h1::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 6px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(0, 242, 255, 0.9), rgba(103, 29, 199, 0.7));
  box-shadow:
    0 0 8px rgba(0, 242, 255, 0.8),
    0 0 12px rgba(103, 29, 199, 0.6);
}
#tempsRestant {
  margin-bottom: -15px;
  margin-top: 15px;
}
</style>
