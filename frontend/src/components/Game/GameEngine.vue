<template>
  <div
    id="game-engine"
    :class="[
      gameTheme,
      debuffState.isActive ? debuffState.type : '',
      {
        'casting-fire-spell': isCastingFireSpell,
        'casting-ice-spell': isCastingIceSpell,
        'casting-light-spell': isCastingLightSpell,
        'casting-dark-spell': isCastingDarkSpell,
        'casting-jungle-spell': isCastingJungleSpell,
        'casting-water-spell': isCastingWaterSpell,
      },
    ]"
  >
    <!-- Efectes espectaculars per tema -->
    <div class="theme-effects">
      <!-- Foc: Partícules + Vora cremant -->
      <div v-if="gameTheme === 'theme-fire'" class="fire-effects">
        <div class="fire-particles">
          <div v-for="i in 50" :key="`particle-${i}`" class="particle"></div>
        </div>
        <div class="smoke-particles">
          <div v-for="i in 20" :key="`smoke-${i}`" class="smoke"></div>
        </div>
      </div>
      <!-- Aigua: Onades + bombolles -->
      <div v-if="gameTheme === 'theme-water'" class="water-effects">
        <div class="water-waves">
          <div class="wave"></div>
          <div class="wave"></div>
          <div class="wave"></div>
        </div>
        <div class="bubbles">
          <div v-for="i in 30" :key="`bubble-${i}`" class="bubble"></div>
        </div>
      </div>
      <!-- Llum: Rajos de llum + brillantor -->
      <div v-if="gameTheme === 'theme-light'" class="light-effects">
        <div v-for="i in 20" :key="`star-${i}`" class="star"></div>
      </div>
      <!-- Terra: Enredaderes + fulles -->
      <div v-if="gameTheme === 'theme-earth'" class="earth-effects">
        <div class="earth-vines">
          <div class="vine-path" v-for="i in 5" :key="`vine-${i}`">
            <div class="vine"></div>
          </div>
        </div>
        <div class="falling-leaves">
          <div v-for="i in 20" :key="`leaf-${i}`" class="leaf"></div>
        </div>
      </div>
      <!-- Foscor: Ombres + llamps -->
      <div v-if="gameTheme === 'theme-dark'" class="dark-effects">
        <div class="dark-shadows">
          <div v-for="i in 5" :key="`shadow-${i}`" class="shadow"></div>
        </div>
        <div class="lightning"></div>
      </div>
      <!-- Gel -->
      <div v-if="gameTheme === 'theme-ice'" class="ice-effects">
        <div class="falling-snow">
          <div v-for="i in 150" :key="`snow-${i}`" class="snowflake" :style="{ '--i': i }"></div>
        </div>
      </div>
    </div>

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
      <!-- Decoraciones por tema alrededor del libro -->
      <!-- Água: Gotas de agua -->
      <div v-if="gameTheme === 'theme-water'" class="book-decoration water-drops">
        <div v-for="i in 8" :key="`drop-${i}`" class="water-drop" :style="{ '--pos': i }"></div>
      </div>
      <!-- Selva: Enredaderas decorativas -->
      <div v-if="gameTheme === 'theme-earth'" class="book-decoration jungle-vines">
        <div
          v-for="i in 6"
          :key="`vine-dec-${i}`"
          class="vine-decoration"
          :style="{ '--side': i % 2 }"
        ></div>
      </div>
      <!-- Luz: Destellos estelares -->
      <div v-if="gameTheme === 'theme-light'" class="book-decoration light-sparkles">
        <div
          v-for="i in 12"
          :key="`sparkle-${i}`"
          class="sparkle"
          :style="{ '--angle': i * 30 + 'deg' }"
        ></div>
      </div>
      <!-- Fuego: Llamas decorativas -->
      <div v-if="gameTheme === 'theme-fire'" class="book-decoration fire-flames">
        <div
          v-for="i in 4"
          :key="`flame-${i}`"
          class="flame-decoration"
          :style="{ '--side': i }"
        ></div>
      </div>
      <!-- Oscuridad: Sombras místicas -->
      <div v-if="gameTheme === 'theme-dark'" class="book-decoration dark-mist">
        <div
          v-for="i in 6"
          :key="`mist-${i}`"
          class="mist-decoration"
          :style="{ '--layer': i }"
        ></div>
      </div>
      <!-- Hielo: Cristales de hielo -->
      <div v-if="gameTheme === 'theme-ice'" class="book-decoration ice-crystals">
        <div v-for="i in 8" :key="`crystal-${i}`" class="ice-crystal" :style="{ '--pos': i }"></div>
      </div>

      <div class="book-container">
        <div class="book-page book-left-page">
          <div class="mage-info" v-if="jugador.mage">
            <h1 class="mage-title">Ets: {{ jugador.mage.name }}</h1>
            <p class="mage-description">
              <strong>Power-up (2 encert de frases seguit):</strong>
              {{ jugador.mage.powerUp }} -
              <em>{{ jugador.mage.description }}</em>
            </p>
          </div>
        </div>
        <div class="book-page book-right-page">
          <FireSpellAnimation v-if="showFireSpellAnimation" />
          <IceSpellAnimation v-if="showIceSpellAnimation" />
          <LightSpellAnimation v-if="showLightSpellAnimation" />
          <DarkSpellAnimation v-if="showDarkSpellAnimation" />
          <JungleSpellAnimation v-if="showJungleSpellAnimation" />
          <WaterSpellAnimation v-if="showWaterSpellAnimation" />
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

          <div v-if="estatDelJoc.paraules.length > 0 && !acabada" class="typing-indicator">
            Escriu el conjur...
          </div>

          <div v-else-if="acabada" class="end-message">
            🎉 Has completat el conjur! Esperant la resta de jugadors... 🎉
          </div>

          <div v-else class="loading-message">Carregant conjur...</div>
        </div>
      </div>

      <input
        v-model="estatDelJoc.textEntrat"
        @input="validarProgres"
        type="text"
        placeholder="Escriu aquí..."
        class="inputJoc"
        autofocus
        tabindex="0"
        :disabled="acabada"
      />
    </div>

    <div id="spectator" v-else>
      <!-- Decoraciones por tema alrededor del libro -->
      <div v-if="gameTheme === 'theme-water'" class="book-decoration water-drops">
        <div v-for="i in 8" :key="`drop-s-${i}`" class="water-drop" :style="{ '--pos': i }"></div>
      </div>
      <div v-if="gameTheme === 'theme-earth'" class="book-decoration jungle-vines">
        <div v-for="i in 6" :key="`vine-dec-s-${i}`" class="vine-decoration" :style="{ '--side': i % 2 }"></div>
      </div>
      <div v-if="gameTheme === 'theme-light'" class="book-decoration light-sparkles">
        <div v-for="i in 12" :key="`sparkle-s-${i}`" class="sparkle" :style="{ '--angle': i * 30 + 'deg' }"></div>
      </div>
      <div v-if="gameTheme === 'theme-fire'" class="book-decoration fire-flames">
        <div v-for="i in 4" :key="`flame-s-${i}`" class="flame-decoration" :style="{ '--side': i }"></div>
      </div>
      <div v-if="gameTheme === 'theme-dark'" class="book-decoration dark-mist">
        <div v-for="i in 6" :key="`mist-s-${i}`" class="mist-decoration" :style="{ '--layer': i }"></div>
      </div>
      <div v-if="gameTheme === 'theme-ice'" class="book-decoration ice-crystals">
        <div v-for="i in 8" :key="`crystal-s-${i}`" class="ice-crystal" :style="{ '--pos': i }"></div>
      </div>

      <div class="book-container">
        <!-- Botones navegación -->
        <button class="spectator-nav prev" @click="canviarJugadorObservat('anterior')" aria-label="Anterior"></button>
        <button class="spectator-nav next" @click="canviarJugadorObservat('seguent')" aria-label="Següent"></button>

        <div class="book-page book-left-page">
          <div class="mage-info">
            <h1 class="mage-title" v-if="nomJugadorObservat">Estàs observant a: {{ nomJugadorObservat }}</h1>
          </div>
        </div>
        <div class="book-page book-right-page">
          <div class="paraules">
            <span
              v-for="(paraula, wordIndex) in estatJugadorObservat.paraules"
              :key="wordIndex"
              class="paraula"
              :class="{
                completada: paraula.estat === 'completada',
                activa: wordIndex === estatJugadorObservat.indexParaulaActiva,
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import FireSpellAnimation from './FireSpellAnimation.vue'
import IceSpellAnimation from './IceSpellAnimation.vue'
import LightSpellAnimation from './LightSpellAnimation.vue'
import DarkSpellAnimation from './DarkSpellAnimation.vue'
import JungleSpellAnimation from './JungleSpellAnimation.vue'
import WaterSpellAnimation from './WaterSpellAnimation.vue'

