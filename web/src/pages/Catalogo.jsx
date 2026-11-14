// Catálogo (visitante e comprador): pesquisa, filtros e destaque do leilão em direto
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useApi } from '../hooks/useApi.js';
import CartaoProduto from '../components/CartaoProduto.jsx';
import CartaoLeilao from '../components/CartaoLeilao.jsx';
import { CATEGORIAS, EPOCAS } from '../utils/formato.js';
import produtosSimulados from '../data/produtos.json';

const FILTRO_INICIAL = { q: '', categoria: 'Todos', bio: false, epoca: '', precoMax: '', localidade: '', ordenar: 'recentes' };

export default function Catalogo() {
  const { utilizador } = useAuth();
  const carrinho = useCarrinho(); // contexto partilhado
  const [produtos, setProdutos] = useState(null);
  const [filtro, setFiltro] = useState(FILTRO_INICIAL);
  const [erro, setErro] = useState('');
  const [adicionado, setAdicionado] = useState('');
  const { dados: leiloes } = useApi(USAR_DADOS_SIMULADOS ? null : '/auctions?estado=ativo');

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      setProdutos(produtosSimulados.filter((p) =>
        (filtro.categoria === 'Todos' || p.categoria === filtro.categoria) &&
        (!filtro.bio || p.biologico) &&
        (!filtro.epoca || p.epocas.includes(filtro.epoca)) &&
        (!filtro.precoMax || p.preco <= Number(filtro.precoMax)) &&
        p.nome.toLowerCase().includes(filtro.q.toLowerCase())));
      return undefined;
    }
    // Espera 300 ms depois da última tecla antes de pedir à API (debounce)
    const t = setTimeout(() => {
      const q = new URLSearchParams(Object.entries(filtro).filter(([, v]) => v !== '' && v !== false));
      api(`/products?${q}`).then((d) => { setProdutos(d); setErro(''); }).catch((e) => setErro(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [filtro]);

  // Data binding: um único handler para todos os campos do formulário
  const mudar = (campo) => (e) =>
    setFiltro((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function adicionar(p) {
    carrinho.adicionar(p);
    setAdicionado(`${p.nome} adicionado ao carrinho.`);
  }

  const souComprador = utilizador?.papel === 'comprador';
  const destaque = leiloes?.[0];

  return (
    <>
      <section className="heroi" aria-labelledby="titulo-heroi">
        <div>
          <p className="rotulo rotulo--terracota mb-2">Alto Minho · Produção local</p>
          <h1 id="titulo-heroi">Direto de quem produz, para a sua mesa.</h1>
          <p className="texto-secundario">
            Encomende para levantar na quinta ou receber em casa, e dispute os lotes da época nos leilões em direto.
          </p>
          {!utilizador && (
            <div className="d-flex flex-wrap gap-2">
              <Link to="/registo" className="btn btn-success">Criar conta</Link>
              <Link to="/registo?papel=produtor" className="btn btn-outline-success">Sou produtor</Link>
            </div>
          )}
        </div>
        {destaque && <CartaoLeilao leilao={destaque} />}
      </section>

      <section aria-labelledby="titulo-catalogo">
        <h2 id="titulo-catalogo" className="visually-hidden">Catálogo de produtos</h2>

        <form className="mb-3" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="pesquisa" className="visually-hidden">Pesquisar produtos</label>
          <input id="pesquisa" type="search" className="form-control" placeholder="Pesquisar kiwi, mel, Alvarinho, produtor…"
            value={filtro.q} onChange={mudar('q')} />
        </form>

        <div className="filtros">
          <div className="categorias" role="group" aria-label="Categoria">
            {['Todos', ...CATEGORIAS].map((c) => (
              <button key={c} type="button" className={`btn btn-sm ${filtro.categoria === c ? 'ativo' : ''}`}
                aria-pressed={filtro.categoria === c} onClick={() => setFiltro((f) => ({ ...f, categoria: c }))}>
                {c}
              </button>
            ))}
          </div>
          <div className="filtros__opcoes">
            <div className="form-check mb-0">
              <input id="bio" type="checkbox" className="form-check-input" checked={filtro.bio} onChange={mudar('bio')} />
              <label htmlFor="bio" className="form-check-label">Só biológico</label>
            </div>
            <div className="d-flex align-items-center gap-1">
              <label htmlFor="epoca">Época</label>
              <select id="epoca" className="form-select form-select-sm" value={filtro.epoca} onChange={mudar('epoca')}>
                <option value="">Todas</option>
                {EPOCAS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className="d-flex align-items-center gap-1">
              <label htmlFor="precoMax">Até (€)</label>
              <input id="precoMax" type="number" min="0" step="0.5" className="form-control form-control-sm campo-preco"
                value={filtro.precoMax} onChange={mudar('precoMax')} />
            </div>
            {!USAR_DADOS_SIMULADOS && (
              <>
                <div className="d-flex align-items-center gap-1">
                  <label htmlFor="localidade">Localidade</label>
                  <input id="localidade" type="text" className="form-control form-control-sm" size="12"
                    value={filtro.localidade} onChange={mudar('localidade')} />
                </div>
                <div className="d-flex align-items-center gap-1">
                  <label htmlFor="ordenar">Ordenar</label>
                  <select id="ordenar" className="form-select form-select-sm" value={filtro.ordenar} onChange={mudar('ordenar')}>
                    <option value="recentes">Mais recentes</option>
                    <option value="preco_asc">Preço mais baixo</option>
                    <option value="preco_desc">Preço mais alto</option>
                    <option value="nome">Nome</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
        <p className="visually-hidden" role="status" aria-live="polite">{adicionado}</p>
        {!produtos && !erro && <p className="texto-secundario" role="status">A carregar…</p>}
        {produtos?.length === 0 && <p className="texto-secundario">Nenhum produto corresponde aos filtros.</p>}

        <div className="grelha-produtos">
          {produtos?.map((p) => (
            <CartaoProduto key={p._id} produto={p} onAdicionar={souComprador ? () => adicionar(p) : undefined} />
          ))}
        </div>
        {!utilizador && produtos?.length > 0 && (
          <p className="text-center mt-4"><Link to="/registo" className="btn btn-success">Registar para encomendar</Link></p>
        )}
      </section>
    </>
  );
}
