<template>
  <div id="game-engine">
    <div id="player" v-if="!isSpectator">
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

    <div id="spectator" v-else>
      <!--TODO: MOSTRAR EL NOM DE AQUI ESTA ESPECTEJANT I FER LO DE SCROLL ENTRE USUARIS PER VEURE ALTRES USUARIS NO NOMES AL ADMIN-->
      <button @click="canviarJugadorObservat('anterior')">◀ Enrere</button>
      <div class="paraules">
        <span
          v-for="(paraula, wordIndex) in estatJugadorObservat.paraules"
          :key="wordIndex"
          class="paraula"
          :class="{
            completada: paraula.estat === 'completada',
            actual: wordIndex === estatJugadorObservat.indexParaulaActiva,
          }"
        >
          <template v-if="wordIndex === estatJugadorObservat.indexParaulaActiva && paraula.text">
            <span
              v-for="(lletra, letterIndex) in paraula.text.split('')"
              :key="letterIndex"
              :class="getSpectatorClasseLletra(letterIndex, paraula.text)"
            >
              {{ lletra }}
            </span>
          </template>

          <template v-else>
            {{ paraula.text }}
          </template>
        </span>
      </div>
      <button @click="canviarJugadorObservat('seguent')">Endavant ▶</button>
    </div>
  </div>
</template>

<script setup>
// Imports necessaris per a aquest component
import { ref, reactive, computed } from 'vue'

// 1. DEFINIM LES PROPS (dades que rebem del component pare: App.vue)
const props = defineProps({
  socket: { type: Object, required: true },
  jugador: { type: Object, required: true },
  llistaJug: { type: Array, required: true },
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

//Declarem la variable reactiva la qual guarda la informació del jugador que observem com a espectador
const estatJugadorObservat = reactive({
  paraules: estatDelJoc.paraules.map((p) => ({ ...p })), //Copiem les paraules de dins de estat del joc
  indexParaulaActiva: 0,
  textEntrat: '',
})

const paraulaActiva = ref(estatDelJoc.paraules[0])
let textAnterior = ''
const acabada = ref(false)
const isSpectator = computed(() => props.jugador.role === 'spectator')

//Variables per la vista d'espectador
//const indexJugadorObservat = ref(0) ara usem l'ID per a que no canvii automaticament
const idJugadorObservat = ref(null)
const darrersGameStats = ref([])
//---> filtra i guarda només els jugadors que no son espectadors FALTABA POSAR ref([]) per actualitzar
const jugadorsReals = ref([])

//Funció per controlar a quin jugador espectejar
function canviarJugadorObservat(direccio) {
  const llista = jugadorsReals.value
  if (!llista.length) return

  const indexActual = llista.findIndex((p) => p.id === idJugadorObservat.value)

  let nouIndex = indexActual

  if (direccio === 'seguent') {
    nouIndex++
    if (nouIndex >= llista.length) {
      nouIndex = 0
    }
  } else if (direccio === 'anterior') {
    nouIndex--
    if (nouIndex < 0) {
      nouIndex = llista.length - 1
    }
  }

  if (llista[nouIndex]) {
    idJugadorObservat.value = llista[nouIndex].id
  }

  actualitzarVistaEspectador()
}

function actualitzarVistaEspectador() {
  if (!isSpectator.value) return

  const gameStats = darrersGameStats.value

  if (!gameStats || !idJugadorObservat.value) return

  const stats = gameStats.find((s) => s.id === idJugadorObservat.value)

  if (!stats) return

  estatJugadorObservat.indexParaulaActiva = stats.indexParaulaActiva
  estatJugadorObservat.textEntrat = stats.textEntrat

  if (stats.paraules && stats.paraules.length > 0) {
    estatJugadorObservat.paraules = stats.paraules.map((p) => ({ ...p }))
  }
}

// escoltem les dades que ens envia el servidor per l'espectador
props.socket.on('spectatorGameView', (gameStats) => {
  //Actualizem els camps de la variable darrersGameStats segons el que ens envia el servidor
  darrersGameStats.value = gameStats

  jugadorsReals.value = props.llistaJug.filter((p) => p.role !== 'spectator')

  const jugadorActualEncaraExisteix = jugadorsReals.value.find(
    (p) => p.id === idJugadorObservat.value,
  )

  if (
    (!idJugadorObservat.value || !jugadorActualEncaraExisteix) &&
    jugadorsReals.value.length > 0
  ) {
    idJugadorObservat.value = jugadorsReals.value[0].id
  }
  actualitzarVistaEspectador()
})

// 3. FUNCIONS DEL JOC
function validarProgres() {
  // ... (sense canvis aquí) ...
  if (acabada.value) return

  estatDelJoc.textEntrat = estatDelJoc.textEntrat.toLowerCase()

  const inputActual = estatDelJoc.textEntrat
  const paraulaSencera = paraulaActiva.value.text // Comprovem errors

  if (inputActual.length > textAnterior.length) {
    const indexActual = inputActual.length - 1
    if (inputActual[indexActual] !== paraulaSencera[indexActual]) {
      props.socket.emit('addErrors', { id: props.jugador.id })
    }
  }
  textAnterior = inputActual // Comprovem encert de paraula sencera

  if (estatDelJoc.textEntrat === paraulaActiva.value.text) {
    props.socket.emit('addPoints', { id: props.jugador.id })

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

  playerGameStatus()
}

// 4. Funció que afegeix estils a cada lletra
function getClasseLletra(indexLletra) {
  // ... (sense canvis aquí) ...
  const lletraEsperada = paraulaActiva.value.text[indexLletra]
  const lletraIntroduida = estatDelJoc.textEntrat[indexLletra] // Si l'usuari encara no ha escrit aquesta lletra

  if (lletraIntroduida === undefined) {
    // Si és just la següent lletra que toca escriure, la marquem com a "cursor"
    if (indexLletra === estatDelJoc.textEntrat.length) {
      return 'lletra-actual'
    } // Si són lletres futures, no tenen estil
    return 'lletra-noArribada'
  } // Si l'usuari ja ha escrit aquesta lletra

  if (lletraIntroduida === lletraEsperada) {
    return 'lletra-correcta' // Coincideix
  } else {
    return 'lletra-incorrecta' // No coincideix
  }
}

//Funcio d'estils per l'espectador (el mateix que el jugador)
function getSpectatorClasseLletra(indexLletra, paraulaSencera) {
  // ... (sense canvis aquí) ...
  const lletraEsperada = paraulaSencera[indexLletra]
  const lletraIntroduida = estatJugadorObservat.textEntrat[indexLletra] // Si l'usuari (observat) encara no ha escrit aquesta lletra

  if (lletraIntroduida === undefined) {
    // Si és just la següent lletra que toca escriure, la marquem com a "cursor"
    if (indexLletra === estatJugadorObservat.textEntrat.length) {
      return 'lletra-actual'
    } // Si són lletres futures, no tenen estil
    return 'lletra-noArribada'
  } // Si l'usuari (observat) ja ha escrit aquesta lletra

  if (lletraIntroduida === lletraEsperada) {
    return 'lletra-correcta' // Coincideix
  } else {
    return 'lletra-incorrecta' // No coincideix
  }
}

// 5. Funció que envia al servidor l'informació actual del seu estat de la partida
function playerGameStatus() {
  // ... (sense canvis aquí) ...
  props.socket.emit('playerGameStatus', {
    data: {
      id: props.jugador.id,
      textEntrat: estatDelJoc.textEntrat,
      indexParaulaActiva: estatDelJoc.indexParaulaActiva,
      paraules: estatDelJoc.paraules,
    },
  })
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