// 🎨 COMPUTED THEME
// En espectador, prenem el mag del jugador observat
const observedMageName = computed(() => {
  if (!isSpectator.value) return props.jugador?.mage?.name?.toLowerCase?.()
  const jugadorObs = jugadorsReals.value.find((p) => p.id === idJugadorObservat.value)
  return jugadorObs && jugadorObs.mage && jugadorObs.mage.name
    ? jugadorObs.mage.name.toLowerCase()
    : ''
})

const gameTheme = computed(() => {
  const mageName = observedMageName.value
  if (!mageName) {
    return 'theme-default'
  }
  if (mageName.includes('foc')) {
    return 'theme-fire'
  } else if (mageName.includes('aigua')) {
    return 'theme-water'
  } else if (
    mageName.includes('jungla') ||
    mageName.includes('selva') ||
    mageName.includes('terra')
  ) {
    return 'theme-earth'
  } else if (mageName.includes('llum') || mageName.includes('light')) {
    return 'theme-light'
  } else if (
    mageName.includes('oscur') ||
    mageName.includes('foscor') ||
    mageName.includes('dark')
  ) {
    return 'theme-dark'
  } else if (mageName.includes('gel') || mageName.includes('hielo') || mageName.includes('ice')) {
    return 'theme-ice'
  }
  return 'theme-default'
})

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

const showFireSpellAnimation = ref(false)
const showIceSpellAnimation = ref(false)
const showLightSpellAnimation = ref(false)
const showDarkSpellAnimation = ref(false)
const showJungleSpellAnimation = ref(false)
const showWaterSpellAnimation = ref(false)

const isCastingFireSpell = ref(false)
const isCastingIceSpell = ref(false)
const isCastingLightSpell = ref(false)
const isCastingDarkSpell = ref(false)
const isCastingJungleSpell = ref(false)
const isCastingWaterSpell = ref(false)

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
      props.socket.emit('addErrors', {
        roomName: props.roomName,
        id: props.jugador.id,
      })

      if (powerUpState.ready && estatDelJoc.indexParaulaActiva === powerUpState.wordIndex) {
        powerUpState.ready = false
        powerUpState.wordIndex = null
        showNotification('¡Has fallat i has perdut el power-up!')
      }
    }
  }

  textAnterior.value = inputActual

  if (inputActual === paraulaObjectiu) {
    if (powerUpState.ready && estatDelJoc.indexParaulaActiva === powerUpState.wordIndex) {
      usePowerUp()
    }

    props.socket.emit('addPoints', {
      roomName: props.roomName,
      id: props.jugador.id,
    })
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
  props.socket.emit('usePowerUp', {
    roomName: props.roomName,
    id: props.jugador.id,
  })
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
  const powerName = powerUpState.name.toLowerCase()

  if (powerName.includes('ignició')) {
    isCastingFireSpell.value = true
    setTimeout(() => (isCastingFireSpell.value = false), 1000)
  } else if (powerName.includes('congelació')) {
    isCastingIceSpell.value = true
    setTimeout(() => (isCastingIceSpell.value = false), 1000)
  } else if (powerName.includes('flash')) {
    isCastingLightSpell.value = true
    setTimeout(() => (isCastingLightSpell.value = false), 1000)
  } else if (powerName.includes('apagada')) {
    isCastingDarkSpell.value = true
    setTimeout(() => (isCastingDarkSpell.value = false), 1300)
  } else if (powerName.includes('enredadera')) {
    isCastingJungleSpell.value = true
    setTimeout(() => (isCastingJungleSpell.value = false), 1000)
  } else if (powerName.includes('tsunami')) {
    isCastingWaterSpell.value = true
    setTimeout(() => (isCastingWaterSpell.value = false), 1200)
  }

  powerUpState.ready = false
  powerUpState.wordIndex = null
})

props.socket.on('powerUpFailed', ({ message }) => {
  showNotification(message)
})

