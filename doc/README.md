# Documentació
Llistat d'alguns dels punts que han de quedar explicats en aquesta carpeta. Poden ser tots en aquest fitxer o en diversos fitxers enllaçats.

És obligatori modificar aquest document!!

## Documentació bàsica MÍNIMA
 * Objectius
 * Arquitectura bàsica
   * Tecnologies utilitzades
   * Interrelació entre els diversos components
 * Com crees l'entorn de desenvolupament
 * Com desplegues l'aplicació a producció
 * Llistat d'endpoints de l'API de backend (també podeu documentar-ho amb swagger)
    * Rutes
   * Exemples de JSON de peticó
   * Exemples de JSON de resposta i els seus codis d'estat 200? 404?
 * Aplicació Android
 * Altres elements importants.                                
 * ...
  <!--  -->
# 🏎️ Type Racer Royale — Documentació del Projecte
 ## 🎯 Objectius

L’objectiu principal d’aquest projecte és desenvolupar una aplicació web multijugador en temps real, inspirada en Monkeytype, on diversos usuaris poden competir escrivint textos el més ràpid possible.

 ### L’aplicació permet:

Connexió de diversos jugadors simultàniament.

Gestió de partides i puntuacions.

Comunicació en temps real mitjançant Socket.IO.

Execució totalment contenitzada amb Docker.

## 🏗️ Arquitectura bàsica
## 🧱 Tecnologies utilitzades
### Component	Tecnologia
Backend	Node.js + Express + Socket.IO
Frontend	Vite (Vue.js o JS Vanilla)
Contenidors	Docker + Docker Compose
Comunicació	WebSockets (Socket.IO)
## 🧩 Interrelació entre components
   ┌─────────────────────┐
   │     Frontend        │
   │  (Vite + Vue.js)    │
   │  http://localhost:5174  │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │     Backend         │
   │  Node.js + Socket.IO│
   │  http://localhost:3001  │
   └──────────┬──────────┘
              │
              ▼
      Comunicació en temps real
           amb Socket.IO


El frontend s’encarrega de la interfície del joc i la gestió d’esdeveniments dels usuaris,
mentre que el backend gestiona la lògica del joc, puntuacions, jugadors i comunicació WebSocket.

Tot el sistema s’executa en contenidors Docker connectats mitjançant una xarxa interna (trr-net).

## ⚙️ Creació de l’entorn de desenvolupament
## 1️⃣ Clonar el repositori
git clone https://github.com/tuusuario/type-racer-royale.git
cd type-racer-royale

## 2️⃣ Crear els fitxers .env
### Backend (backend/.env)
PORT=3001

### Frontend (frontend/.env)
VITE_HOST=0.0.0.0
VITE_PORT=5174
VITE_BACKEND_URL=http://localhost:3001

## 3️⃣ Fitxer docker-compose.yml
services:
  backend:
    build: ./backend
    container_name: trr-backend
    ports:
      - "3001:3001"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
    networks:
      - trr-net

  frontend:
    build: ./frontend
    container_name: trr-frontend
    ports:
      - "5174:5174"
    depends_on:
      - backend
    env_file:
      - ./frontend/.env
    networks:
      - trr-net

networks:
  trr-net:
    driver: bridge

## 4️⃣ Dockerfiles
## 🧠 Backend (backend/Dockerfile)
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["npm", "start"]

## 💻 Frontend (frontend/Dockerfile)
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

## 5️⃣ Posar en marxa l’entorn de desenvolupament
docker-compose up --build


### Accés als serveis locals:

Servei	URL	Descripció
Frontend	http://localhost:5174
	Interfície del joc
Backend	http://localhost:3001
	Servidor Socket.IO

## 🧭 Endpoint REST
Mètode	Ruta	Descripció	Exemple resposta
GET	/	Comprovació de connexió del servidor	"Backend Type Racer Royale listo 🏁"
## ⚡ Esdeveniments Socket.IO principals
### Esdeveniment	Enviat per	Descripció

- setPlayerName	Client → Server	Envia nom i ID del jugador

- setPreparat	Client → Server	Marca o desmarca el jugador com a preparat

- configurarPartida	Admin → Server	Modifica la configuració de la partida

- IniciarJoc	Admin → Server	Inicia la partida

- sumarPunts	Client → Server	Suma un punt al jugador

- sumarErrors	Client → Server	Incrementa errors del jugador

- tornarAJugar	Client → Server	Reseteja estat del jugador després d'una partida

- setPlayerList	Server → Client	Envia la llista de jugadors actualitzada

- PartidaFinalitzada	Server → Client	Retorna classificació final     

...
