// Contagem decrescente sincronizada: o servidor envia terminaEm e a sua hora ("agora");
// o cliente guarda a diferença (offset) e calcula o tempo restante com o relógio corrigido.
import { useEffect, useState } from 'react';

export function useContagem(ate, offset = 0) {
  const calcular = () => (ate ? Math.max(0, new Date(ate).getTime() - (Date.now() + offset)) : 0);
  const [restante, setRestante] = useState(calcular);

  useEffect(() => {
    setRestante(calcular());
    const t = setInterval(() => setRestante(calcular()), 1000);
    return () => clearInterval(t);
  }, [ate, offset]); // eslint-disable-line react-hooks/exhaustive-deps
  return restante;
}

export function formatarTempo(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
}
