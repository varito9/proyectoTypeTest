<template>
  <div id="game-engine" :class="debuffState.isActive ? debuffState.type : ''">
    <div v-if="notification" class="notification-overlay">
      <div class="notification-content">
        {{ notification }}
      </div>
    </div>

    <div
      class="debuff-overlay"
      v-if="debuffState.isActive && (debuffState.type === 'Apagon' || debuffState.type === 'Flash')"
    ></div>

    <div id="player" v-if="!isSpectator">
      <div class="mage-info" v-if="jugador.mage">
        <h1 class="mage-title">Ets: {{ jugador.mage.name }}</h1>
        <p class="mage-description">
          <strong>Power-up (2 encert de frases seguit):</strong>
          {{ jugador.mage.powerUp }} - <em>{{ jugador.mage.description }}</em>
        </p>
      </div>

      <div class="paraules">
        <span
          v-for="(paraula, wordIndex) in estatDelJoc.paraules"
          :key="wordIndex"
          class="paraula"
          :class="{
            completada: paraula.estat === 'completada',
            activa: wordIndex === estatDelJoc.indexParaulaActiva,
            'powerup-word':
              powerUpState.ready && !powerUpState.used && powerUpState.wordIndex === wordIndex,
          }"
        >
          <template v-if="wordIndex === estatDelJoc.indexParaulaActiva && paraula.text">
            <span
              v-for="(lletra, letterIndex) in paraula.text.split('')"
              :key="letterIndex"
              :class="getClasseLletra(letterIndex)"
            >
              {{ getDisplayLetter(lletra, letterIndex) }}
            </span>
          </template>

          <template v-else>
            {{ paraula.text }}
          </template>
        </span>
      </div>

      <div v-if="estatDelJoc.paraules.length > 0 && !acabada"></div>

      <div v-else-if="acabada">🎉 Has completat el conjur! Esperant la resta de jugadors... 🎉</div>

      <div v-else>Carregant conjur...</div>

      <input
        v-model="estatDelJoc.textEntrat"
        @input="validarProgres"
        type="text"
        placeholder="Escriu aquí..."
        class="inputJoc"
        autofocus
        :disabled="acabada"
      />
    </div>

    <div id="spectator" v-else>
      <h4 class="spectator-name" v-if="nomJugadorObservat">
        Estàs observant a: <strong>{{ nomJugadorObservat }}</strong>
      </h4>
      <button @click="canviarJugadorObservat('anterior')">◀ Enrere</button>
      <button @click="canviarJugadorObservat('seguent')">Endavant ▶</button>

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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

// 🧩 PROPS
const props = defineProps({
  socket: { type: Object, required: true },
  jugador: { type: Object, required: true },
  llistaJug: { type: Array, required: true },
  roomName: { type: String, required: true },
  spellText: { type: Array, required: true },
  spellCategory: { type: String, required: false, default: '' },
})

// ⚙️ ESTATS PRINCIPALS
const estatDelJoc = reactive({
  paraules: [],
  indexParaulaActiva: 0,
  textEntrat: '',
})

const powerUpState = reactive({
  ready: false,
  used: false,
  name: '',
  wordIndex: null,
})

const debuffState = reactive({
  isActive: false,
  type: null,
  duration: 0,
  frozenLetterIndex: null,
  enredaderaText: null,
})

const estatJugadorObservat = reactive({
  paraules: [],
  indexParaulaActiva: 0,
  textEntrat: '',
})

const paraulaActiva = ref(null)
const textAnterior = ref('')
const acabada = ref(false)
const isSpectator = computed(() => props.jugador.role === 'spectator')

const idJugadorObservat = ref(null)
const darrersGameStats = ref([])
const jugadorsReals = ref([])
const notification = ref('')

const nomJugadorObservat = computed(() => {
  if (!idJugadorObservat.value || !jugadorsReals.value.length) {
    return '...' // Retorna un text temporal mentre carrega
  }

  const jugadorObservat = jugadorsReals.value.find((p) => p.id === idJugadorObservat.value)

  return jugadorObservat ? jugadorObservat.name : 'Cap jugador'
})

// 📢 NOTIFICACIONS
function showNotification(message, duration = 3000) {
  notification.value = message
  setTimeout(() => {
    notification.value = ''
  }, duration)
}

// 🧠 FUNCIONS DE CONTROL DEL JOC
function initializeActiveWord() {
  paraulaActiva.value =
    estatDelJoc.paraules && estatDelJoc.paraules.length > 0 ? estatDelJoc.paraules[0] : null
}

