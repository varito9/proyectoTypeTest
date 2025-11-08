<template>
  <table>
    <thead>
      <tr>
        <th>Jugadors</th>
        <th>Errors</th>
        <th>Encerts</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="player in llistatJugadors" :key="player.id">
        <td v-if="player.role !== 'spectator'">
          {{ player.name }}
        </td>
        <td v-if="player.role !== 'spectator'">{{ player.errors }}</td>
        <td v-if="player.role !== 'spectator'">{{ player.points }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['llistaJug'])

const llistatJugadors = computed(() => props.llistaJug || [])
</script>
