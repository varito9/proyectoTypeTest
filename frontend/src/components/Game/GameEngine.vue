<template>
  <div id="game-engine" :class="debuffState.isActive ? debuffState.type : ''">
    <!-- Notificació -->
    <div v-if="notification" class="notification-overlay">
      <div class="notification-content">
        {{ notification }}
      </div>
    </div>

    <!-- Overlay de debuff -->
    <div
      class="debuff-overlay"
      v-if="debuffState.isActive && (debuffState.type === 'Apagon' || debuffState.type === 'Flash')"
    ></div>

    <!-- Vista del jugador -->
    <div id="player" v-if="!isSpectator">
      <div class="mage-info" v-if="jugador.mage">
        <h3>Ets: {{ jugador.mage.name }}</h3>
        <p>
          <strong>Power-up (3 encert de frases seguit):</strong>
          {{ jugador.mage.powerUp }} - <em>{{ jugador.mage.description }}</em>
        </p>
      </div>

      <h2 class="negro">Escriu la paraula següent:</h2>

      <div class="paraules" v-if="paraulaActual">
        <span
          class="paraula actual"
          :class="{
            'powerup-word':
              powerUpState.ready &&
              !powerUpState.used &&
              powerUpState.wordIndex === estatDelJoc.indexParaulaActiva,
          }"
        >
          <span
            v-for="(lletra, letterIndex) in paraulaActual.text.split('')"
            :key="letterIndex"
            :class="getClasseLletra(letterIndex)"
          >
            {{ getDisplayLetter(lletra, letterIndex) }}
          </span>
        </span>
      </div>

      <div v-else-if="estatDelJoc.paraules.length > 0 && !acabada">
        Carregant següent paraula...
      </div>

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

    <!-- Vista d’espectador -->
    <div id="spectator" v-else>
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

// 🧠 PROPIETATS COMPUTADES
const paraulaActual = computed(() => {
  if (acabada.value || !estatDelJoc.paraules.length) {
    return null
  }
  return estatDelJoc.paraules[estatDelJoc.indexParaulaActiva]
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
    } else {
      acabada.value = true
      paraulaActiva.value = null
    }
  }

  playerGameStatus()
}

function getClasseLletra(indexLletra) {
  if (!paraulaActiva.value) return 'lletra-noArribada'

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

function getDisplayWord(text) {
  if (!text) return ''
  if (!debuffState.isActive) return text
  if (debuffState.type === 'Ignicio') return text.split('').map(posarTildes).join('')
  if (debuffState.type === 'Enredadera') return text.split('').map(caracterEspecial).join('')
  return text
}

function getDisplayLetter(lletra, index) {
  if (!debuffState.isActive) return lletra
  if (debuffState.type === 'Ignicio') return posarTildes(lletra)
  if (debuffState.type === 'Enredadera') {
    const lletraIntroduida = estatDelJoc.textEntrat[index]
    return lletraIntroduida === lletra ? lletra : caracterEspecial()
  }
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
  powerUpState.ready = false
  powerUpState.used = true
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
})

props.socket.on('debuffEnded', () => {
  showNotification("L'efecte del debuff ha acabat.")
  debuffState.isActive = false
  debuffState.type = null
  debuffState.duration = 0
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
}

.paraula {
  display: inline-block;
  margin-right: 0.5em;
  padding: 2px 4px;
}

.paraula.actual {
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

/* --- POWER-UPS --- */
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
/* --- DEBUFFS --- */
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
#game-engine.Apagon .debuff-overlay {
  background-color: rgba(0, 0, 0, 0.85);
  transition: background-color 0.5s ease;
}
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
#game-engine.Congelar .paraula.actual {
  background-color: transparent;
  border: 1px dashed #ccc;
}
#game-engine.Congelar .lletra-actual {
  background-color: transparent;
  color: inherit;
}

.negro {
  color: white;
}

.paraula.powerup-word {
  color: #ffc107; /* Texto oscuro para que se lea bien */
  font-weight: bold;
  border-radius: 4px;
  /* Animación para que parpadee y llame la atención */
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
</style>