function validarProgres() {
  if (!paraulaActiva.value || acabada.value) return
  const paraulaObjectiu = getTexteParaulaActiva()
  const inputActual = estatDelJoc.textEntrat.toLowerCase()

  if (inputActual.length > textAnterior.value.length) {
    const indexActual = inputActual.length - 1
    if (inputActual[indexActual] !== paraulaObjectiu[indexActual]) {
      props.socket.emit('addErrors', { roomName: props.roomName, id: props.jugador.id })

      if (
        powerUpState.ready &&
        !powerUpState.used &&
        estatDelJoc.indexParaulaActiva === powerUpState.wordIndex
      ) {
        powerUpState.ready = false
        powerUpState.wordIndex = null
        showNotification('¡Has fallat i has perdut el power-up!')
      }
    }
  }

  textAnterior.value = inputActual

  if (inputActual === paraulaObjectiu) {
    if (
      powerUpState.ready &&
      !powerUpState.used &&
      estatDelJoc.indexParaulaActiva === powerUpState.wordIndex
    ) {
      // ¡Era esta! Llama a usePowerUp() automáticamente
      usePowerUp()
      // El estado se limpiará cuando llegue el evento 'powerUpUsed'
    }

    props.socket.emit('addPoints', { roomName: props.roomName, id: props.jugador.id })
    paraulaActiva.value.estat = 'completada'
    estatDelJoc.indexParaulaActiva++
    estatDelJoc.textEntrat = ''
    textAnterior.value = ''

    if (estatDelJoc.indexParaulaActiva < estatDelJoc.paraules.length) {
      paraulaActiva.value = estatDelJoc.paraules[estatDelJoc.indexParaulaActiva]
      if (debuffState.isActive && debuffState.type === 'Enredadera') {
        generarEnredaderaText()
      }
    } else {
      acabada.value = true
      paraulaActiva.value = null
      debuffState.enredaderaText = null
    }
  }

  playerGameStatus()
}

function getClasseLletra(indexLletra) {
  if (!paraulaActiva.value) return 'lletra-noArribada'

  if (debuffState.isActive && debuffState.type === 'Congelar') {
    // Comprobamos si la letra actual es la que "congelamos"
    if (debuffState.frozenLetterIndex !== null && indexLletra === debuffState.frozenLetterIndex) {
      return 'lletra-actual' // ¡Mostrem el cursor congelst aquí!
    }

    // Para todas las demás letras, no damos feedback de correcto/incorrecto
    // ni mostramos el cursor real en movimiento.
    return 'lletra-noArribada'
  }

  const paraulaObjectiu = getTexteParaulaActiva()
  const lletraEsperada = paraulaObjectiu[indexLletra]
  const lletraIntroduida = estatDelJoc.textEntrat[indexLletra]

  if (lletraIntroduida === undefined) {
    return indexLletra === estatDelJoc.textEntrat.length ? 'lletra-actual' : 'lletra-noArribada'
  }

  return lletraIntroduida === lletraEsperada ? 'lletra-correcta' : 'lletra-incorrecta'
}

function getSpectatorClasseLletra(indexLletra, paraulaSencera) {
  const lletraEsperada = paraulaSencera[indexLletra]
  const lletraIntroduida = estatJugadorObservat.textEntrat[indexLletra]

  if (lletraIntroduida === undefined) {
    return indexLletra === estatJugadorObservat.textEntrat.length
      ? 'lletra-actual'
      : 'lletra-noArribada'
  }

  return lletraIntroduida === lletraEsperada ? 'lletra-correcta' : 'lletra-incorrecta'
}

// 🧩 UTILITARIS
function getTexteParaulaActiva() {
  if (!paraulaActiva.value) return ''

  if (debuffState.isActive && debuffState.type === 'Enredadera') {
    return debuffState.enredaderaText || '' // Retorna el text amb caracter especial desat
  }
  const textOriginal = paraulaActiva.value.text
  if (debuffState.isActive && debuffState.type === 'Ignicio') {
    return textOriginal.split('').map(posarTildes).join('')
  }
  return textOriginal
}

function posarTildes(lletra) {
  const tildes = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' }
  return tildes[lletra] || lletra
}

function caracterEspecial() {
  const chars = '@#$%&*-+?'
  return chars[Math.floor(Math.random() * chars.length)]
}

