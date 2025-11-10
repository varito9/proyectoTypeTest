<template>
  <div id="game-engine" :class="debuffState.isActive ? debuffState.type : ''">
    <!-- Modificació per els efectes visuals Apagon Y Flash -->
    <div
      class="debuff-overlay"
      v-if="debuffState.isActive && (debuffState.type === 'Apagon' || debuffState.type === 'Flash')"
    ></div>

    <div id="player" v-if="!isSpectator">
      <div class="mage-info" v-if="jugador.mage">
        <h3>Ets: {{ jugador.mage.name }}</h3>
        <p>
          <strong>Power-up (5 acerts seguits):</strong>
          {{ jugador.mage.powerUp }} - <em>{{ jugador.mage.description }}</em>
        </p>
      </div>

      <div class="powerup-container" v-if="powerUpState.ready && !powerUpState.used">
        <button @click="usePowerUp" class="powerup-button">
          🔥 ATACAR A UN OPONENT ALEATORI 🔥
        </button>
      </div>

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
              {{ getDisplayLetter(lletra, letterIndex) }}
            </span>
          </template>

          <template v-else> {{ getDisplayWord(paraula.text) }} </template>
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
  roomName: { type: String, required: true },
})

// 2. VARIABLES DEL JOC
const estatDelJoc = reactive({
  paraules: [
    { text: 'gat', estat: 'pendent' },
    { text: 'gos', estat: 'pendent' },
    { text: 'taula', estat: 'pendent' },
    { text: 'cadira', estat: 'pendent' },
    { text: 'cotxe', estat: 'pendent' },
    { text: 'cotxe', estat: 'pendent' },
    { text: 'magia', estat: 'pendent' },
    { text: 'poder', estat: 'pendent' },
    { text: 'foc', estat: 'pendent' },
    { text: 'aigua', estat: 'pendent' },
    { text: 'aire', estat: 'pendent' },
  ],
  indexParaulaActiva: 0,
  textEntrat: '',
})

const powerUpState = reactive({
  ready: false,
  used: false,
  name: '',
})

