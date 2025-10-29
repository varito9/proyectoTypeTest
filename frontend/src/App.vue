<template>
  <router-view />
  <!-- vista de lobby -->
  <div v-if="vista === 'preGame'">
    <!-- Un cop entres i no tens nom : Nickname-->
    <div v-if="!isConnected">
      <senseConnexio />
    </div>
    <!-- Un cop introdueixes el nickname: Lobby-->
    <div v-else>
      <viewLobby :socket-c="socket" :llista-jug="jugadors" :jug="jugador"/>
    </div>
  </div>

  <!-- vista de joc -->
   <div v-else-if="vista === 'game'">

   </div>

  <!-- vista de endgame-->
   <div v-else-if="vista === 'endGame'">

   </div>

</template>

<script>
  
</script>

<script setup>
//imports && exports
  import { ref } from 'vue';
  import senseConnexio from './components/PreGame/senseConnexio.vue';
  import viewLobby from './components/PreGame/lobby/viewLobby.vue';

  //import GameEngine from './components/Game/GameEngine.vue';

//variables
  var socket = senseConnexio.socket;

  const vista = ref('preGame'); //preGame, game, endGame
  const isConnected = ref((socket !== null)); //Depèn de si connecta o no
  const isMajority = ref(jugadors.value.filter(player => player.state === 'ready').length >= Math.round(jugadors.value.length/2))
  const imReady = ref(false)
  const isAdmin = ref((jugador.value.rol === 'admin'))
  const jugador = ref({name: '', rol: '', state: 'notReady'}) //rol: 'ready' | 'notReady'
  const jugadors = ref([]);

//sockets

socket.on('setPlayerList', (data) => {
	jugadors.value = data.playerList;
	jugador.value = data.playerList[data.playerList.length - 1];
})

</script>

<style scoped>
  .estat{
    max-width: 60%;
    width: 30px;
    height: auto;
  }
  .ready{
    background-color: greenyellow;
  }

  .notReady{
    background-color: red;
  }
</style>