function generarEnredaderaText() {
  if (!paraulaActiva.value) {
    debuffState.enredaderaText = null
    return
  }
  const textOriginal = paraulaActiva.value.text
  // Genera una nova paraula aleatòria i la desa
  debuffState.enredaderaText = textOriginal
    .split('')
    .map(() => caracterEspecial())
    .join('')
}

function getDisplayLetter(lletra, index) {
  if (debuffState.isActive && debuffState.type === 'Enredadera') {
    // Mostra la lletra de la paraula corrupta desada
    return debuffState.enredaderaText ? debuffState.enredaderaText[index] : lletra
  }

  if (!debuffState.isActive) return lletra
  if (debuffState.type === 'Ignicio') return posarTildes(lletra)
  return lletra
}

// 🛰️ ESTAT DEL JUGADOR
function playerGameStatus() {
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

// ⚡ POWER-UP
function usePowerUp() {
  if (!powerUpState.ready || powerUpState.used) return
  // No actualitzem l'estat aquí, esperem la confirmació del servidor
  props.socket.emit('usePowerUp', { roomName: props.roomName, id: props.jugador.id })
}

// 👁️ CONTROL D'ESPECTADOR
function canviarJugadorObservat(direccio) {
  const llista = jugadorsReals.value
  if (!llista.length) return

  const indexActual = llista.findIndex((p) => p.id === idJugadorObservat.value)
  let nouIndex = indexActual

  if (direccio === 'seguent') nouIndex = (nouIndex + 1) % llista.length
  else if (direccio === 'anterior') nouIndex = (nouIndex - 1 + llista.length) % llista.length

  idJugadorObservat.value = llista[nouIndex].id
  actualitzarVistaEspectador()
}

function actualitzarVistaEspectador() {
  if (!isSpectator.value) return
  const stats = darrersGameStats.value.find((s) => s.id === idJugadorObservat.value)
  if (!stats) return

  estatJugadorObservat.indexParaulaActiva = stats.indexParaulaActiva
  estatJugadorObservat.textEntrat = stats.textEntrat
  estatJugadorObservat.paraules = stats.paraules.map((p) => ({ ...p }))
}

// 🔌 SOCKETS
watch(
  () => props.spellText,
  (newSpellText) => {
    if (newSpellText && newSpellText.length > 0) {
      estatDelJoc.paraules = newSpellText
      estatDelJoc.indexParaulaActiva = 0
      estatDelJoc.textEntrat = ''
      acabada.value = false
      textAnterior.value = ''
      initializeActiveWord()

      powerUpState.ready = false
      powerUpState.used = false
      powerUpState.name = ''
      powerUpState.wordIndex = null

      debuffState.isActive = false
      debuffState.type = null
      debuffState.duration = 0
    }
  },
  { immediate: true },
)

props.socket.on('spectatorGameView', (gameStats) => {
  darrersGameStats.value = gameStats
  jugadorsReals.value = props.llistaJug.filter((p) => p.role !== 'spectator')

  const jugadorActualExisteix = jugadorsReals.value.find((p) => p.id === idJugadorObservat.value)
  if ((!idJugadorObservat.value || !jugadorActualExisteix) && jugadorsReals.value.length > 0) {
    idJugadorObservat.value = jugadorsReals.value[0].id
  }
  actualitzarVistaEspectador()
})

props.socket.on('powerUpReady', (mage) => {
  showNotification('🔥 Power-up a punt! 🔥')
  powerUpState.ready = true
  powerUpState.name = mage.powerUp
  powerUpState.wordIndex = estatDelJoc.indexParaulaActiva
})

props.socket.on('powerUpUsed', () => {
  showNotification(`Has utilitzat el teu poder: ${powerUpState.name}!`)
  powerUpState.ready = false
  powerUpState.used = true // Actualitzem l'estat al rebre la confirmació
  powerUpState.wordIndex = null
})

props.socket.on('powerUpFailed', ({ message }) => {
  showNotification(message)
})

props.socket.on('debuffReceived', ({ type, duration }) => {
  showNotification(`HAN FET SERVIR ${type.toUpperCase()} CONTRA TU!`)
  debuffState.isActive = true
  debuffState.type = type
  debuffState.duration = duration
  if (type === 'Congelar') {
    debuffState.frozenLetterIndex = estatDelJoc.textEntrat.length
  }

  if (type === 'Enredadera') {
    generarEnredaderaText()
  }
})

props.socket.on('debuffEnded', () => {
  showNotification("L'efecte del debuff ha acabat.")
  debuffState.isActive = false
  debuffState.type = null
  debuffState.duration = 0
  debuffState.frozenLetterIndex = null
  debuffState.enredaderaText = null
})

props.socket.on('tsunamiHit', () => {
  showNotification('🌊 TSUNAMI! Has de tornar a començar la frase.')
  estatDelJoc.indexParaulaActiva = 0
  estatDelJoc.textEntrat = ''
  textAnterior.value = ''
  if (estatDelJoc.paraules.length > 0) {
    paraulaActiva.value = estatDelJoc.paraules[0]
  } else {
    paraulaActiva.value = null
  }
  estatDelJoc.paraules.forEach((p) => (p.estat = 'pendent'))
  playerGameStatus()
})
</script>

<style scoped>
/* --- NOTIFICACIONS --- */
.notification-overlay {
  position: fixed;
  top: 4rem;
  left: 2rem;
}
.notification-content {
  background-color: #ffc107;
  color: #333;
  padding: 20px 40px;
  font-size: 1.1rem;
  font-weight: bold;
  animation: fadeInOut 3s ease-in-out;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
}
@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
  10%,
  90% {
    opacity: 1;
    transform: scale(1);
  }
}

