// Ligação ao MongoDB (Atlas em produção, local em desenvolvimento)
const mongoose = require('mongoose');

async function ligarBD() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI não está definida (ver .env.example)');
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Ligado ao MongoDB');
}

module.exports = { ligarBD };
