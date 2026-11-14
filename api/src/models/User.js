const { Schema, model } = require('mongoose');

// Utilizadores: compradores, produtores e administradores na mesma coleção.
// Os dados da exploração ficam EMBEBIDOS (relação 1:1, sempre lida com o utilizador).
const userSchema = new Schema({
  nome: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  passwordHash: { type: String, required: true, select: false },
  papel: { type: String, enum: ['comprador', 'produtor', 'admin'], default: 'comprador' },

  // Dados específicos do produtor (página pública)
  produtor: {
    nomeExploracao: { type: String, trim: true, maxlength: 100 },
    descricao: { type: String, maxlength: 1000 },
    localidade: { type: String, trim: true, maxlength: 100 },
    localizacao: { lat: Number, lng: Number },
    validado: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Dados que podem ser enviados ao cliente (nunca o hash da password)
userSchema.methods.publico = function publico() {
  return {
    id: this._id,
    nome: this.nome,
    email: this.email,
    papel: this.papel,
    ...(this.papel === 'produtor' ? { produtor: this.produtor } : {})
  };
};

module.exports = model('User', userSchema);