props.socket.on('debuffReceived', ({ type, duration }) => {
  showNotification(`HAN FET SERVIR ${type.toUpperCase()} CONTRA TU!`)

  if (type === 'Ignicio') {
    showFireSpellAnimation.value = true
    setTimeout(() => {
      showFireSpellAnimation.value = false
    }, 1000) // Durada de l'animació
  } else if (type === 'Congelar') {
    showIceSpellAnimation.value = true
    setTimeout(() => {
      showIceSpellAnimation.value = false
    }, 1000)
  } else if (type === 'Flash') {
    showLightSpellAnimation.value = true
    setTimeout(() => {
      showLightSpellAnimation.value = false
    }, 1000)
  } else if (type === 'Apagon') {
    showDarkSpellAnimation.value = true
    setTimeout(() => {
      showDarkSpellAnimation.value = false
    }, 1300)
  } else if (type === 'Enredadera') {
    showJungleSpellAnimation.value = true
    setTimeout(() => {
      showJungleSpellAnimation.value = false
    }, 1000)
  }

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
  const lastDebuffType = debuffState.type

  if (lastDebuffType === 'Ignicio') {
    showFireSpellAnimation.value = true
    setTimeout(() => (showFireSpellAnimation.value = false), 1000)
  } else if (lastDebuffType === 'Congelar') {
    showIceSpellAnimation.value = true
    setTimeout(() => (showIceSpellAnimation.value = false), 1000)
  } else if (lastDebuffType === 'Flash') {
    showLightSpellAnimation.value = true
    setTimeout(() => (showLightSpellAnimation.value = false), 1000)
  } else if (lastDebuffType === 'Apagon') {
    showDarkSpellAnimation.value = true
    setTimeout(() => (showDarkSpellAnimation.value = false), 1300)
  } else if (lastDebuffType === 'Enredadera') {
    showJungleSpellAnimation.value = true
    setTimeout(() => (showJungleSpellAnimation.value = false), 1000)
  }

  debuffState.isActive = false
  debuffState.type = null
  debuffState.duration = 0
  debuffState.frozenLetterIndex = null
  debuffState.enredaderaText = null
})

props.socket.on('tsunamiHit', () => {
  showNotification('🌊 TSUNAMI! Has de tornar a començar la frase.')
  showWaterSpellAnimation.value = true
  setTimeout(() => {
    showWaterSpellAnimation.value = false
  }, 1200)
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
  z-index: 100;
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
#game-engine {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 2rem;
  transition: background-color 0.5s ease;
  overflow: hidden; /* Per contenir les partícules */
}

#player {
  display: flex;
  flex-direction: column;
  align-items: center; /* Centra el llibre */
  justify-content: center; /* Centra el llibre */
  flex: 1;
  width: 100%;
  z-index: 2; /* Per sobre dels efectes de fons */
}

#spectator {
  display: flex;
  flex-direction: column;
  align-items: center; /* Centra el llibre */
  justify-content: center; /* Centra el llibre */
  flex: 1;
  width: 100%;
  z-index: 2; /* Per sobre dels efectes de fons */
}

.inputJoc {
  font-size: 1.5rem;
  padding: 15px;
  width: 80%;
  max-width: 800px; /* Amplada màxima per a pantalles grans */
  margin-top: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 10px;
  text-align: center;
  font-family: 'Cinzel', serif; /* Font més màgica */
}

.inputJoc:focus {
  outline: none;
  border-color: #ffc107;
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
}

/* --- ESTIL DEL LLIBRE --- */
.book-container {
  position: relative; /* Per a posicionar efectes com la vora cremant */
  display: flex;
  width: 90%;
  max-width: 1400px;
  height: 70vh;
  max-height: 700px;
  background-color: transparent;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  transition:
    transform 0.5s ease,
    box-shadow 0.5s ease;
}

.book-page {
  flex: 1;
  padding: 2rem 3rem;
  overflow-y: auto;
  background-size: cover;
  background-position: center;
  transition: color 0.5s ease;
}

/* --- SCROLLBAR (base) --- */
.book-page::-webkit-scrollbar {
  width: 12px;
}
.book-page::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.12);
}
.book-page::-webkit-scrollbar-thumb {
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background-clip: padding-box;
  background: linear-gradient(135deg, #bdbdbd, #9e9e9e);
  box-shadow:
    inset 0 0 8px rgba(255, 255, 255, 0.5),
    0 0 8px rgba(0, 0, 0, 0.15);
}
.book-page::-webkit-scrollbar-thumb:hover {
  filter: brightness(1.15);
}
/* Firefox */
.theme-default .book-page {
  scrollbar-width: thin;
  scrollbar-color: #9e9e9e rgba(255, 255, 255, 0.35);
}

.book-left-page {
  border-right: 2px solid #5a3a1a; /* Divisió del llibre */
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-right-page {
  font-family: 'Lora', serif; /* Font de llibre */
  color: #3b2a1a;
}

.paraules {
  font-size: 1.6rem;
  line-height: 2.2;
  word-spacing: 0.6em;
  user-select: none;
  opacity: 1;
  transition: color 0.5s ease;
}

.paraula {
  display: inline-block;
  margin-right: 0.6em;
  padding: 2px 4px;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.paraula.activa {
  background-color: rgba(211, 175, 134, 0.3);
  border-radius: 4px;
}

.paraula.completada {
  color: #8c7d6e;
  opacity: 0.7;
}

/* --- ESTILS DE LLETRES --- */
.lletra-correcta {
  color: #2a752d;
  font-weight: bold;
}
.lletra-incorrecta {
  color: #b3362b;
  text-decoration: line-through;
}
.lletra-actual {
  background-color: #ffc107;
  color: #333;
  border-radius: 2px;
  animation: blink-cursor 1s infinite;
}
@keyframes blink-cursor {
  50% {
    background-color: transparent;
    color: inherit;
  }
}

/* --- EFECTES DE FONS --- */
.theme-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* --- TEMES ELEMENTALS --- */
.theme-default {
  background-color: #2c2a3a;
}
.theme-default .book-page {
  background-image: url('/img/books/book-default.jpg');
}

/* --- TEMA FOC (ESPECTACULAR) --- */
.theme-fire {
  background: linear-gradient(135deg, #7a1c00 0%, #3d0f00 50%, #1a0700 100%);
  position: relative;
}
.theme-fire::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse at 30% 40%, rgba(255, 140, 0, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(255, 69, 0, 0.2) 0%, transparent 50%);
  animation: fire-glow 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}
@keyframes fire-glow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.9;
  }
}
.theme-fire .book-page {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #5d1e01;
  box-shadow: inset 0 0 30px rgba(255, 140, 0, 0.15);
}
.theme-fire .book-page::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #ffb74d, #ff8c00);
  border-color: rgba(255, 240, 220, 0.9);
}
.theme-fire .book-page::-webkit-scrollbar-track {
  background: rgba(255, 140, 0, 0.18);
}
.theme-fire .book-page {
  scrollbar-width: thin;
  scrollbar-color: #ff8c00 rgba(255, 140, 0, 0.18);
}
.theme-fire .book-left-page {
  background-image: linear-gradient(135deg, #ffebee 0%, #ffccbc 100%);
}
.theme-fire .paraules {
  color: #5d1e01;
  text-shadow: 0 1px 2px rgba(255, 200, 100, 0.2);
}
.theme-fire .mage-title,
.theme-fire .mage-description {
  color: #5d1e01;
}
.theme-fire .book-container {
  animation: heat-warp 4s ease-in-out infinite;
  box-shadow: 0 0 40px rgba(255, 102, 0, 0.6);
}
.theme-fire .book-container::before {
  content: '';
  position: absolute;
  inset: -15px;
  border-radius: 15px;
  background: linear-gradient(
    45deg,
    #ff8c00 0%,
    #ff6b35 25%,
    #ff4500 50%,
    #ff6b35 75%,
    #ff8c00 100%
  );
  background-size: 200% 200%;
  animation: burning-edge 2.5s ease infinite;
  filter: blur(20px);
  opacity: 0.7;
  z-index: -1;
}
.theme-fire .book-container::after {
  content: '';
  position: absolute;
  inset: -25px;
  border-radius: 20px;
  background: linear-gradient(45deg, #ff4500, #ff8c00);
  background-size: 200% 200%;
  animation: burning-edge 3s ease infinite reverse;
  filter: blur(35px);
  opacity: 0.4;
  z-index: -2;
}
@keyframes burning-edge {
  0% {
    background-position: 0% 50%;
    filter: brightness(1) blur(20px);
  }
  50% {
    background-position: 100% 50%;
    filter: brightness(1.2) blur(25px);
  }
  100% {
    background-position: 0% 50%;
    filter: brightness(1) blur(20px);
  }
}
@keyframes heat-warp {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.01);
  }
}
.theme-fire .particle {
  position: absolute;
  bottom: -5%;
  border-radius: 50%;
  opacity: 0;
  animation: rise-fire 3s to 10s infinite;
  background-color: #ffc107;
  --size: calc((var(--i) * 0.1) + 3px);
  width: var(--size);
  height: var(--size);
  left: calc(var(--i) * 2%);
  animation-delay: calc(var(--i) * 0.1s);
}
@keyframes rise-fire {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(-110vh) scale(0.5);
    opacity: 0;
  }
}
.theme-fire .smoke {
  position: absolute;
  bottom: 0;
  background-color: rgba(50, 50, 50, 0.3);
  border-radius: 50%;
  opacity: 0;
  animation: rise-smoke 8s to 15s infinite;
  --size: calc((var(--i) * 2) + 10px);
  width: var(--size);
  height: var(--size);
  left: calc(var(--i) * 5%);
  animation-delay: calc(var(--i) * 0.3s);
}
@keyframes rise-smoke {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  20% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-100vh) scale(3);
    opacity: 0;
  }
}

