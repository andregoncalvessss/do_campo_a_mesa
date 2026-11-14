// Gestão do catálogo do produtor: criar, alterar, remover e enviar fotografias
import { useState } from 'react';
import { api, enviarFicheiro } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { Carregar } from '../../components/Estado.jsx';
import Icone from '../../components/Icone.jsx';
import { CATEGORIAS, EPOCAS, euro } from '../../utils/formato.js';

const VAZIO = { nome: '', descricao: '', categoria: 'Hortícolas', preco: '', unidade: 'kg', stock: '', biologico: false, epocas: [] };

export default function ProdutosProdutor() {
  const { utilizador, token } = useAuth();
  const { dados, erro, aCarregar, recarregar } = useApi(`/products?produtor=${utilizador.id}&ordenar=nome`);
  const [form, setForm] = useState(VAZIO);
  const [aEditar, setAEditar] = useState(null); // id do produto em edição
  const [ficheiro, setFicheiro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const validado = utilizador.produtor?.validado;

  const mudar = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const alternarEpoca = (epoca) =>
    setForm((f) => ({ ...f, epocas: f.epocas.includes(epoca) ? f.epocas.filter((x) => x !== epoca) : [...f.epocas, epoca] }));

  function editar(p) {
    setAEditar(p._id);
    setForm({ nome: p.nome, descricao: p.descricao || '', categoria: p.categoria, preco: p.preco, unidade: p.unidade, stock: p.stock, biologico: p.biologico, epocas: p.epocas });
    setFicheiro(null);
    setMensagem(null);
    document.getElementById('form-produto')?.scrollIntoView({ behavior: 'smooth' });
  }

  function limpar() {
    setAEditar(null);
    setForm(VAZIO);
    setFicheiro(null);
  }

  async function guardar(e) {
    e.preventDefault();
    const formulario = e.target;
    try {
      const corpo = { ...form, preco: Number(form.preco), stock: Number(form.stock) };
      const p = aEditar
        ? await api(`/products/${aEditar}`, { metodo: 'PUT', token, corpo })
        : await api('/products', { metodo: 'POST', token, corpo });
      if (ficheiro) await enviarFicheiro(`/products/${p._id}/imagem`, 'imagem', ficheiro, token);
      setMensagem({ tipo: 'success', texto: aEditar ? 'Produto alterado.' : 'Produto criado.' });
      limpar();
      formulario.reset();
      recarregar();
    } catch (err) {
      setMensagem({ tipo: 'danger', texto: err.message });
    }
  }

  async function remover(p) {
    if (!window.confirm(`Remover "${p.nome}"?`)) return;
    try {
      await api(`/products/${p._id}`, { metodo: 'DELETE', token });
      if (aEditar === p._id) limpar();
      recarregar();
    } catch (err) {
      setMensagem({ tipo: 'danger', texto: err.message });
    }
  }

  return (
    <>
      <h1 className="h2 mb-3">Os meus produtos</h1>
      {!validado && (
        <div className="alert alert-warning" role="status">A conta ainda não foi validada pelo administrador: não é possível publicar produtos.</div>
      )}
      <div className="painel-colunas">
        <section className="cartao" aria-label="Lista de produtos">
          <Carregar aCarregar={aCarregar} erro={erro}>
            {dados?.length === 0 && <p className="small texto-secundario mb-0">Ainda não publicou produtos.</p>}
            {dados?.map((p) => (
              <div key={p._id} className="linha-carrinho">
                <div>
                  <strong>{p.nome}</strong> {p.biologico && <span className="etiqueta">BIO</span>}
                  <div className="small texto-secundario">{p.categoria} · {euro(p.preco)} / {p.unidade}{p.imagemUrl ? ' · com fotografia' : ''}</div>
                </div>
                <span className={p.stock < 10 ? 'text-danger fw-bold small' : 'small'}>{p.stock} em stock</span>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => editar(p)}>Editar</button>
                <button type="button" className="btn btn-outline-danger btn-sm" aria-label={`Remover ${p.nome}`} onClick={() => remover(p)}>
                  <Icone nome="lixo" tamanho={16} />
                </button>
              </div>
            ))}
          </Carregar>
        </section>

        <form id="form-produto" className="cartao d-grid gap-2" onSubmit={guardar}>
          <h2 className="h6 mb-0">{aEditar ? 'Editar produto' : 'Novo produto'}</h2>
          {mensagem && <div className={`alert alert-${mensagem.tipo} py-2 mb-0 small`} role="status">{mensagem.texto}</div>}
          <fieldset className="d-grid gap-2" disabled={!validado}>
            <div>
              <label htmlFor="p-nome" className="form-label small mb-1">Nome</label>
              <input id="p-nome" className="form-control form-control-sm" value={form.nome} onChange={mudar('nome')} required maxLength={120} />
            </div>
            <div>
              <label htmlFor="p-descricao" className="form-label small mb-1">Descrição</label>
              <textarea id="p-descricao" className="form-control form-control-sm" rows="2" maxLength={1000} value={form.descricao} onChange={mudar('descricao')} />
            </div>
            <div className="row g-2">
              <div className="col-6">
                <label htmlFor="p-categoria" className="form-label small mb-1">Categoria</label>
                <select id="p-categoria" className="form-select form-select-sm" value={form.categoria} onChange={mudar('categoria')}>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label htmlFor="p-unidade" className="form-label small mb-1">Unidade</label>
                <input id="p-unidade" className="form-control form-control-sm" value={form.unidade} onChange={mudar('unidade')} required maxLength={20} />
              </div>
              <div className="col-6">
                <label htmlFor="p-preco" className="form-label small mb-1">Preço (€)</label>
                <input id="p-preco" type="number" min="0" step="0.01" className="form-control form-control-sm" value={form.preco} onChange={mudar('preco')} required />
              </div>
              <div className="col-6">
                <label htmlFor="p-stock" className="form-label small mb-1">Stock</label>
                <input id="p-stock" type="number" min="0" step="1" className="form-control form-control-sm" value={form.stock} onChange={mudar('stock')} required />
              </div>
            </div>
            <fieldset>
              <legend className="form-label small mb-1">Épocas</legend>
              <div className="d-flex flex-wrap gap-3">
                {EPOCAS.map((ep) => (
                  <div className="form-check mb-0" key={ep}>
                    <input type="checkbox" className="form-check-input" id={`ep-${ep}`} checked={form.epocas.includes(ep)} onChange={() => alternarEpoca(ep)} />
                    <label className="form-check-label small" htmlFor={`ep-${ep}`}>{ep}</label>
                  </div>
                ))}
              </div>
            </fieldset>
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="p-bio" checked={form.biologico} onChange={mudar('biologico')} />
              <label className="form-check-label small" htmlFor="p-bio">Produção biológica</label>
            </div>
            <div>
              <label htmlFor="p-imagem" className="form-label small mb-1">Fotografia (JPEG, PNG ou WebP até 5 MB)</label>
              <input id="p-imagem" type="file" accept="image/jpeg,image/png,image/webp" className="form-control form-control-sm"
                onChange={(e) => setFicheiro(e.target.files[0] || null)} />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success btn-sm flex-fill">{aEditar ? 'Guardar alterações' : 'Criar produto'}</button>
              {aEditar && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={limpar}>Cancelar</button>}
            </div>
          </fieldset>
        </form>
      </div>
    </>
  );
}
