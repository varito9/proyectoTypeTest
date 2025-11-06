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
            <tr v-for="player in llistatJugadors" :key="player.id" v-if="!isSpectator">
                <td> {{ player.name }}</td>
                <td> {{ player.errors }}</td>
                <td> {{ player.points }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script setup>
import { computed} from 'vue';

const props = defineProps(['llistaJug']);

const llistatJugadors = computed(() => {
    if (!props.llistaJug) return [];
    //filtrem la llista de jugadors per eliminar de la llista es que son espectadors
    return props.llistaJug.filter(player => player.role !== 'spectator');
});



</script>