/* --- TEMA AIGUA (OLAS ANIMADAS ESPECTACULARES) --- */
.theme-water {
  background: linear-gradient(135deg, #001f3f 0%, #003d7a 50%, #002a5c 100%);
  position: relative;
  overflow: hidden;
}
.theme-water::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(64, 164, 223, 0.2) 0%, transparent 60%);
  animation: water-glow 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}
@keyframes water-glow {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}
.theme-water .book-page {
  background: linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 100%);
  color: #004d7a;
  box-shadow: inset 0 0 30px rgba(3, 169, 244, 0.1);
}
.theme-water .book-page::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #64b5f6, #03a9f4);
  border-color: rgba(224, 247, 255, 0.9);
}
.theme-water .book-page::-webkit-scrollbar-track {
  background: rgba(3, 169, 244, 0.18);
}
.theme-water .book-page {
  scrollbar-width: thin;
  scrollbar-color: #03a9f4 rgba(3, 169, 244, 0.18);
}
.theme-water .book-left-page {
  background-image: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
}
.theme-water .paraules {
  color: #004d7a;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.4);
}
.theme-water .mage-title,
.theme-water .mage-description {
  color: #004d7a;
}
.wave {
  position: absolute;
  bottom: 0;
  left: -10%;
  width: 120%;
  height: 120px;
  background: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3e%3cpath d='M0,50 Q150,0 300,50 T600,50 T900,50 T1200,50 L1200,120 L0,120 Z' fill='%2303a9f4' opacity='0.5'/%3e%3c/svg%3e");
  background-repeat: repeat-x;
  animation: wave-motion 6s linear infinite;
}
.wave:nth-child(1) {
  bottom: 10px;
  animation-duration: 8s;
  opacity: 0.9;
}
.wave:nth-child(2) {
  bottom: 30px;
  animation-duration: 10s;
  animation-direction: reverse;
  opacity: 0.6;
}
.wave:nth-child(3) {
  bottom: 50px;
  animation-duration: 12s;
  opacity: 0.4;
}
@keyframes wave-motion {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(300px);
  }
}
.bubble {
  position: absolute;
  bottom: -20px;
  background: radial-gradient(
    ellipse at 30% 30%,
    rgba(255, 255, 255, 0.4),
    rgba(100, 200, 255, 0.2)
  );
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: rise-bubble 6s to 15s ease-in infinite;
  --size: calc((var(--i) * 0.15) + 3px);
  width: var(--size);
  height: var(--size);
  left: calc(var(--i) * 3.3%);
  animation-delay: calc(var(--i) * 0.2s);
  box-shadow: inset -1px -1px 3px rgba(255, 255, 255, 0.5);
}
@keyframes rise-bubble {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0.8;
  }
  100% {
    transform: translateY(-110vh) translateX(calc(sin(var(--i)) * 60px));
    opacity: 0;
  }
}

