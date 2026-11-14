// Formatação partilhada (moeda, datas, iniciais)
const moeda = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
export const euro = (valor) => moeda.format(valor ?? 0);

export const data = (d) => new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
export const dataHora = (d) => new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
export const hora = (d) => new Date(d).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const iniciais = (nome = '') => nome.split(/\s+/).filter((p) => p.length > 2 || /^[A-Z]/.test(p)).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

// "Hortícolas" -> "horticolas" (classe CSS da categoria, sem acentos)
export const semAcentos = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Referência curta da encomenda, a partir do id
export const refEncomenda = (id = '') => `#${String(id).slice(-6).toUpperCase()}`;

export const CATEGORIAS = ['Hortícolas', 'Fruta', 'Mel', 'Vinho', 'Queijo', 'Padaria', 'Outros'];
export const EPOCAS = ['Primavera', 'Verão', 'Outono', 'Inverno'];
export const ESTADOS = ['pendente', 'confirmada', 'pronta', 'entregue'];
