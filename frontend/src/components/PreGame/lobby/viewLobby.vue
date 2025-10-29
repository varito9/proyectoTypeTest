<template>
    <p>Benvingut {{ jugadorClient.name }} en aquesta partida tens el rol de {{ jugadorClient.rol }} <!--El rol--></p>
<!-- Llista pel admin-->
	<div>
		<playerList :socket-c="socket" :llista-jug="llistaJugadors" :is-admin="isAdmin"/>
		<!--Botons-->
		<button v-if="isAdmin" v-bind:class="isMajority ? '' : 'disabled'" @click="startGame">
			Començar
		</button>
		<button v-bind:class="imReady ? 'ready' : 'notReady'" @click="isReady(jugador.value.id)">
			Preparat
		</button>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import playerList from './playerList.vue';

//props
defineProps(['socketC', 'llistaJug', 'jug'])
const socket = this.props.socketC;
const llistaJugadors = this.props.llistaJug;
const jugadorClient = this.props.jug;

//sockets


//funcions
function setAdmin(id){
    /*socket intenta canviar rol admin actiu per jugador i jugador especific per admin
    i sobreescriu al servidor intercanviant l'id d'ambdos jugadors*/
    console.log(id)
  }

  function deletePlayer(id){
    /*socket intenta eliminar jugador forçant-li desconnection i s'actualitza la llista de
    jugadors al servidor*/
    console.log(id)
  }

  function startGame(){
    /*compte enrrere de 5 segons, si es compleix sense interrupcions, envia comença el joc */
  }

  function isReady(id){
	console.log(id)
  }

const llistatJugadors = ref('')
</script>

<style scoped></style>