/* --- TEMA TIERRA/JUNGLA (VERDE BRILLANTE Y LIMPIO) --- */
.theme-earth {
  background: linear-gradient(135deg, #7cb342 0%, #9ccc65 50%, #8bc34a 100%);
  position: relative;
}
.theme-earth::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
.theme-earth .book-page {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #e8f5e9 100%);
  color: #1b5e20;
  box-shadow: inset 0 0 40px rgba(76, 175, 80, 0.15);
  border: 2px solid rgba(76, 175, 80, 0.3);
}
.theme-earth .book-page::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #81c784, #4caf50);
  border-color: rgba(232, 245, 233, 0.95);
}
.theme-earth .book-page::-webkit-scrollbar-track {
  background: rgba(76, 175, 80, 0.18);
}
.theme-earth .book-page {
  scrollbar-width: thin;
  scrollbar-color: #4caf50 rgba(76, 175, 80, 0.18);
}
.theme-earth .book-left-page {
  background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%);
}
.theme-earth .book-container {
  box-shadow:
    0 0 60px rgba(124, 179, 66, 0.5),
    0 0 100px rgba(156, 204, 101, 0.3);
}
.theme-earth .paraules {
  color: #1b5e20;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  font-weight: 500;
}
.theme-earth .mage-title {
  color: #2e7d32;
  text-shadow: 0 2px 6px rgba(76, 175, 80, 0.2);
  letter-spacing: 0.05em;
}
.theme-earth .mage-description {
  color: #1b5e20;
  font-weight: 500;
}
.vine-path {
  position: absolute;
  bottom: 0;
  left: calc(var(--i) * 15% - 10%);
  width: 100px;
  height: 100%;
  opacity: 0.15;
}
.vine {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    #66bb6a 30%,
    #81c784 50%,
    #66bb6a 70%,
    transparent
  );
  border-radius: 50% 50% 0 0;
  animation: vine-grow 10s ease-out infinite;
  animation-delay: calc(var(--i) * -1.2s);
}
@keyframes vine-grow {
  0% {
    clip-path: inset(100% 0 0 0);
  }
  100% {
    clip-path: inset(0% 0 0 0);
  }
}
.leaf {
  position: absolute;
  top: -5%;
  left: calc(var(--i) * 3.33%);
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #8bc34a, #9ccc65);
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 50% 85%, 18% 100%, 0% 38%);
  animation: fall-leaf-jungle 7s to 18s linear infinite;
  animation-delay: calc(var(--i) * 0.12s);
  transform-origin: center center;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
}
@keyframes fall-leaf-jungle {
  0% {
    transform: translateY(0) rotateZ(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotateZ(calc(var(--i) * 35deg));
    opacity: 0;
  }
}

/* --- TEMA LLUM (BLANCO PURO CON AURA DORADA) --- */
.theme-light {
  background: linear-gradient(135deg, #ffffff 0%, #fffef5 50%, #ffffff 100%);
  position: relative;
}
.theme-light::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.2) 0%, transparent 60%);
  animation: divine-glow 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}
@keyframes divine-glow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}
.theme-light .book-page {
  background: linear-gradient(135deg, #ffffff 0%, #fffef5 50%, #ffffff 100%);
  color: #1a1a1a;
  box-shadow: inset 0 0 30px rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.25);
}
.theme-light .book-page::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #ffe082, #ffd54f, #ffd700);
  border-color: rgba(255, 255, 240, 0.95);
}
.theme-light .book-page::-webkit-scrollbar-track {
  background: rgba(255, 215, 0, 0.22);
}
.theme-light .book-page {
  scrollbar-width: thin;
  scrollbar-color: #ffd54f rgba(255, 215, 0, 0.22);
}
.theme-light .book-left-page {
  background: linear-gradient(135deg, #ffffff 0%, #fffef5 100%);
}
.theme-light .book-container {
  box-shadow:
    0 0 80px rgba(255, 215, 0, 0.7),
    0 0 120px rgba(255, 200, 50, 0.5),
    0 0 160px rgba(255, 180, 0, 0.3);
}
.theme-light .paraules {
  color: #1a1a1a;
  text-shadow: 0 1px 3px rgba(255, 215, 0, 0.15);
  font-weight: 500;
}
.theme-light .mage-title {
  color: #1a1a1a;
  text-shadow: 0 2px 6px rgba(255, 215, 0, 0.25);
  letter-spacing: 0.05em;
}
.theme-light .mage-description {
  color: #2a2a2a;
  font-weight: 500;
}
.light-effects {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}
.star {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle at 30% 30%, #ffff99, #ffd700);
  border-radius: 50%;
  animation: twinkle-divine 2.5s ease-in-out infinite;
  box-shadow:
    0 0 12px #ffeb3b,
    0 0 25px #ffc107;
}
@keyframes twinkle-divine {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.7);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}
.light-effects .star:nth-child(5n) {
  top: 5%;
  left: 15%;
  animation-delay: 0s;
}
.light-effects .star:nth-child(7n) {
  top: 15%;
  left: 80%;
  animation-delay: 0.5s;
}
.light-effects .star:nth-child(11n) {
  top: 10%;
  left: 45%;
  animation-delay: 1s;
}
.light-effects .star:nth-child(13n) {
  top: 35%;
  left: 20%;
  animation-delay: 1.5s;
}
.light-effects .star:nth-child(17n) {
  top: 3%;
  left: 88%;
  animation-delay: 2s;
}
.light-effects .star:nth-child(19n) {
  top: 30%;
  left: 60%;
  animation-delay: 2.5s;
}

/* --- TEMA FOSCOR (AZUL PROFUNDO Y PÚRPURA BRILLANTE) --- */
.theme-dark {
  background: linear-gradient(135deg, #3d3d7d 0%, #5d4e99 50%, #4a3fa0 100%);
  position: relative;
}
.theme-dark::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(150, 100, 200, 0.15) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}
.theme-dark .book-page {
  background: linear-gradient(135deg, #e8e0f5 0%, #f0e8f8 50%, #e8e0f5 100%);
  color: #2a2a5a;
  box-shadow: inset 0 0 40px rgba(100, 50, 200, 0.12);
  border: 2px solid rgba(100, 50, 200, 0.25);
}
.theme-dark .book-page::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #b39ddb, #8e44ad);
  border-color: rgba(245, 238, 255, 0.95);
}
.theme-dark .book-page::-webkit-scrollbar-track {
  background: rgba(150, 100, 200, 0.22);
}
.theme-dark .book-page {
  scrollbar-width: thin;
  scrollbar-color: #8e44ad rgba(150, 100, 200, 0.22);
}
.theme-dark .book-left-page {
  background: linear-gradient(135deg, #f0e8f8 0%, #e8e0f5 100%);
}
.theme-dark .book-container {
  box-shadow:
    0 0 70px rgba(100, 50, 200, 0.6),
    0 0 110px rgba(150, 100, 200, 0.4);
}
.theme-dark .paraules {
  color: #2a2a5a;
  text-shadow: 0 1px 3px rgba(100, 50, 200, 0.15);
  font-weight: 500;
}
.theme-dark .mage-title {
  color: #3a3a6a;
  text-shadow: 0 2px 6px rgba(100, 50, 200, 0.25);
  letter-spacing: 0.05em;
}
.theme-dark .mage-description {
  color: #2a2a5a;
  font-weight: 500;
}
.shadow {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at 50% 50%, rgba(150, 100, 200, 0.1) 0%, transparent 70%);
  pointer-events: none;
}
@keyframes shadow-drift-mystique {
  0%,
  100% {
    transform: translateX(-40px) translateY(0) scale(1);
    opacity: 0.4;
  }
  50% {
    transform: translateX(40px) translateY(-30px) scale(1.05);
    opacity: 0.7;
  }
}
.lightning {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(150, 80, 255, 0.6);
  opacity: 0;
  animation: lightning-mystique 12s steps(3, end) infinite;
  animation-delay: 2s;
  box-shadow: inset 0 0 80px rgba(100, 50, 200, 0.5);
  pointer-events: none;
}
@keyframes lightning-mystique {
  0%,
  93% {
    opacity: 0;
  }
  94% {
    opacity: 0.5;
  }
  95% {
    opacity: 0;
  }
  96% {
    opacity: 0.7;
  }
  97% {
    opacity: 0;
  }
  98% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
  }
}

