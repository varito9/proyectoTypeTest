import { io } from 'socket.io-client'

// Vite nos proporciona la variable import.meta.env.MODE para saber el entorno.
const isProduction = import.meta.env.MODE === 'production';

// En desarrollo, siempre nos conectamos a localhost:3001.
// En producción, usamos la variable de entorno VITE_BACKEND_URL.
// Si VITE_BACKEND_URL no está definida en el build de producción,
// usamos el mismo origen de la ventana (ideal para el proxy inverso de Nginx).
const URL = isProduction
    ? import.meta.env.VITE_BACKEND_URL || `https://${window.location.host}`
    : 'http://localhost:3001';

export const socket = io(URL, {
    autoConnect: false, // Evita que se conecte automáticamente al cargar la página.
})