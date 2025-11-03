<template>
  <div id="tempsRestant">
    <h1>Temps Restant: {{ tempsRestant }}s</h1>
  </div>
</template>

<script setup>
// CANVI: Importem 'onMounted' i 'onUnmounted'
import { ref, onMounted, onUnmounted } from 'vue';

// 1. Definim les dades que rebem del pare (App.vue)
const props = defineProps({
  tempsInicial: {
    type: Number,
    required: true
  }
});

// 2. Definim els esdeveniments que enviarem al pare
const emit = defineEmits(['tempsAcabat']);

// 3. Variables del component
const tempsRestant = ref(0); //Temps restant
let timerInstance = null; //Variable per guardar l'interval


// 'onMounted', aquesta part del codi s'executa quan es carrega el component
onMounted(() => {
    iniciarComptador(props.tempsInicial);
});

// 'onUnmounted' quan el component desapareix executem aquesta part del codi
onUnmounted(() => {
  pararComptador();
});

// Aquesta funció és gairebé idèntica a la que tenies
function iniciarComptador(tempsInici) {
  pararComptador(); //Parem el comptador per si de cas 
  
  tempsRestant.value = tempsInici; //reiniciem el temps restant amb el valor del temps inicial (60)

  //Creem un interval per anar restant cada cop 1s al temps total  
  timerInstance = setInterval(() => {
    if (tempsRestant.value > 0) {
      tempsRestant.value--;
    } else { //Quan s'acaba el temps
      pararComptador(); // Parem el set interval
      emit('tempsAcabat'); // Avisem al component pare (App.vue) amb un emit de 'tempsAcabat'
    }
  }, 1000);
}

// Funció per netejar l'interval
function pararComptador() {
    clearInterval(timerInstance);
    timerInstance = null;
}
</script>

<style scoped>
h1 {
  color: #333;
  font-size: 1.8rem;
}
</style>

