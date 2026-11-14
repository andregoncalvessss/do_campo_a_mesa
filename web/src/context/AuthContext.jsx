// Passo 6: sessão do utilizador ({ token, utilizador }) no estado e no localStorage
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);
const CHAVE = 'sessao';

function lerSessao() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || null; } catch { return null; }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessao);

  const guardarSessao = useCallback((nova) => {
    setSessao(nova);
    try {
      if (nova) localStorage.setItem(CHAVE, JSON.stringify(nova));
      else localStorage.removeItem(CHAVE);
    } catch { /* sem armazenamento */ }
  }, []);

  const sair = useCallback(() => guardarSessao(null), [guardarSessao]);

  async function entrar(email, password) {
    const dados = await api('/auth/login', { metodo: 'POST', corpo: { email, password } });
    guardarSessao(dados);
    return dados.utilizador;
  }

  async function registar(corpo) {
    const dados = await api('/auth/registo', { metodo: 'POST', corpo });
    guardarSessao(dados);
    return dados.utilizador;
  }

  // Atualiza os dados do utilizador (ex.: produtor validado) e termina a sessão se o token expirou
  const atualizar = useCallback(async () => {
    if (!sessao?.token) return;
    try {
      const utilizador = await api('/auth/eu', { token: sessao.token });
      guardarSessao({ ...sessao, utilizador });
    } catch (err) {
      if (err.status === 401) sair();
    }
  }, [sessao, guardarSessao, sair]);

  useEffect(() => { atualizar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const valor = useMemo(() => ({
    token: sessao?.token || null,
    utilizador: sessao?.utilizador || null,
    entrar, registar, sair, atualizar
  }), [sessao, atualizar, sair]); // eslint-disable-line react-hooks/exhaustive-deps

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Página inicial de cada papel depois do login
export const INICIO = { comprador: '/', produtor: '/produtor', admin: '/admin' };
