<template>
    <ul v-if="adminRol">
        <li v-for="player in llistaJugadors" :key="player.id">
            <button v-if="player.id > 0" @click="setAdmin(player.id)">
                <!--Logo estrella buit-->
            </button>
            {{ player.name }}
            <button v-if="player.id > 0" @click="deletePlayer(player.id)">
                <!--Logo creu-->
            </button>
            <div class="estat" v-bind:class="player.preparat === true ? 'ready' : 'notReady'"></div>
        </li>
    </ul>
		<!-- Llista per jugador / espectador -->
    <ul v-else>
        <li v-for="player in llistaJugadors" :key="player.id">
            {{ player.name }}
            <div class="estat" v-bind:class="player.preparat === true ? 'ready' : 'notReady'"></div>
        </li>
    </ul>
</template>
<script setup>
const props = defineProps(['socketC', 'llistaJug', 'isAdmin', 'jugador'])

//Variables
const adminRol = props.isAdmin;
const llistaJugadors = props.llistaJug || [];
const socket = props.socketC;
const jugadorClient = props.jugador || {};

//Functions
function setAdmin(id){
  if (socket && props.isAdmin && jugadorClient?.id) {
    socket.emit('transferirAdmin', { adminId: jugadorClient.id, idNuevoAdmin: id });
  }
}

function deletePlayer(id){
  if (socket && props.isAdmin && jugadorClient?.id) {
    socket.emit('expulsarJugador', { adminId: jugadorClient.id, idJugador: id });
  }
}
</script>