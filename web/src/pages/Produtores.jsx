// Lista de produtores validados, com pesquisa por nome e localidade
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { Carregar } from '../components/Estado.jsx';
import Icone from '../components/Icone.jsx';
import { iniciais } from '../utils/formato.js';

export default function Produtores() {
  const [texto, setTexto] = useState('');
  const { dados, erro, aCarregar } = useApi('/producers');

  const t = texto.toLowerCase();
  const lista = dados?.filter((u) =>
    `${u.produtor?.nomeExploracao} ${u.produtor?.localidade}`.toLowerCase().includes(t));

  return (
    <>
      <h1 className="h2 mb-3">Produtores</h1>
      <div className="mb-3">
        <label htmlFor="pesquisa-produtores" className="form-label">Pesquisar por nome ou localidade</label>
        <input id="pesquisa-produtores" type="search" className="form-control" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>
      <Carregar aCarregar={aCarregar} erro={erro}>
        {lista?.length === 0 && <p className="texto-secundario">Nenhum produtor encontrado.</p>}
        <div className="grelha-leiloes">
          {lista?.map((u) => (
            <article key={u._id} className="cartao d-flex gap-3">
              <span className="avatar avatar--quadrado" aria-hidden="true">{iniciais(u.produtor?.nomeExploracao || u.nome)}</span>
              <div>
                <h2 className="h5 mb-1"><Link to={`/produtores/${u._id}`} className="stretched-link text-reset">{u.produtor?.nomeExploracao || u.nome}</Link></h2>
                <p className="small texto-secundario mb-1"><Icone nome="pin" tamanho={14} /> {u.produtor?.localidade}</p>
                <p className="small mb-0">{u.produtor?.descricao}</p>
              </div>
            </article>
          ))}
        </div>
      </Carregar>
    </>
  );
}
