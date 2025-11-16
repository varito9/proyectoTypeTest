<template>
  <div class="container">
    <!-- Fondo animado -->
    <div class="background"></div>
    <div class="stars-background">
      <div v-for="i in 100" :key="i" class="star" :style="{ left: Math.random() * 100 + '%', top: Math.random() * 100 + '%', animationDelay: Math.random() * 2 + 's' }"></div>
    </div>

    <!-- Efecto de luz mágica -->
    <div class="magic-glow"></div>

    <!-- Libro 3D simple y limpio -->
    <div class="book-container" :class="{ opening: isOpen, zooming: isZoomed }">
      <!-- Partículas -->
      <div class="magic-particles">
        <div v-for="i in 15" :key="`particle-${i}`" class="particle" :style="{ '--i': i }"></div>
      </div>

      <!-- Libro -->
      <div class="book">
        <!-- Portada -->
        <div class="book-cover front">
          <div class="cover-content">
            <h1>El Gran Grimori</h1>
            <p>MagicTypeRoyale</p>
          </div>
        </div>

        <!-- Contraportada -->
        <div class="book-cover back">
          <div class="cover-content">
            <p>Desafia la teva màgia</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Destello final -->
    <div class="flash-effect" :class="{ active: isZoomed }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits, defineProps } from 'vue'

const props = defineProps({
  nextView: {
    type: String,
    required: true,
  },
})

const isOpen = ref(false)
const isZoomed = ref(false)
const emit = defineEmits(['animation-finished'])

onMounted(() => {
  setTimeout(() => {
    isOpen.value = true
    setTimeout(() => {
      isZoomed.value = true
      setTimeout(() => {
        emit('animation-finished', props.nextView)
      }, 800)
    }, 600)
  }, 300)
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* ==================== FONDO ==================== */
.background {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #141021 0%, #1c1535 38%, #0057ff 100%);
  z-index: 1;
  animation: bgShift 8s ease-in-out infinite;
}

@keyframes bgShift {
  0%, 100% {
    background: linear-gradient(180deg, #141021 0%, #1c1535 38%, #0057ff 100%);
  }
  50% {
    background: linear-gradient(180deg, #1c1535 0%, #2d2550 38%, #0066ff 100%);
  }
}

/* ==================== ESTRELLAS ==================== */
.stars-background {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: twinkle 3s infinite;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* ==================== GLOW ==================== */
.magic-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(123, 44, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 3;
  animation: glow 4s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.8;
  }
}

/* ==================== CONTENEDOR DEL LIBRO ==================== */
.book-container {
  position: relative;
  width: 350px;
  height: 450px;
  z-index: 10;
  perspective: 1500px;
  transform-style: preserve-3d;
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 0 40px rgba(123, 44, 255, 0.5));
}

.book-container.opening {
  filter: drop-shadow(0 0 60px rgba(123, 44, 255, 0.7));
}

.book-container.zooming {
  transform: scale(2.5);
  filter: drop-shadow(0 0 100px rgba(123, 44, 255, 0.9));
}

/* ==================== PARTÍCULAS ==================== */
.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #a855f7, transparent);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  box-shadow: 0 0 12px #a855f7;
  animation: particleFloat 3s ease-out forwards;
  animation-delay: calc(var(--i) * 0.08s);
}

/* ==================== CONTENEDOR DEL LIBRO ==================== */
.book-container {
  position: relative;
  width: 350px;
  height: 450px;
  z-index: 10;
  perspective: 1500px;
  transform-style: preserve-3d;
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 0 40px rgba(200, 100, 255, 0.5));
}

.book-container.opening {
  filter: drop-shadow(0 0 60px rgba(200, 100, 255, 0.7));
}

.book-container.zooming {
  transform: scale(2.5);
  filter: drop-shadow(0 0 100px rgba(200, 100, 255, 0.9));
}

/* ==================== PARTÍCULAS ==================== */
.magic-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #c864ff, transparent);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  box-shadow: 0 0 12px #c864ff;
  animation: particleFloat 3s ease-out forwards;
  animation-delay: calc(var(--i) * 0.08s);
}

@keyframes particleFloat {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(cos(var(--i) * 24deg) * 200px),
      calc(sin(var(--i) * 24deg) * 200px)
    ) scale(0);
    opacity: 0;
  }
}

/* ==================== LIBRO ==================== */
.book {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.book-container.opening .book {
  transform: rotateY(130deg);
}

/* ==================== PORTADAS ==================== */
.book-cover {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid;
  border-radius: 4px;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.book-cover.front {
  background: linear-gradient(135deg, #5a2d7f 0%, #7b2cff 50%, #a855f7 100%);
  border-color: #bba8ff;
  box-shadow: 
    inset -2px 0 10px rgba(0, 0, 0, 0.3),
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(187, 168, 255, 0.4);
  z-index: 2;
  transform: rotateY(0deg);
}

.book-cover.back {
  background: linear-gradient(135deg, #f5f1de 0%, #fffbf0 100%);
  border-color: #8b7355;
  box-shadow: 
    inset 2px 0 10px rgba(0, 0, 0, 0.2),
    0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 1;
  transform: rotateY(180deg);
}

/* ==================== CONTENIDO ==================== */
.cover-content {
  text-align: center;
  padding: 50px;
  position: relative;
  z-index: 5;
}

.book-cover.front .cover-content {
  color: #bba8ff;
}

.book-cover.front h1 {
  font-size: 2.5em;
  font-family: Georgia, serif;
  margin-bottom: 15px;
  text-shadow: 
    0 0 20px rgba(187, 168, 255, 0.9),
    0 0 30px rgba(187, 168, 255, 0.6),
    0 3px 8px rgba(0, 0, 0, 0.7);
  letter-spacing: 3px;
  animation: titlePulse 2s ease-in-out infinite;
}

@keyframes titlePulse {
  0%, 100% {
    text-shadow: 
      0 0 20px rgba(187, 168, 255, 0.9),
      0 0 30px rgba(187, 168, 255, 0.6),
      0 3px 8px rgba(0, 0, 0, 0.7);
  }
  50% {
    text-shadow: 
      0 0 30px rgba(187, 168, 255, 1),
      0 0 50px rgba(187, 168, 255, 0.8),
      0 3px 8px rgba(0, 0, 0, 0.7);
  }
}

.book-cover.front p {
  font-size: 1.1em;
  color: #e0d5ff;
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: subtitleFloat 3s ease-in-out infinite;
}

@keyframes subtitleFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.book-cover.back .cover-content {
  color: #8b2d8b;
}

.book-cover.back p {
  font-size: 1.3em;
  font-family: Georgia, serif;
  letter-spacing: 2px;
}

/* ==================== FLASH ==================== */
.flash-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(123, 44, 255, 0.8) 0%, transparent 70%);
  opacity: 0;
  z-index: 15;
  pointer-events: none;
}

.flash-effect.active {
  animation: finalFlash 0.8s ease-out;
}

@keyframes finalFlash {
  0% {
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
