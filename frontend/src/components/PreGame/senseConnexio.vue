<template>
    <input type="text" v-model="jugador" placeholder="Introdueix nom"/>
    <button @click="sendNickname(jugador)">Entra</button>
    <p>Type Racer Royale</p>
</template>

<script setup>
//imports
    import { io } from 'socket.io-client';
    import { ref } from 'vue';

//variables
    var socket = null
    const jugador = ref('');
    //const notValid = ref(0) //0: No inicialitzat, 1: No valid, 2: Valid
    //const notValidMessage = ref('')
    
//functions
    function tryConn(){
        socket= io('backend/server.js');
    }

    function sendNickname(nickname) {
        tryConn();
        socket.emit("SendNickname", nickname);
    }
</script>

