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
    <div id="jugador">
      <!-- Div on mostrem la informació de la partida (els textos)-->
      <div id="partida">
        <!--Truquem al game Engine i enviem les props que rebrà aquest component-->
        <GameEngine :socket="socket" :jugador="jugador" :llista-jug="jugadors" />
      </div>
      <!--Div on mostrem el temps restant de la partida-->
      <div id="tempsRestant">
        <TempsRestant :temps-inicial="tempsInicial" :socket="socket" />
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
const jugador = ref({ name: '', id: null, status: '', role: '' }) //rol: 'ready' | 'notReady'
const jugadors = ref([])
const tempsInicial = ref(0)

//sockets

function tryConn() {
  if (socket !== null && socket.connected) return // Ja està connectat

  socket = io('http://localhost:3001')

  socket.on('connect', () => {
    console.log('Socket connectat')
  })

  socket.on('setPlayerList', (playerList) => {
    // Forzar reactividad al crear un nuevo array
    jugadors.value = Array.isArray(playerList) ? [...playerList] : []

    // Actualizar jugador actual sin romper la referencia reactiva
    const actualitzat = jugadors.value.find((j) => j.id === jugador.value.id)
    if (actualitzat) {
      Object.assign(jugador.value, actualitzat)
    } else if (!jugador.value.id && jugadors.value.length > 0) {
      Object.assign(jugador.value, jugadors.value[jugadors.value.length - 1])
    }

    // Actualizar estado de conexión
    if (!isConnected.value && jugador.value.id && jugador.value.name) {
      isConnected.value = true
    }
  })

  //Rebem l'informació que ens envia el server.js de la llista dels jugadors
  socket.on('updateRanking', (novaLlistaJugadors) => {
    console.log('Rànquing actualitzat rebut!')
    jugadors.value = [...novaLlistaJugadors]
  })

  socket.on('gameStarted', (data) => {
    vista.value = 'game'
    if (data.time) {
      tempsInicial.value = data.time
    }
  })

  socket.on('gameFinished', (data) => {
    vista.value = 'endGame'
    // Actualizar la lista de jugadores con el ranking final si es necesario
    if (data.ranking) {
      jugadors.value = data.ranking
    }
  })

  //expulsar al jugador i notificar-lo
  socket.on('kicked', () => {
    alert("Expulsat per l'admin")
    socket.disconnect()
    window.location.href = '/'
  })
  //Transferim l'admin
  socket.on('youAreNowAdmin', () => {
    jugador.value.role = 'admin'
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
