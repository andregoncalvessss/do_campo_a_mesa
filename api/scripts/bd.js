// Conveniência de desenvolvimento: arranca um MongoDB local (sem instalação) na porta 27017,
// com os dados guardados em api/.mongo-dados/. Uso: npm run bd
// Em produção e na avaliação usa-se o MongoDB Atlas (MONGODB_URI no .env).
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const dbPath = path.join(__dirname, "..", ".mongo-dados");
  fs.mkdirSync(dbPath, { recursive: true });
  const servidor = await MongoMemoryServer.create({
    instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' }
  });
  console.log(`MongoDB local em ${servidor.getUri()}do-campo-a-mesa (Ctrl+C para parar)`);
  const parar = async () => { await servidor.stop({ doCleanup: false }); process.exit(0); };
  process.on('SIGINT', parar);
  process.on('SIGTERM', parar);
})().catch((err) => { console.error(err.message); process.exit(1); });
