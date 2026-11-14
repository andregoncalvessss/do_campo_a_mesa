const { Schema, model, Types } = require('mongoose');

// Avaliações REFERENCIADAS: consultadas por produtor e moderadas pelo administrador.
const reviewSchema = new Schema({
  autor: { type: Types.ObjectId, ref: 'User', required: true },
  produtor: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  encomenda: { type: Types.ObjectId, ref: 'Order', required: true },
  produto: { type: Types.ObjectId, ref: 'Product' }, // opcional: avaliação de um produto da encomenda
  nomeProduto: String,
  classificacao: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, trim: true, maxlength: 500 },
  denuncias: { type: Number, default: 0 },
  denunciadoPor: { type: [{ type: Types.ObjectId, ref: 'User' }], select: false },
  visivel: { type: Boolean, default: true }
}, { timestamps: true });

// Uma avaliação por encomenda (segunda tentativa -> erro 11000 -> 409)
reviewSchema.index({ encomenda: 1, autor: 1 }, { unique: true });

module.exports = model('Review', reviewSchema);
