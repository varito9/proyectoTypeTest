<template>
  <div class="ranking-container">
    <!-- 2. Contenidor de partícules màgiques -->
    <div class="particles">
      <span
        v-for="(p, i) in particles"
        :key="i"
        class="particle"
        :style="{
          left: `${p.left}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.color,
          boxShadow: `0 0 8px ${p.color}aa`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }"
      ></span>
    </div>
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
        <tr v-for="(player, index) in llistatJugadors" :key="player.id">
          <td class="rank-cell">
            <span>{{ getRankContent(index) }}</span>
          </td>
          <td class="rank-cell">{{ player.name }}</td>
          <td>{{ player.errors }}</td>
          <td>{{ player.points }}</td>
        </tr>
      </tbody>
    </table>
  </div>
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
        return a.errors - b.errors
      })
  )
})

const getRankContent = (index) => {
  const pos = index + 1
  if (pos === 1) return '1'
  if (pos === 2) return '2'
  if (pos === 3) return '3'
  if (pos === 4) return '4'
  if (pos === 5) return '5'
  if (pos === 6) return '6'

  return pos
}

const particleCount = 40
const colors = ['#00f2ff', '#ffd700', '#c0c0c0', '#f0f0f0'] //

const particles = Array.from({ length: particleCount }).map(() => ({
  duration: Math.random() * 8 + 5,

  delay: Math.random() * 7,
  left: Math.random() * 100,
  size: Math.random() * 2 + 1,
  color: colors[Math.floor(Math.random() * colors.length)],
}))
</script>

<style>
.ranking-container {
  border-radius: 2rem;
  position: relative;
  overflow: hidden; /* Molt important: retalla les partícules que surten */
  width: 100%;
  margin: 2rem auto;
  background: #ffffff; /* Un fons fosc per sota de la taula */

  /* --- ✨ NOU ESTIL DE VORA LLUMINOSA --- */

  /* Definim el color de la brillantor */
  --glow-color: #671dc7;

  /* Vora física subtil del mateix color */
  border: 1px solid rgba(0, 242, 255, 0.5);

  /* Apilem múltiples ombres per crear l'efecte de "resplendor màgica".
    Comença des de la més propera/intensa fins a la més llunyana/difusa.
  */
  box-shadow:
    /* 1. Resplendor interior subtil */
    inset 0 0 10px rgba(7, 107, 238, 0.3),
    0 0 15px var(--glow-color),
    0 0 30px var(--glow-color),
    0 0 50px rgba(10, 96, 255, 0.5);
}
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Darrere de la taula */
  pointer-events: none; /* No interfereix amb el ratolí */
}
.particle {
  position: absolute;
  bottom: -10px; /* Comença just a sota */
  border-radius: 50%;
  opacity: 0;

  /* Aquest és el nom de l'animació */
  animation-name: float-up;
  animation-timing-function: linear;
  animation-iteration-count: infinite;

  /* La durada i el retard s'apliquen via :style des de JS */
}

@keyframes float-up {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  10%,
  90% {
    /* Apareix i es manté visible la major part del temps */
    opacity: 0.9;
  }
  100% {
    /* Puja 100% de l'alçada de la pantalla i desapareix */
    transform: translateY(-100vh);
    opacity: 0;
  }
}

table {
  width: 100%;
  margin: 0;
  box-shadow: none;

  position: relative;
  z-index: 2;

  background-color: rgb(23, 3, 39);
  color: #f0f0f0;
  border-collapse: collapse;
  border-radius: 2rem;
}

thead tr {
  background-color: rgb(23, 3, 39);
  border-bottom: 1px solid #ffffff;
}
tbody tr:last-child {
  border-bottom: none;
}

th {
  padding: 1rem 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #ffffffea;
  text-align: left;
}

td {
  padding: 1rem 1.5rem;
  transition: background-color 0.3s ease;
}

tbody tr {
  border-bottom: 1px solid rgba(213, 192, 218, 0.2);
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
