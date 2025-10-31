<template>
    <p>Benvingut {{ jugadorClient.name }} en aquesta partida tens el rol de {{ jugadorClient.rol }}</p>
<!-- Llista pel admin-->
	<div>
		<playerList :socket-c="socket" :llista-jug="llistaJugadors" :is-admin="isAdmin"/>
		<!--Botons-->
		<button v-if="isAdmin" v-bind:class="isMajority ? '' : 'disabled'" @click="startGame">
			Començar
		</button>
		<button v-bind:class="imReady ? 'ready' : 'notReady'" @click="isReady(jugadorClient.id)">
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
const imReady = ref(false)
const isMajority = ref(llistaJugadors.filter(player => player.state === 'ready').length >= Math.round(llistaJugadors.length/2))
const isAdmin = ref((jugadorClient.rol === 'admin'));

//sockets


//funcions
  function startGame(){
    socket.emit('IniciarJoc')
  }

  function isReady(id){
    socket.emit('setPreparat', id)
    
  }

</script>

<style scoped></style>