// Estat dels Debuffs (atacs rebuts)
const debuffState = reactive({
  isActive: false,
  type: null,
  duration: 0,
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

// Has guanyat el teu power-up
props.socket.on('powerUpReady', (mage) => {
  console.log('Power-up guanyat!', mage.powerUp)
  powerUpState.ready = true
  powerUpState.name = mage.powerUp
})

// El servidor confirma que has fet servir el power-up
props.socket.on('powerUpUsed', () => {
  console.log('Power-up utilitzat correctament!')
  // El botó ja s'amaga al fer click (powerUpState.used = true)
})

// Reseteja l'estat al començar la partida
props.socket.on('gameStarted', () => {
  powerUpState.ready = false
  powerUpState.used = false
  powerUpState.name = ''
  // Reseteja també els debuffs
  debuffState.isActive = false
  debuffState.type = null
  debuffState.duration = 0
})

// T'han atacat!
props.socket.on('debuffReceived', ({ type, duration }) => {
  console.log(`DEBUFF REBUT: ${type} durant ${duration}ms`)
  debuffState.isActive = true
  debuffState.type = type
  debuffState.duration = duration
})

// S'ha acabat el debuff
props.socket.on('debuffEnded', () => {
  console.log('Debuff acabat!')
  debuffState.isActive = false
  debuffState.type = null
  debuffState.duration = 0
})

// El Tsunami t'ha tocat (has fallat)
props.socket.on('tsunamiHit', () => {
  console.log('TSUNAMI! Has de tornar a començar la frase.')

  // Reseteja el progrés del joc
  estatDelJoc.indexParaulaActiva = 0

  // Comprova si hi ha paraules abans d'assignar
  if (estatDelJoc.paraules.length > 0) {
    paraulaActiva.value = estatDelJoc.paraules[0]
  }

  // Marca totes les paraules com a pendents
  estatDelJoc.paraules.forEach((p) => (p.estat = 'pendent'))

  // Envia l'estat actualitzat als espectadors
  playerGameStatus()
})

// 3. FUNCIONS DEL JOC
function validarProgres() {
  // ... (sense canvis aquí) ...
  if (acabada.value) return

  const paraulaObjectiu = getTexteParaulaActiva()

  estatDelJoc.textEntrat = estatDelJoc.textEntrat.toLowerCase()
  const inputActual = estatDelJoc.textEntrat

  if (inputActual.length > textAnterior.length) {
    const indexActual = inputActual.length - 1

    if (inputActual[indexActual] !== paraulaObjectiu[indexActual]) {
      props.socket.emit('addErrors', { roomName: props.roomName, id: props.jugador.id })
    }
  }
  textAnterior = inputActual

  if (estatDelJoc.textEntrat === paraulaObjectiu) {
    props.socket.emit('addPoints', { roomName: props.roomName, id: props.jugador.id })

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
  // AFEGIM AQUESTA LÍNIA
  const paraulaObjectiu = getTexteParaulaActiva() // Consulta la paraula (amb o sense tildes)

  // CANVIEM "paraulaActiva.value.text" per "paraulaObjectiu"
  const lletraEsperada = paraulaObjectiu[indexLletra]
  const lletraIntroduida = estatDelJoc.textEntrat[indexLletra]

  // Si l'usuari encara no ha escrit aquesta lletra
  if (lletraIntroduida === undefined) {
    if (indexLletra === estatDelJoc.textEntrat.length) {
      return 'lletra-actual'
    }
    return 'lletra-noArribada'
  }

  // Si l'usuari ja ha escrit aquesta lletra
  if (lletraIntroduida === lletraEsperada) {
    return 'lletra-correcta' // Ara 'á' === 'á' (Correcte!)
  } else {
    return 'lletra-incorrecta' // Ara 'a' !== 'á' (Incorrecte!)
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
    roomName: props.roomName,
    data: {
      id: props.jugador.id,
      textEntrat: estatDelJoc.textEntrat,
      indexParaulaActiva: estatDelJoc.indexParaulaActiva,
      paraules: estatDelJoc.paraules,
    },
  })
}

//Funció per definir el text de la Paraula Activa per posar les tildes
function getTexteParaulaActiva() {
  const textOriginal = paraulaActiva.value.text

  // Si el debuff Ignicio está actiu, retorna la versió amb tildes
  if (debuffState.isActive && debuffState.type === 'Ignicio') {
    return textOriginal.split('').map(posarTildes).join('')
  }

  // Si no, retorna el text normal
  return textOriginal
}

function usePowerUp() {
  if (!powerUpState.ready || powerUpState.used) return
  powerUpState.used = true // Marca com a utilitzat (amaga el botó)

  // Envia l'event al servidor. El servidor s'encarrega de tot.
  props.socket.emit('usePowerUp', {
    roomName: props.roomName,
    id: props.jugador.id,
  })
}

// Funció auxiliar per 'Ignició'
function posarTildes(lletra) {
  const tildes = {
    a: 'á',
    e: 'é',
    i: 'í',
    o: 'ó',
    u: 'ú',
    A: 'Á',
    E: 'É',
    I: 'Í',
    O: 'Ó',
    U: 'Ú',
  }
  return tildes[lletra] || lletra
}

// Funció per 'Enredadera'
function caracterEspecial() {
  const chars = '@#$%&*-+?'
  return chars[Math.floor(Math.random() * chars.length)]
}

// Per a les paraules que no són l'actual
function getDisplayWord(text) {
  if (!debuffState.isActive) return text

  if (debuffState.type === 'Ignicio') {
    return text.split('').map(posarTildes).join('')
  }

  if (debuffState.type === 'Enredadera') {
    return text.split('').map(caracterEspecial).join('')
  }
  return text
}

// Per a les lletres de la paraula actual
function getDisplayLetter(lletra, index) {
  if (!debuffState.isActive) return lletra

  if (debuffState.type === 'Ignicio') {
    return posarTildes(lletra)
  }
  if (debuffState.type === 'Enredadera') {
    // Mostra la lletra correcta si ja l'has escrit bé
    const lletraIntroduida = estatDelJoc.textEntrat[index]
    if (lletraIntroduida !== undefined && lletraIntroduida === lletra) {
      return lletra
    }
    return caracterEspecial()
  }
  return lletra
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

/* Estils per els powerups */
.mage-info {
  background-color: #f4f0ff;
  border: 1px solid #dcd1ff;
  border-radius: 8px;
  padding: 10px 15px;
  margin-bottom: 20px;
}
.mage-info h3 {
  margin: 0 0 5px 0;
  color: #6a1b9a;
}
.mage-info p {
  margin: 0;
}
.powerup-container {
  margin-bottom: 20px;
}
.powerup-button {
  background-color: #ffc107;
  color: #333;
  border: none;
  padding: 12px 25px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px 0 rgba(255, 193, 7, 0.4);
}
.powerup-button:hover {
  background-color: #ffca2c;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(255, 193, 7, 0.5);
}

/* --- Estils per als Debuffs --- */

#game-engine {
  position: relative;
}

.debuff-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}

/* Efecte 'Apagón' (Mag Oscur) */
#game-engine.Apagon .debuff-overlay {
  background-color: rgba(0, 0, 0, 0.85); /* 85% fosc */
  transition: background-color 0.5s ease;
}

/* Efecte 'Flash' (Mag de Llum) */
#game-engine.Flash .debuff-overlay {
  animation: flash-animation 0.5s infinite alternate;
}

@keyframes flash-animation {
  from {
    background-color: rgba(255, 255, 255, 0.8);
  }
  to {
    background-color: rgba(255, 255, 255, 0.2);
  }
}

/* Efecte 'Congelar' (Mag de Gel) */
/* Amaga el fons de la paraula actual */
#game-engine.Congelar .paraula.actual {
  background-color: transparent;
  border: 1px dashed #ccc; /* Mostra una mica d'info */
}
/* Amaga el cursor de la lletra actual */
#game-engine.Congelar .lletra-actual {
  background-color: transparent;
  color: inherit;
}
</style>
