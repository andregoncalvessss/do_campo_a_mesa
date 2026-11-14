// Criação de um leilão: produto, quantidade, preço base, incremento, duração e início
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import Icone from '../../components/Icone.jsx';

const DURACOES = [[15, '15 min'], [30, '30 min'], [60, '1 h'], [0, 'Outra']];

// Valor para <input type="datetime-local"> na hora local
const paraInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function NovoLeilao() {
  const { utilizador, token } = useAuth();
  const navigate = useNavigate();
  const { dados: produtos } = useApi(`/products?produtor=${utilizador.id}&ordenar=nome`);
  const [form, setForm] = useState({
    produto: '', lote: '', quantidade: '', descricao: '', precoBase: '', incremento: '5',
    duracao: 30, outraDuracao: 45, quando: 'agora', iniciaEm: paraInput(new Date(Date.now() + 3600e3)), permitirEntrega: true
  });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const mudar = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  // Ao escolher um produto, sugere o nome do lote
  function escolherProduto(e) {
    const p = produtos?.find((x) => x._id === e.target.value);
    setForm((f) => ({ ...f, produto: e.target.value, lote: f.lote || (p ? p.nome : '') }));
  }

  async function publicar(e) {
    e.preventDefault();
    setAEnviar(true);
    try {
      const l = await api('/auctions', {
        metodo: 'POST',
        token,
        corpo: {
          produto: form.produto || undefined,
          lote: form.lote,
          quantidade: form.quantidade,
          descricao: form.descricao,
          precoBase: Number(form.precoBase),
          incremento: Number(form.incremento),
          duracaoMin: Number(form.duracao) || Number(form.outraDuracao),
          iniciaEm: form.quando === 'agendar' ? new Date(form.iniciaEm).toISOString() : undefined,
          permitirEntrega: form.permitirEntrega
        }
      });
      navigate(`/leiloes/${l._id}`);
    } catch (err) {
      setErro(err.message);
      setAEnviar(false);
    }
  }

  return (
    <div className="formulario-estreito">
      <h1 className="h3 mb-3">
        <Link to="/produtor" className="text-reset me-2" aria-label="Voltar ao painel"><Icone nome="voltar" tamanho={22} /></Link>
        Criar leilão
      </h1>
      {!utilizador.produtor?.validado && (
        <div className="alert alert-warning" role="status">A conta ainda não foi validada pelo administrador: não é possível criar leilões.</div>
      )}
      <form className="cartao d-grid gap-3" onSubmit={publicar}>
        {erro && <div className="alert alert-danger mb-0" role="alert">{erro}</div>}
        <div>
          <label htmlFor="l-produto" className="form-label">Produto</label>
          <select id="l-produto" className="form-select" value={form.produto} onChange={escolherProduto}>
            <option value="">Sem produto associado</option>
            {produtos?.map((p) => <option key={p._id} value={p._id}>{p.nome} · {p.unidade}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="l-lote" className="form-label">Título do lote</label>
          <input id="l-lote" className="form-control" placeholder="ex.: 200 kg de kiwi Hayward, calibre A" value={form.lote} onChange={mudar('lote')} required maxLength={150} />
        </div>
        <div>
          <label htmlFor="l-quantidade" className="form-label">Quantidade no lote</label>
          <input id="l-quantidade" className="form-control" placeholder="ex.: 60 garrafas" value={form.quantidade} onChange={mudar('quantidade')} required />
        </div>
        <div>
          <label htmlFor="l-descricao" className="form-label">Descrição</label>
          <textarea id="l-descricao" className="form-control" rows="2" maxLength={1000} value={form.descricao} onChange={mudar('descricao')} />
        </div>
        <div className="row g-2">
          <div className="col-6">
            <label htmlFor="l-base" className="form-label">Preço base (€)</label>
            <input id="l-base" type="number" min="0" step="0.01" className="form-control" value={form.precoBase} onChange={mudar('precoBase')} required />
          </div>
          <div className="col-6">
            <label htmlFor="l-incremento" className="form-label">Incremento mín. (€)</label>
            <input id="l-incremento" type="number" min="0.01" step="0.01" className="form-control" value={form.incremento} onChange={mudar('incremento')} required />
          </div>
        </div>
        <fieldset>
          <legend className="form-label fs-6">Duração</legend>
          <div className="duracoes">
            {DURACOES.map(([min, texto]) => (
              <div key={min}>
                <input type="radio" className="btn-check" name="duracao" id={`d-${min}`} value={min}
                  checked={Number(form.duracao) === min} onChange={mudar('duracao')} />
                <label className="btn w-100" htmlFor={`d-${min}`}>{texto}</label>
              </div>
            ))}
          </div>
          {Number(form.duracao) === 0 && (
            <div className="mt-2">
              <label htmlFor="l-outra" className="form-label small mb-1">Duração em minutos</label>
              <input id="l-outra" type="number" min="1" max="10080" step="1" className="form-control" value={form.outraDuracao} onChange={mudar('outraDuracao')} required />
            </div>
          )}
        </fieldset>
        <fieldset>
          <legend className="form-label fs-6">Início</legend>
          {[['agora', 'Começar agora'], ['agendar', 'Agendar']].map(([valor, texto]) => (
            <div className="form-check form-check-inline" key={valor}>
              <input type="radio" className="form-check-input" name="quando" id={`q-${valor}`} value={valor} checked={form.quando === valor} onChange={mudar('quando')} />
              <label className="form-check-label" htmlFor={`q-${valor}`}>{texto}</label>
            </div>
          ))}
          {form.quando === 'agendar' && (
            <div className="mt-2">
              <label htmlFor="l-inicio" className="form-label small mb-1">Data e hora de início</label>
              <input id="l-inicio" type="datetime-local" className="form-control" min={paraInput(new Date())} value={form.iniciaEm} onChange={mudar('iniciaEm')} required />
            </div>
          )}
        </fieldset>
        <div className="form-check cartao d-flex gap-2 ps-3">
          <input type="checkbox" className="form-check-input ms-0 flex-shrink-0" id="l-entrega" checked={form.permitirEntrega} onChange={mudar('permitirEntrega')} />
          <label className="form-check-label" htmlFor="l-entrega">
            <strong className="d-block"><Icone nome="camiao" /> Permitir entrega ao vencedor</strong>
            <span className="small texto-secundario">Além do levantamento na quinta, o vencedor pode pedir entrega.</span>
          </label>
        </div>
        <button type="submit" className="btn btn-success btn-lg" disabled={aEnviar || !utilizador.produtor?.validado}>
          {aEnviar ? 'A publicar…' : 'Publicar leilão'}
        </button>
      </form>
    </div>
  );
}