/* --- TEMA GEL (CONGELADO CON ESCARCHA) --- */
.theme-ice {
  background: linear-gradient(135deg, #b3e5fc 0%, #81d4fa 50%, #4fc3f7 100%);
  position: relative;
}
.theme-ice::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(176, 224, 230, 0.3) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 20%, rgba(200, 235, 245, 0.2) 0%, transparent 50%);
  animation: ice-shimmer 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}
@keyframes ice-shimmer {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}
.theme-ice .book-page {
  background: linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 100%);
  color: #004d7a;
  border: 2px solid rgba(100, 200, 255, 0.3);
  box-shadow:
    inset 0 0 30px rgba(100, 200, 255, 0.2),
    inset 0 0 60px rgba(200, 230, 245, 0.1);
}
.theme-ice .book-page::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #a5d6ff, #64b5f6);
  border-color: rgba(235, 248, 255, 0.95);
}
.theme-ice .book-page::-webkit-scrollbar-track {
  background: rgba(144, 202, 249, 0.22);
}
.theme-ice .book-page {
  scrollbar-width: thin;
  scrollbar-color: #64b5f6 rgba(144, 202, 249, 0.22);
}
.theme-ice .book-left-page {
  background-image: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
}
.theme-ice .book-container {
  box-shadow: 0 0 40px rgba(144, 202, 249, 0.8);
  animation: ice-pulse 5s ease-in-out infinite;
  border: 2px solid rgba(100, 200, 255, 0.4);
}
.theme-ice .book-container::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 12px;
  background:
    linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.1) 25%, transparent 50%),
    linear-gradient(-45deg, transparent 0%, rgba(255, 255, 255, 0.1) 25%, transparent 50%);
  pointer-events: none;
  animation: frost-shimmer 6s ease-in-out infinite;
  z-index: -1;
}
@keyframes ice-pulse {
  0%,
  100% {
    box-shadow: 0 0 40px rgba(144, 202, 249, 0.6);
  }
  50% {
    box-shadow: 0 0 60px rgba(200, 235, 245, 1);
  }
}
@keyframes frost-shimmer {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}
.theme-ice .paraules {
  color: #004d7a;
}
.theme-ice .mage-title,
.theme-ice .mage-description {
  color: #00838f;
}
.snowflake {
  position: absolute;
  top: -10%;
  left: calc(var(--i) * 0.67%);
  width: calc(var(--i) * 0.08px + 2px);
  height: calc(var(--i) * 0.08px + 2px);
  background: linear-gradient(45deg, white, rgba(200, 230, 245, 0.8));
  border-radius: 50%;
  opacity: calc(var(--i) / 150 + 0.4);
  animation: fall-snow 12s to 25s linear infinite;
  animation-delay: calc(var(--i) * 0.08s);
  box-shadow: 0 0 8px rgba(100, 200, 255, 0.6);
}
.snowflake::before,
.snowflake::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: inherit;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
}
.snowflake::after {
  transform: translate(-50%, -50%) rotate(90deg);
}
@keyframes fall-snow {
  to {
    transform: translateY(110vh) translateX(calc(sin(var(--i) / 5) * 40px))
      rotateZ(calc(var(--i) * 1deg));
    opacity: 0;
  }
}

/* ============================================ */
/* DECORACIONES ALREDEDOR DEL LIBRO POR TEMA  */
/* ============================================ */
.book-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

/* --- AGUA: Gotas de agua decorativas GRANDES --- */
.water-drops {
  filter: drop-shadow(0 0 20px rgba(100, 150, 255, 0.6));
}
.water-drop {
  position: absolute;
  width: 28px;
  height: 35px;
  background: radial-gradient(ellipse at 35% 35%, rgba(150, 220, 255, 1), rgba(50, 150, 220, 0.7));
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  animation: drop-fall 2.5s to 5s ease-in infinite;
  opacity: 0.9;
  box-shadow:
    0 0 15px rgba(100, 200, 255, 0.8),
    inset -2px -2px 8px rgba(255, 255, 255, 0.4);
}
.water-drop:nth-child(1) {
  top: 5%;
  left: 8%;
  animation-delay: 0s;
}
.water-drop:nth-child(2) {
  top: 12%;
  right: 10%;
  animation-delay: 0.8s;
}
.water-drop:nth-child(3) {
  top: 30%;
  left: 5%;
  animation-delay: 1.2s;
}
.water-drop:nth-child(4) {
  top: 45%;
  right: 6%;
  animation-delay: 1.6s;
}
.water-drop:nth-child(5) {
  top: 60%;
  left: 7%;
  animation-delay: 2s;
}
.water-drop:nth-child(6) {
  top: 75%;
  right: 8%;
  animation-delay: 2.4s;
}
.water-drop:nth-child(7) {
  top: 18%;
  left: 3%;
  animation-delay: 0.4s;
}
.water-drop:nth-child(8) {
  top: 68%;
  right: 4%;
  animation-delay: 1.4s;
}
@keyframes drop-fall {
  0% {
    transform: rotate(-45deg) translateY(-80px);
    opacity: 0;
  }
  5% {
    opacity: 0.9;
  }
  95% {
    opacity: 0.9;
  }
  100% {
    transform: rotate(-45deg) translateY(80px);
    opacity: 0;
  }
}

