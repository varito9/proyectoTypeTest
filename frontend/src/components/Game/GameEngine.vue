<template>
  <div id="game-engine">
    <h2>Escriu les paraules següents:</h2>

    <div class="paraules">
      <span
        v-for="(paraula, wordIndex) in estatDelJoc.paraules"
        :key="wordIndex"
        class="paraula"
        :class="{
          completada: paraula.estat === 'completada',
          actual: wordIndex === estatDelJoc.indexParaulaActiva,
        }"
      >
        <template v-if="wordIndex === estatDelJoc.indexParaulaActiva">
          <span
            v-for="(lletra, letterIndex) in paraula.text.split('')"
            :key="letterIndex"
            :class="getClasseLletra(letterIndex)"
          >
            {{ lletra }}
          </span>
        </template>

        <template v-else>
          {{ paraula.text }}
        </template>
      </span>
    </div>

    <input
      v-model="estatDelJoc.textEntrat"
      @input="validarProgres"
      type="text"
      placeholder="Escriu aquí..."
      class="inputJoc"
      autofocus
    />
  </div>
</template>

<script setup>
// Imports necessaris per a aquest component
import { ref, reactive } from 'vue'

// 1. DEFINIM LES PROPS (dades que rebem del component pare: App.vue)
const props = defineProps({
  socket: { type: Object, required: true },
  jugador: { type: Object, required: true },
  esEspectador: { type: Boolean, required: true },
})

// 2. VARIABLES DEL JOC
const estatDelJoc = reactive({
  paraules: [
    { text: 'gat', estat: 'pendent' },
    { text: 'gos', estat: 'pendent' },
    { text: 'taula', estat: 'pendent' },
    { text: 'cadira', estat: 'pendent' },
    { text: 'cotxe', estat: 'pendent' },
  ],
  indexParaulaActiva: 0,
  textEntrat: '',
})

const paraulaActiva = ref(estatDelJoc.paraules[0])
let textAnterior = ''
const acabada = ref(false)

// 3. FUNCIONS DEL JOC
function validarProgres() {
  if (acabada.value) return

  estatDelJoc.textEntrat = estatDelJoc.textEntrat.toLowerCase()

  const inputActual = estatDelJoc.textEntrat
  const paraulaSencera = paraulaActiva.value.text

  // Comprovem errors
  if (inputActual.length > textAnterior.length) {
    const indexActual = inputActual.length - 1
    if (inputActual[indexActual] !== paraulaSencera[indexActual]) {
      props.socket.emit('sumarErrors', { id: props.jugador.id })
    }
  }
  textAnterior = inputActual

  // Comprovem encert de paraula sencera
  if (estatDelJoc.textEntrat === paraulaActiva.value.text) {
    props.socket.emit('sumarCorrectes', { id: props.jugador.id })

    paraulaActiva.value.estat = 'completada'
    estatDelJoc.indexParaulaActiva++

    estatDelJoc.textEntrat = ''
    textAnterior = ''

    if (estatDelJoc.indexParaulaActiva < estatDelJoc.paraules.length) {
      paraulaActiva.value = estatDelJoc.paraules[estatDelJoc.indexParaulaActiva]
    } else {
      acabada.value = true
    }
  }
}

// 4. Funció que afegeix estils a cada lletra
function getClasseLletra(indexLletra) {
  const lletraEsperada = paraulaActiva.value.text[indexLletra]
  const lletraIntroduida = estatDelJoc.textEntrat[indexLletra]

  // Si l'usuari encara no ha escrit aquesta lletra
  if (lletraIntroduida === undefined) {
    // Si és just la següent lletra que toca escriure, la marquem com a "cursor"
    if (indexLletra === estatDelJoc.textEntrat.length) {
      return 'lletra-actual'
    }
    // Si són lletres futures, no tenen estil
    return 'lletra-noArribada'
  }

  // Si l'usuari ja ha escrit aquesta lletra
  if (lletraIntroduida === lletraEsperada) {
    return 'lletra-correcta' // Coincideix
  } else {
    return 'lletra-incorrecta' // No coincideix
  }
}
</script>

<style scoped>
.paraules {
  font-size: 1.5rem;
  line-height: 2;
  word-spacing: 0.5em;
}

.paraula {
  display: inline-block;
  margin-right: 0.5em;
  padding: 2px 4px;
}

.paraula.actual {
  background-color: #f0f0f0;
  border-radius: 4px;
}

.paraula.completada {
  color: #a0a0a0;
}

.inputJoc {
  font-size: 1.2rem;
  padding: 10px;
  width: 50%;
  margin-top: 20px;
}

.lletra-correcta {
  color: #4caf50; /* Verd */
}

.lletra-incorrecta {
  color: #f44336; /* Vermell */
  text-decoration: underline; /* Subratllat per errors */
}

.lletra-actual {
  background-color: #777; /* Fons fosc per al "cursor" */
  color: white;
  border-radius: 2px;
}
</style>
