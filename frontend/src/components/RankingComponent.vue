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
const props = defineProps(['llistaJug']);

const llistatJugadors = props.llistaJug || [];

</script>