/* --- SELVA: Hojas y ramas grandes estilo jungla --- */
.jungle-vines {
  filter: drop-shadow(0 0 18px rgba(76, 175, 80, 0.7));
}
.vine-decoration {
  position: absolute;
  width: 90px;
  height: 90px;
  background: linear-gradient(135deg, #8bc34a 0%, #558b2f 100%);
  clip-path: polygon(20% 0%, 80% 10%, 100% 35%, 90% 70%, 70% 85%, 30% 90%, 10% 75%, 0% 40%);
  opacity: 0.85;
  animation: leaf-flutter 3s ease-in-out infinite;
  box-shadow: 0 0 18px rgba(76, 175, 80, 0.8);
  filter: brightness(1.1);
}
.vine-decoration:nth-child(1) {
  top: 5%;
  left: 6%;
  animation-delay: 0s;
  transform: rotate(-15deg);
}
.vine-decoration:nth-child(2) {
  top: 12%;
  right: 8%;
  animation-delay: 0.5s;
  transform: scaleX(-1) rotate(20deg);
}
.vine-decoration:nth-child(3) {
  top: 45%;
  left: 3%;
  animation-delay: 1s;
  transform: rotate(-10deg);
}
.vine-decoration:nth-child(4) {
  top: 50%;
  right: 5%;
  animation-delay: 1.5s;
  transform: scaleX(-1) rotate(-18deg);
}
.vine-decoration:nth-child(5) {
  top: 70%;
  left: 5%;
  animation-delay: 0.3s;
  transform: rotate(12deg);
}
.vine-decoration:nth-child(6) {
  top: 75%;
  right: 4%;
  animation-delay: 0.8s;
  transform: scaleX(-1) rotate(-20deg);
}
@keyframes leaf-flutter {
  0%,
  100% {
    transform: rotateZ(-10deg) translateY(0) scale(0.95);
    opacity: 0.85;
  }
  25% {
    transform: rotateZ(8deg) translateY(-4px) scale(1);
    opacity: 0.95;
  }
  50% {
    transform: rotateZ(-12deg) translateY(0) scale(0.98);
    opacity: 0.9;
  }
  75% {
    transform: rotateZ(5deg) translateY(-3px) scale(1);
    opacity: 0.95;
  }
}

/* --- LUZ: Destellos estelares GRANDES --- */
.light-sparkles {
  filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8));
}
.sparkle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 30% 30%, #ffff99, #ffd700, #ffb700);
  border-radius: 50%;
  animation: sparkle-pulse 1.2s ease-in-out infinite;
  box-shadow:
    0 0 20px #ffeb3b,
    0 0 35px #ffc107,
    0 0 50px #ff9800;
  filter: drop-shadow(0 0 8px #ffea00);
}
.sparkle:nth-child(1) {
  top: 5%;
  left: 8%;
  animation-delay: 0s;
}
.sparkle:nth-child(2) {
  top: 12%;
  right: 10%;
  animation-delay: 0.2s;
}
.sparkle:nth-child(3) {
  top: 22%;
  left: 6%;
  animation-delay: 0.4s;
}
.sparkle:nth-child(4) {
  top: 32%;
  right: 8%;
  animation-delay: 0.6s;
}
.sparkle:nth-child(5) {
  top: 48%;
  left: 4%;
  animation-delay: 0.8s;
}
.sparkle:nth-child(6) {
  top: 58%;
  right: 6%;
  animation-delay: 0.1s;
}
.sparkle:nth-child(7) {
  top: 68%;
  left: 5%;
  animation-delay: 0.3s;
}
.sparkle:nth-child(8) {
  top: 78%;
  right: 7%;
  animation-delay: 0.5s;
}
.sparkle:nth-child(9) {
  top: 10%;
  left: 12%;
  animation-delay: 0.7s;
}
.sparkle:nth-child(10) {
  top: 40%;
  right: 12%;
  animation-delay: 0.2s;
}
.sparkle:nth-child(11) {
  top: 65%;
  left: 8%;
  animation-delay: 0.4s;
}
.sparkle:nth-child(12) {
  top: 85%;
  right: 9%;
  animation-delay: 0.6s;
}
@keyframes sparkle-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.6);
    filter: brightness(0.7) drop-shadow(0 0 5px rgba(255, 215, 0, 0.6));
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
    filter: brightness(1.5) drop-shadow(0 0 25px rgba(255, 215, 0, 1));
  }
}

/* --- FUEGO: Llamas decorativas EXAGERADAS --- */
.fire-flames {
  filter: drop-shadow(0 0 20px rgba(255, 100, 0, 0.8));
}
.flame-decoration {
  position: absolute;
  width: 60px;
  height: 90px;
  background: linear-gradient(
    to top,
    rgba(255, 100, 0, 0.8),
    rgba(255, 200, 0, 0.5),
    rgba(255, 255, 0, 0.3)
  );
  clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 80% 100%, 50% 85%, 20% 100%, 0% 50%);
  animation: flame-flicker 0.6s ease-in-out infinite;
  opacity: 0.85;
  box-shadow:
    0 0 25px rgba(255, 100, 0, 1),
    0 0 40px rgba(255, 150, 0, 0.6);
}
.flame-decoration:nth-child(1) {
  top: 10%;
  left: 4%;
  animation-delay: 0s;
}
.flame-decoration:nth-child(2) {
  top: 40%;
  right: 3%;
  animation-delay: 0.15s;
}
.flame-decoration:nth-child(3) {
  top: 65%;
  left: 3%;
  animation-delay: 0.3s;
}
.flame-decoration:nth-child(4) {
  top: 30%;
  right: 4%;
  animation-delay: 0.08s;
}
@keyframes flame-flicker {
  0%,
  100% {
    transform: scaleY(1) scaleX(0.9);
    opacity: 0.8;
    filter: brightness(1);
  }
  25% {
    transform: scaleY(1.15) scaleX(1);
    opacity: 0.95;
    filter: brightness(1.2);
  }
  50% {
    transform: scaleY(0.95) scaleX(1.05);
    opacity: 0.85;
    filter: brightness(1.1);
  }
  75% {
    transform: scaleY(1.2) scaleX(0.95);
    opacity: 0.9;
    filter: brightness(1.15);
  }
}

/* --- OSCURIDAD: Sombras místicas GRANDES --- */
.dark-mist {
  filter: drop-shadow(0 0 25px rgba(100, 50, 200, 0.7));
}
.mist-decoration {
  position: absolute;
  width: 160px;
  height: 160px;
  background: radial-gradient(
    ellipse at 40% 40%,
    rgba(100, 50, 200, 0.35),
    rgba(150, 100, 200, 0.1),
    transparent
  );
  border-radius: 50%;
  animation: mist-drift 7s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(100, 50, 200, 0.5);
}
.mist-decoration:nth-child(1) {
  top: 8%;
  left: 5%;
  animation-delay: 0s;
}
.mist-decoration:nth-child(2) {
  top: 15%;
  right: 8%;
  animation-delay: 1.5s;
}
.mist-decoration:nth-child(3) {
  top: 48%;
  left: 2%;
  animation-delay: 2.5s;
}
.mist-decoration:nth-child(4) {
  top: 58%;
  right: 5%;
  animation-delay: 4s;
}
.mist-decoration:nth-child(5) {
  top: 72%;
  left: 6%;
  animation-delay: 1s;
}
.mist-decoration:nth-child(6) {
  top: 35%;
  right: 3%;
  animation-delay: 3.5s;
}
@keyframes mist-drift {
  0%,
  100% {
    transform: translateX(0) scale(0.95);
    opacity: 0.4;
  }
  50% {
    transform: translateX(20px) scale(1.1);
    opacity: 0.7;
  }
}