/* --- ESTILS GENERALS --- */
.paraules {
  color: rgb(255, 255, 255);
  font-size: 1.5rem;
  line-height: 2;
  word-spacing: 0.5em;
  /* 🚫 EVITA SELECCIÓ/CÒPIA 🚫 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  /* CONFIGURACIÓ PER A TEXT COMPLET */
  opacity: 0.5; /* Opacitat base reduïda */
  transition: opacity 0.3s ease;
}

.paraula {
  display: inline-block;
  margin-right: 0.5em;
  padding: 2px 4px;
  opacity: 0.7; /* Opacitat lleugerament més alta que el pare (0.5) */
  transition: all 0.2s ease;
}

/* ESTIL DE LA PARAULA QUE S'ESTÀ ESCRIVINT */
.paraula.activa {
  opacity: 1; /* Màxima claredat (100%) */
  background-color: rgba(255, 255, 255, 0.1); /* Un fons subtil per ressaltar-la */
  border-radius: 4px;
}

/* ESTIL DE LA PARAULA COMPLETADA */
.paraula.completada {
  color: #a0a0a0;
  opacity: 0.4;
}

#player {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.inputJoc {
  font-size: 1.2rem;
  padding: 10px;
  width: 50%;
  margin-top: auto;
  margin-bottom: auto;
  align-self: center;
}

/* --- ESTILS DE LLETRES --- */
.lletra-correcta {
  color: #4caf50;
}
.lletra-incorrecta {
  color: #f44336;
  text-decoration: underline;
}
.lletra-actual {
  background-color: #777;
  color: white;
  border-radius: 2px;
}

/* --- POWER-UPS I DEBUFFS --- */
.mage-info {
  margin-bottom: 20px;
}
.mage-title {
  margin: 0 0 5px 0;
  font-size: 4rem;
  font-weight: 300;
  color: #f5f0ff;
  letter-spacing: 0.02em;
}
.mage-description {
  margin: 0;
  color: #ffffff;
}
.powerup-container {
  margin-bottom: 20px;
}

.paraula.powerup-word {
  color: #ffc107; /* Texto que resalta */
  font-weight: bold;
  border-radius: 4px;
  opacity: 1 !important; /* Asegura la visibilitat */
  animation: pulse-powerup 1s infinite alternate;
}

@keyframes pulse-powerup {
  from {
    transform: scale(1);
    box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
  }
  to {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 193, 7, 0.8);
  }
}

#game-engine {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.debuff-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}
#game-engine.Apagon .debuff-overlay {
  animation: apagon-animation 0.7s infinite alternate;
}
#game-engine.Flash .debuff-overlay {
  animation: flash-animation 0.4s infinite alternate;
}
@keyframes flash-animation {
  from {
    background-color: rgb(255, 255, 255);
  }
  to {
    background-color: rgba(250, 250, 250, 0.158);
  }
}

@keyframes apagon-animation {
  from {
    background-color: rgba(0, 0, 0, 0.8);
  }
  to {
    background-color: rgb(0, 0, 0);
  }
}

.negro {
  color: white;
}

.spectator-name {
  color: #ffffff;
  font-size: 1.3rem;
  margin-bottom: 15px; /* Deixa espai abans dels controls */
  text-align: center;
  width: 100%; /* Assegura que ocupi tot l'ample */
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.spectator-name strong {
  color: #ffc107; /* El color groc del power-up per ressaltar */
}
</style>
