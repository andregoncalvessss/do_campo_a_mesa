// Página pública do produtor: dados, mapa, produtos e avaliações
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useApi } from '../hooks/useApi.js';
import CartaoProduto from '../components/CartaoProduto.jsx';
import { Carregar, Estrelas } from '../components/Estado.jsx';
import Icone from '../components/Icone.jsx';
import { data, iniciais } from '../utils/formato.js';

// Mapa do OpenStreetMap embutido (sem chave de API)
function Mapa({ lat, lng, titulo }) {
  const d = 0.03;
  const bbox = [lng - d, lat - d / 2, lng + d, lat + d / 2].join(',');
  return (
    <iframe className="mapa" title={titulo} loading="lazy"
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`} />
  );
}

export default function Produtor() {
  const { id } = useParams();
  const { utilizador, token } = useAuth();
  const carrinho = useCarrinho();
  const { dados, erro, aCarregar } = useApi(`/producers/${id}`);
  const [mensagem, setMensagem] = useState('');

  async function denunciar(avaliacaoId) {
    try {
      await api(`/reviews/${avaliacaoId}/denunciar`, { metodo: 'POST', token });
      setMensagem('Denúncia registada. O administrador vai analisar a avaliação.');
    } catch (err) {
      setMensagem(err.message);
    }
  }

  const p = dados?.produtor;
  const info = p?.produtor;
  const souComprador = utilizador?.papel === 'comprador';

  return (
    <Carregar aCarregar={aCarregar} erro={erro}>
      {p && (
        <article>
          <div className="produtor__capa" aria-hidden="true" />
          <header className="produtor__topo mb-4">
            <span className="avatar avatar--quadrado mb-2" aria-hidden="true">{iniciais(info.nomeExploracao || p.nome)}</span>
            <h1 className="h2 mb-1">{info.nomeExploracao || p.nome}</h1>
            <p className="texto-secundario mb-2"><Icone nome="pin" tamanho={15} /> {info.localidade}</p>
            <div className="d-flex flex-wrap gap-2">
              <span className="chip chip--verde"><Icone nome="escudo" tamanho={14} /> Produtor verificado</span>
              <span className="chip">
                {dados.avaliacao.total
                  ? <><span className="estrelas" aria-hidden="true">★</span> {String(dados.avaliacao.media).replace('.', ',')} · {dados.avaliacao.total} avaliações</>
                  : 'Sem avaliações'}
              </span>
            </div>
          </header>

          <div className="produtor__colunas">
            <div className="d-grid gap-3">
              <p className="mb-0">{info.descricao}</p>
              {info.localizacao?.lat != null && (
                <>
                  <Mapa lat={info.localizacao.lat} lng={info.localizacao.lng} titulo={`Mapa: ${info.nomeExploracao}, ${info.localidade}`} />
                  <a className="small" target="_blank" rel="noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${info.localizacao.lat}&mlon=${info.localizacao.lng}#map=14/${info.localizacao.lat}/${info.localizacao.lng}`}>
                    Ver mapa maior
                  </a>
                </>
              )}

              <section aria-labelledby="titulo-avaliacoes">
                <h2 id="titulo-avaliacoes" className="h5">Avaliações ({dados.avaliacao.total})</h2>
                {mensagem && <div className="alert alert-info py-2 small" role="status">{mensagem}</div>}
                {dados.avaliacoes.length === 0 && <p className="texto-secundario small">Ainda não há avaliações.</p>}
                {dados.avaliacoes.map((a) => (
                  <div key={a._id} className="cartao mb-2">
                    <div className="d-flex justify-content-between gap-2">
                      <strong className="small">{a.autor?.nome}</strong>
                      <Estrelas valor={a.classificacao} />
                    </div>
                    {a.nomeProduto && <p className="small texto-secundario mb-1">Sobre: {a.nomeProduto}</p>}
                    <p className="small mb-1">{a.comentario}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small texto-secundario">{data(a.createdAt)}</span>
                      {utilizador && (
                        <button type="button" className="btn btn-link btn-sm p-0 texto-secundario" onClick={() => denunciar(a._id)}>
                          <Icone nome="bandeira" tamanho={13} /> Denunciar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <section aria-labelledby="titulo-produtos">
              <h2 id="titulo-produtos" className="h5">Produtos ({dados.produtos.length})</h2>
              <div className="grelha-produtos">
                {dados.produtos.map((prod) => (
                  <CartaoProduto key={prod._id} produto={prod} onAdicionar={souComprador ? () => carrinho.adicionar({ ...prod, produtor: p }) : undefined} />
                ))}
              </div>
              {!utilizador && <Link to="/registo" className="btn btn-success w-100 mt-3">Registar para encomendar</Link>}
            </section>
          </div>
        </article>
      )}
    </Carregar>
  );
}
