<template>
  <table>
    <thead>
      <tr>
        <th>Posició</th>
        <th>Jugadors</th>
        <th>Errors</th>
        <th>Encerts</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(player, index) in llistatJugadors"
        :key="player.id"
        :class="getPodiumClass(index)"
      >
        <td class="rank-cell">
          <span>{{ getRankContent(index) }}</span>
        </td>
        <td>{{ player.name }}</td>
        <td>{{ player.errors }}</td>
        <td>{{ player.points }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
/* ranking*/
import { computed } from 'vue'

const props = defineProps(['llistaJug'])

const llistatJugadors = computed(() => {
  if (!props.llistaJug) return []

  return (
    props.llistaJug
      // Filtrem espectadors
      .filter((player) => player.role !== 'spectator')
      // Ordenem per punts (més és millor)
      .sort((a, b) => {
        if (a.points !== b.points) {
          return b.points - a.points
        }
        // Si empaten a punts, ordenem per errors (menys és millor)
        return a.errors - b.errors
      })
  )
})
const getPodiumClass = (index) => {
  if (index === 0) return 'podium-first'
  if (index === 1) return 'podium-second'
  if (index === 2) return 'podium-third'
  return 'podium-other' // Per a la resta
}

const getRankContent = (index) => {
  const pos = index + 1
  if (pos === 1) return '1' // Or
  if (pos === 2) return '2' // Plata
  if (pos === 3) return '3' // Bronze
  if (pos === 4) return '4' // Bronze
  if (pos === 5) return '5' // Bronze
  if (pos === 6) return '6' // Bronze

  return pos // 4, 5, 6...
}
</script>

<style>
/* Per a una sensació més màgica, pots importar una font de Google Fonts
   com 'Cinzel' o 'MedievalSharp' afegint al teu CSS:
   @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
   i després canviar el font-family a 'Cinzel', serif;
*/

table {
  background: rgba(14, 10, 25, 0.8);
  color: #f0f0f0;
  width: 90%;
  margin: 2rem auto;
  border-collapse: collapse;
  border-radius: 2rem;
  box-shadow: 0 0 30px rgba(3, 3, 3, 0.7);
}

thead tr {
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 3px solid #ffffff;
}
tbody tr:last-child {
  border-bottom: none;
}

th {
  padding: 1rem 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #ffffffea;
  text-shadow: 0 0 8px #ffffff;
  text-align: left;
}

td {
  padding: 1rem 1.5rem;
  transition: background-color 0.3s ease;
}

tbody tr {
  border-bottom: 1px solid rgba(212, 0, 255, 0.2);
  transition: all 0.2s ease-in-out;
}

tbody tr:hover {
  transform: scale(1.02);
  position: relative;
}

/* --- 6. NOUS ESTILS PER A LA POSICIÓ I EL PODI --- */

/* Cel·la de posició (números/emojis) */
.rank-cell {
  font-size: 1.3em;
  font-weight: bold;
  vertical-align: middle;
  text-align: center;
  width: 100px; /* Amplada fixa per a la columna de posició */
}

/* 🥇 OR (Primer lloc) */
.podium-first {
  /* Vora daurada brillant */
  border: none;
  /* Resplendor daurada + fons subtil */
  box-shadow:
    0 0 15px #ffd700,
    inset 0 0 10px rgba(255, 215, 0, 0.3);
  background-color: rgba(255, 215, 0, 0.05);
}

/* 🥈 PLATA (Segon lloc) */
.podium-second {
  /* Vora platejada brillant */
  /* Resplendor platejada + fons subtil */
  box-shadow:
    0 0 12px #c0c0c0,
    inset 0 0 10px rgba(192, 192, 192, 0.3);
  background-color: rgba(192, 192, 192, 0.05);
}

/* 🥉 BRONZE (Tercer lloc) */
.podium-third {
  /* Vora de bronze brillant */
  /* Resplendor bronze + fons subtil */
  box-shadow:
    0 0 10px #cd7f32,
    inset 0 0 10px rgba(205, 127, 50, 0.3);
  background-color: rgba(205, 127, 50, 0.05);
}

/* --- 7. AJUSTAR 'NTH-CHILD' PERQUÈ COINCIDEIXIN AMB LES NOVES COLUMNES --- */

/* Posició: 1r fill (ja centrat a .rank-cell) */
th:first-child {
  text-align: center;
}

/* Errors: Ara és el 3r fill */
th:nth-child(3),
td:nth-child(3) {
  text-align: center;
}

/* Encerts: Ara és el 4t fill */
th:nth-child(4),
td:nth-child(4) {
  text-align: center;
}

/* Errors (Color): 3r fill */
td:nth-child(3) {
  font-weight: bold;
  color: #ff4d4d;
  text-shadow: 0 0 8px rgba(255, 77, 77, 0.5);
}

/* Encerts (Color): 4t fill */
td:nth-child(4) {
  font-weight: bold;
  font-size: 1.1em;
  color: #00f2ff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.7);
}
</style>
