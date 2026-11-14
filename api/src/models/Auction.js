const { Schema, model, Types } = require('mongoose');

// A licitação atual fica EMBEBIDA: é validada e gravada numa única operação atómica.
// O histórico de licitações é REFERENCIADO (coleção bids), porque cresce sem limite.
const auctionSchema = new Schema({
  produtor: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  produto: { type: Types.ObjectId, ref: 'Product' },
  lote: { type: String, required: true, trim: true, maxlength: 150 },
  descricao: { type: String, maxlength: 1000 },
  quantidade: String,
  precoBase: { type: Number, required: true, min: 0 },
  incremento: { type: Number, required: true, min: 0.01 },
  permitirEntrega: { type: Boolean, default: false },
  // Começa com valor = precoBase e sem comprador; cada licitação tem de ser >= valor + incremento
  licitacaoAtual: {
    valor: Number,
    comprador: { type: Types.ObjectId, ref: 'User' },
    nome: String,
    em: Date
  },
  numLicitacoes: { type: Number, default: 0 },
  iniciaEm: { type: Date, required: true },
  terminaEm: { type: Date, required: true, index: true },
  estado: { type: String, enum: ['agendado', 'ativo', 'terminado'], default: 'agendado', index: true },
  encomenda: { type: Types.ObjectId, ref: 'Order' } // criada para o vencedor quando o leilão fecha
}, { timestamps: true });

module.exports = model('Auction', auctionSchema);
