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
defineProps(['llistaJug']);

const llistatJugadors = this.props.llistaJug;

</script>