/* --- HIELO: Cristales de hielo GRANDES --- */
.ice-crystals {
  filter: drop-shadow(0 0 25px rgba(100, 200, 255, 0.8));
}
.ice-crystal {
  position: absolute;
  width: 45px;
  height: 45px;
  background: linear-gradient(
    135deg,
    rgba(150, 220, 255, 0.8),
    rgba(100, 200, 255, 0.5),
    rgba(180, 230, 255, 0.3)
  );
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 50% 85%, 18% 100%, 0% 38%);
  animation: crystal-shimmer 1.8s ease-in-out infinite;
  opacity: 0.85;
  box-shadow:
    0 0 20px rgba(100, 200, 255, 1),
    0 0 35px rgba(150, 220, 255, 0.6);
}
.ice-crystal:nth-child(1) {
  top: 10%;
  left: 4%;
  animation-delay: 0s;
}
.ice-crystal:nth-child(2) {
  top: 20%;
  right: 6%;
  animation-delay: 0.25s;
}
.ice-crystal:nth-child(3) {
  top: 38%;
  left: 3%;
  animation-delay: 0.5s;
}
.ice-crystal:nth-child(4) {
  top: 52%;
  right: 4%;
  animation-delay: 0.75s;
}
.ice-crystal:nth-child(5) {
  top: 68%;
  left: 5%;
  animation-delay: 1s;
}
.ice-crystal:nth-child(6) {
  top: 80%;
  right: 5%;
  animation-delay: 0.15s;
}
.ice-crystal:nth-child(7) {
  top: 28%;
  left: 2%;
  animation-delay: 0.4s;
}
.ice-crystal:nth-child(8) {
  top: 62%;
  right: 3%;
  animation-delay: 0.6s;
}
@keyframes crystal-shimmer {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(0.85) rotateZ(0deg);
    filter: brightness(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.15) rotateZ(5deg);
    filter: brightness(1.4);
  }
}

/* --- MAGE INFO & POWER-UPS --- */
.mage-info {
  text-align: center;
}
.mage-title {
  margin: 0 0 15px 0;
  font-size: 3rem;
  font-weight: 300;
  letter-spacing: 0.02em;
  font-family: 'Cinzel', serif;
}
.mage-description {
  margin: 0;
  font-size: 1.1rem;
  font-style: italic;
}

.paraula.powerup-word {
  color: #000000;
  font-weight: bold;
  border-radius: 4px;
  opacity: 1 !important;
  animation: pulse-powerup 1s infinite alternate;
}

@keyframes pulse-powerup {
  from {
    transform: scale(1);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  }
  to {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 193, 7, 0.8);
  }
}

/* --- DEBUFFS --- */
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

/* CASTER ANIMATION */
#game-engine.casting-fire-spell .book-container::before {
  animation: burning-edge 1s ease-in-out infinite, intense-glow 1s ease-in-out infinite;
}

#game-engine.casting-ice-spell .book-container {
  animation: ice-pulse 1s ease-in-out infinite;
}

#game-engine.casting-light-spell .book-container {
  box-shadow:
    0 0 120px rgba(255, 215, 0, 1),
    0 0 180px rgba(255, 200, 50, 0.8),
    0 0 240px rgba(255, 180, 0, 0.6);
}

#game-engine.casting-dark-spell .book-container {
  animation: shadow-pulse 1.3s ease-in-out infinite;
}

#game-engine.casting-jungle-spell .book-container {
  box-shadow:
    0 0 100px rgba(124, 179, 66, 0.8),
    0 0 150px rgba(156, 204, 101, 0.6);
}

#game-engine.casting-water-spell .water-effects .wave {
  animation-duration: 4s;
}

@keyframes intense-glow {
  0%,
  100% {
    filter: brightness(1.5) blur(30px);
    opacity: 0.8;
  }
  50% {
    filter: brightness(2.5) blur(40px);
    opacity: 1;
  }
}

@keyframes shadow-pulse {
  0%,
  100% {
    box-shadow:
      0 0 70px rgba(100, 50, 200, 0.6),
      0 0 110px rgba(150, 100, 200, 0.4);
  }
  50% {
    box-shadow:
      0 0 90px rgba(100, 50, 200, 0.9),
      0 0 140px rgba(150, 100, 200, 0.7);
  }
}

/*animacions powerup */
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

/* --- SPECTATOR --- */
.spectator-name {
  color: #ffffff;
  font-size: 1.3rem;
  margin-bottom: 15px;
  text-align: center;
  width: 100%;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.spectator-name strong {
  color: #ffc107;
}

/* --- Flechas estilo “play” circulares --- */
.spectator-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background:
    radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(210,210,240,0.9) 60%, rgba(80,70,140,0.9)),
    linear-gradient(145deg, rgba(255,255,255,0.7), rgba(120,110,180,0.2));
  box-shadow:
    inset 0 2px 6px rgba(255,255,255,0.8),
    inset 0 -4px 10px rgba(80,70,140,0.35),
    0 6px 16px rgba(0,0,0,0.35),
    0 0 18px rgba(150,100,255,0.5);
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
}
.spectator-nav::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-45%, -50%);
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 16px solid #2f2a63; /* triángulo “play” */
  filter: drop-shadow(0 0 4px rgba(50,40,110,0.5));
}
.spectator-nav.prev {
  left: -22px;
}
.spectator-nav.prev::after {
  transform: translate(-55%, -50%) scaleX(-1); /* flecha a la izquierda */
}
.spectator-nav.next {
  right: -22px;
}
.spectator-nav:hover {
  transform: translateY(-50%) scale(1.06);
  box-shadow:
    inset 0 3px 8px rgba(255,255,255,0.9),
    inset 0 -5px 12px rgba(80,70,140,0.45),
    0 10px 22px rgba(0,0,0,0.45),
    0 0 28px rgba(170,120,255,0.7);
  filter: brightness(1.03);
}
</style>
