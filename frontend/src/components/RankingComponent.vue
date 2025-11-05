<template>
    <table>
        <thead>
            <tr>
                <th> Jugadors </th>
                <th> Errors </th>
                <th> Encerts </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="player in llistatJugadors" :key="player.id">
                <td> {{ player.name }}</td>
                <td> {{ player.errors }}</td>
                <td> {{ player.correct }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps(['llistaJug', 'socketC']);

const llistatJugadors = ref(props.llistaJug || []);
const socket = computed(() => props.socketC)

//Funció per actualitzar el ranking (nova llista)
const handleRankingUpdate = (novaLlista) => {
    llistatJugadors.value = novaLlista;
};

//Quan es carrega aquest component es fica a escoltar el updateRankig
onMounted(() => {
    if (socket.value) {
        socket.value.on('updateRanking', (data) => {
            handleRankingUpdate(data);
        });
    }
});

//Quan es decarrega el component treiem l'escolta al socket
onUnmounted(() => {
    if (socket.value) {
        socket.value.off('updateRanking', (data) => {
            handleRankingUpdate(data);
        });
    }
});


</script>