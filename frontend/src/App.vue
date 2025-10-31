<template>
  <!-- vista de lobby -->
  <div v-if="vista === 'preGame'">
    <!-- Un cop entres i no tens nom : Nickname-->
    <div v-if="!isConnected">
      <input type="text" v-model="jugador" placeholder="Introdueix nom" />
      <button @click="sendNickname(jugador)">Entra</button>
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
const isConnected = ref(socket !== null) //Depèn de si connecta o no
const jugador = ref({ name: 'name', estat: '' }) //rol: 'ready' | 'notReady'
const jugadors = ref([])
const tempsRestant = ref(-1)
const isSpectator = ref(jugador.value.estat === 'espectador')

//sockets

function tryConn() {
  socket = io('http://localhost:3001')

  socket.on('setPlayerList', (data) => {
    jugadors.value = data.playerList
    if (jugador.value == { name: 'name' }) {
      jugador.value = data.playerList[data.playerList.length - 1]
    }
  })

  socket.on('gameStart', (temps) => {
    vista.value = 'game'
    iniciarComptador(temps)
  })
}

function sendNickname(nickname) {
  tryConn()
  socket.emit('SendNickname', nickname)
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
    clearInterval(timerInstance)
    socket.emit('partidaAcabada')
    vista.value = 'endGame'
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
