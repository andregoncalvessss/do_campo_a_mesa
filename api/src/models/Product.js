const { Schema, model, Types } = require('mongoose');

const CATEGORIAS = ['Hortícolas', 'Fruta', 'Mel', 'Vinho', 'Queijo', 'Padaria', 'Outros'];
const EPOCAS = ['Primavera', 'Verão', 'Outono', 'Inverno'];

// O produtor é REFERENCIADO: tem muitos produtos e os seus dados mudam.
const productSchema = new Schema({
  produtor: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  nome: { type: String, required: true, trim: true, maxlength: 120 },
  descricao: { type: String, maxlength: 1000 },
  categoria: { type: String, required: true, enum: CATEGORIAS },
  preco: { type: Number, required: true, min: 0 },
  unidade: { type: String, default: 'unid.', trim: true, maxlength: 20 },
  stock: { type: Number, default: 0, min: 0 },
  biologico: { type: Boolean, default: false },
  epocas: { type: [{ type: String, enum: EPOCAS }], default: [] },
  imagemUrl: String
}, { timestamps: true });

productSchema.statics.CATEGORIAS = CATEGORIAS;
productSchema.statics.EPOCAS = EPOCAS;

module.exports = model('Product', productSchema);
