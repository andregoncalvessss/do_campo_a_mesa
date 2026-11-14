// Servidor HTTP + Socket.io + ciclo dos leilões
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { ligarBD } = require('./config/db');
const registarSockets = require('./sockets');
const { iniciarCicloLeiloes } = require('./services/cicloLeiloes');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não está definida (ver .env.example)');
  await ligarBD();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || '*' }
  });

  // Disponibiliza o io às rotas (ex.: notificar o comprador quando a encomenda muda)
  app.set('io', io);
  registarSockets(io);

  // Abre os leilões agendados e fecha os que expiraram
  iniciarCicloLeiloes(io);

  server.listen(PORT, () => {
    console.log(`API em http://localhost:${PORT}`);
    console.log(`Documentação em http://localhost:${PORT}/api-docs`);
  });
}

iniciar().catch((err) => {
  console.error('Falha ao arrancar:', err.message);
  process.exit(1);
});
