// Cliente HTTP: todos os pedidos à API passam por aqui.
// O URL da API vem da variável VITE_API_URL (ficheiro .env), lida pelo Vite.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
export const USAR_DADOS_SIMULADOS = import.meta.env.VITE_USAR_DADOS_SIMULADOS === 'true';

// Erro com a mensagem da API e o código HTTP (as páginas mostram err.message)
export class ErroApi extends Error {
  constructor(mensagem, status, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

async function tratar(resposta) {
  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const detalhes = dados?.detalhes;
    const extra = detalhes ? `: ${Object.values(detalhes).join('; ')}` : '';
    throw new ErroApi(`${dados?.erro || 'Erro de comunicação com o servidor'}${extra}`, resposta.status, detalhes);
  }
  return dados;
}

export async function api(caminho, { metodo = 'GET', corpo, token } = {}) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}/api${caminho}`, {
      method: metodo,
      headers: {
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: corpo ? JSON.stringify(corpo) : undefined
    });
  } catch {
    throw new ErroApi('Não foi possível contactar o servidor', 0);
  }
  return tratar(resposta);
}

// Envio de ficheiros (multipart/form-data): o browser define o Content-Type
export async function enviarFicheiro(caminho, campo, ficheiro, token) {
  const dados = new FormData();
  dados.append(campo, ficheiro);
  const resposta = await fetch(`${API_URL}/api${caminho}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: dados
  });
  return tratar(resposta);
}
