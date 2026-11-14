// Média e número de avaliações visíveis de um produtor (agregação)
const { Types } = require('mongoose');
const Review = require('../models/Review');

async function mediaProdutor(produtorId) {
  const [r] = await Review.aggregate([
    { $match: { produtor: new Types.ObjectId(String(produtorId)), visivel: true } },
    { $group: { _id: null, media: { $avg: '$classificacao' }, total: { $sum: 1 } } }
  ]);
  return { media: r ? Math.round(r.media * 10) / 10 : null, total: r ? r.total : 0 };
}

module.exports = { mediaProdutor };
