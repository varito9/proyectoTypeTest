<template>
  <!-- vista de lobby -->
  <div v-if="vista === 'preGame'">
    <!-- Un cop entres i no tens nom : Nickname-->
    <div v-if="!isConnected">
      <input type="text" v-model="jugador.name" placeholder="Introdueix nom" />
      <button @click="sendNickname(jugador.name)">Entra</button>
      <p>Type Racer Royale</p>
    </div>
    <!-- Un cop introdueixes el nickname: Lobby-->
    <div v-else>
      <viewLobby :socket-c="socket" :llista-jug="jugadors" :jug="jugador" />
    </div>
  </div>

  <!-- vista de joc -->
  <div v-else-if="vista === 'game'">
    <div id="jugador" v-if="!isSpectator">
      <!-- Div on mostrem la informació de la partida (els textos)-->
      <div id="partida">
        <!--Truquem al game Engine i enviem les props que rebrà aquest component-->
        <GameEngine :socket="socket" :jugador="jugador" :es-espectador="isSpectator" />
      </div>
      <!--Div on mostrem el temps restant de la partida-->
      <div id="tempsRestant">
        <TempsRestant />
      </div>
      <!--Div on llistem els usuaris de la partida i els accerts i errors d'aquests-->
      <div id="ranquing">
        <RankingComponent :llista-jug="jugadors" />
      </div>
    </div>
  </div>

  <!-- vista de endgame-->
  <div v-else-if="vista === 'endGame'">
    <RankingComponent :llista-jug="jugadors" />
  </div>
</template>

<script setup>
//imports && exports
import { ref } from 'vue'
import { io } from 'socket.io-client'
import RankingComponent from './components/RankingComponent.vue'
import viewLobby from './components/PreGame/lobby/viewLobby.vue'
import GameEngine from './components/Game/GameEngine.vue'
import TempsRestant from './components/Game/TempsRestant.vue'

//variables
var socket = null

const vista = ref('preGame') //preGame, game, endGame
const isConnected = ref(false) //Depèn de si connecta o no
const jugador = ref({ name: '', id: null, estat: '', rol: '' }) //rol: 'ready' | 'notReady'
const jugadors = ref([])
const tempsRestant = ref(-1)
const isSpectator = ref(jugador.value.estat === 'espectador')

//sockets

function tryConn() {
  if (socket !== null && socket.connected) return // Ja està connectat
  
  socket = io('http://localhost:3001')

  socket.on('connect', () => {
    console.log('Socket connectat')
  })

  socket.on('setPlayerList', (playerList) => {
    // El backend envia l'array directament: io.emit("setPlayerList", jugadors)
    jugadors.value = Array.isArray(playerList) ? playerList : []
    
    // Trobar el jugador actual per id
    if (jugador.value.id !== null) {
      const jugadorActual = jugadors.value.find(j => j.id === jugador.value.id)
      if (jugadorActual) {
        jugador.value = jugadorActual
      }
    } else {
      // Si no tenim id, agafar l'últim jugador (el que s'acaba d'afegir)
      if (jugadors.value.length > 0) {
        jugador.value = jugadors.value[jugadors.value.length - 1]
      }
    }
    
    // Actualitzar isConnected quan rebem la llista de jugadors i tenim un jugador amb id
    if (!isConnected.value && jugador.value.id !== null && jugador.value.name !== '') {
      isConnected.value = true
    }
  })

  socket.on('JocIniciat', (data) => {
    vista.value = 'game'
    if (data.temps) {
      iniciarComptador(data.temps)
    }
  })
}

function sendNickname(nickname) {
  if (!nickname || nickname.trim() === '') return
  
  // Generar un ID únic per al jugador abans de connectar
  const playerId = jugador.value.id || Date.now()
  jugador.value.id = playerId
  jugador.value.name = nickname.trim()
  
  tryConn()
  
  // Esperar a que el socket estigui connectat abans d'enviar
  if (socket && socket.connected) {
    // El backend espera 'setPlayerName' amb { name, id }
    socket.emit('setPlayerName', { name: nickname.trim(), id: playerId })
  } else {
    // Si no està connectat, esperar a la connexió
    socket.on('connect', () => {
      socket.emit('setPlayerName', { name: nickname.trim(), id: playerId })
    })
  }
}

function iniciarComptador(tempsInici) {
  tempsRestant.value = tempsInici

  function timerInstance() {
    setInterval(() => {
      if (tempsRestant.value > 0) {
        tempsRestant.value--
      } else {
        acabarPartida()
      }
    }, 1000)
  }

  function acabarPartida() {
    if (socket !== null) {
      clearInterval(timerInstance)
      socket.emit('partidaAcabada')
      vista.value = 'endGame'
    }
  }
  timerInstance()
}
</script>

<style scoped>
.estat {
  max-width: 60%;
  width: 30px;
  height: auto;
}
.ready {
  background-color: greenyellow;
}

.notReady {
  background-color: red;
}
</style>
