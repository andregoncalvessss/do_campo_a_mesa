// Passo 8: fotografias dos produtos.
// Com STORAGE_CONN -> Azure Blob Storage; sem ela (desenvolvimento) -> pasta api/uploads/.
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');

const TIPOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const PASTA_LOCAL = path.join(__dirname, '..', '..', 'uploads');

// O ficheiro fica em memória (buffer) e é limitado a 5 MB
const receberImagem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
}).single('imagem');

let container;
function obterContainer() {
  if (!container) {
    const { BlobServiceClient } = require('@azure/storage-blob');
    container = BlobServiceClient
      .fromConnectionString(process.env.STORAGE_CONN)
      .getContainerClient(process.env.STORAGE_CONTAINER || 'produtos');
  }
  return container;
}

async function guardarImagem(ficheiro, req) {
  const extensao = TIPOS[ficheiro.mimetype];
  if (!extensao) throw Object.assign(new Error('Formato de imagem não suportado (JPEG, PNG ou WebP)'), { status: 400 });
  // Nome aleatório: nunca se usa o nome enviado pelo utilizador
  const nome = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extensao}`;

  if (process.env.STORAGE_CONN) {
    const blob = obterContainer().getBlockBlobClient(nome);
    await blob.uploadData(ficheiro.buffer, { blobHTTPHeaders: { blobContentType: ficheiro.mimetype } });
    return blob.url;
  }

  await fs.mkdir(PASTA_LOCAL, { recursive: true });
  await fs.writeFile(path.join(PASTA_LOCAL, nome), ficheiro.buffer);
  return `${req.protocol}://${req.get('host')}/uploads/${nome}`;
}

module.exports = { receberImagem, guardarImagem };
