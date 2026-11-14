// Passo 2: estado global do carrinho, guardado no localStorage para sobreviver a um refresh
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CarrinhoContext = createContext(null);

function lerCarrinho() {
  try { return JSON.parse(localStorage.getItem('carrinho')) || []; } catch { return []; }
}

export function CarrinhoProvider({ children }) {
  const [linhas, setLinhas] = useState(lerCarrinho); // [{ produto, quantidade }]

  useEffect(() => {
    try { localStorage.setItem('carrinho', JSON.stringify(linhas)); } catch { /* sem armazenamento */ }
  }, [linhas]);

  function adicionar(produto, quantidade = 1) {
    setLinhas((atual) => {
      const existe = atual.find((l) => l.produto._id === produto._id);
      if (existe) {
        return atual.map((l) => (l.produto._id === produto._id ? { ...l, quantidade: l.quantidade + quantidade } : l));
      }
      return [...atual, { produto, quantidade }];
    });
  }

  function alterarQuantidade(produtoId, quantidade) {
    setLinhas((atual) => (quantidade < 1
      ? atual.filter((l) => l.produto._id !== produtoId)
      : atual.map((l) => (l.produto._id === produtoId ? { ...l, quantidade } : l))));
  }

  const remover = (produtoId) => alterarQuantidade(produtoId, 0);
  const esvaziar = () => setLinhas([]);

  // Recalculados só quando as linhas mudam
  const total = useMemo(() => Math.round(linhas.reduce((s, l) => s + l.produto.preco * l.quantidade, 0) * 100) / 100, [linhas]);
  const numArtigos = useMemo(() => linhas.reduce((s, l) => s + l.quantidade, 0), [linhas]);

  return (
    <CarrinhoContext.Provider value={{ linhas, total, numArtigos, adicionar, alterarQuantidade, remover, esvaziar }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export const useCarrinho = () => useContext(CarrinhoContext);
