import { Fragment, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { INICIO, useAuth } from '../context/AuthContext.jsx';

export default function Registo() {
  const { registar } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [dados, setDados] = useState({
    papel: params.get('papel') === 'produtor' ? 'produtor' : 'comprador',
    nome: '', email: '', password: '', nomeExploracao: '', localidade: '', descricao: ''
  });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const mudar = (campo) => (e) => setDados((d) => ({ ...d, [campo]: e.target.value }));
  const souProdutor = dados.papel === 'produtor';

  async function submeter(e) {
    e.preventDefault();
    setAEnviar(true);
    try {
      const { nomeExploracao, localidade, descricao, ...base } = dados;
      const u = await registar(souProdutor ? { ...base, produtor: { nomeExploracao, localidade, descricao } } : base);
      navigate(INICIO[u.papel] || '/', { replace: true });
    } catch (err) {
      setErro(err.message);
      setAEnviar(false);
    }
  }

  return (
    <div className="formulario-estreito">
      <h1 className="h2 mb-3">Criar conta</h1>
      <form className="cartao d-grid gap-3" onSubmit={submeter}>
        {erro && <div className="alert alert-danger mb-0" role="alert">{erro}</div>}
        <fieldset>
          <legend className="form-label fs-6">Tipo de conta</legend>
          <div className="btn-group w-100" role="group">
            {[['comprador', 'Comprador'], ['produtor', 'Produtor']].map(([valor, texto]) => (
              <Fragment key={valor}>
                <input type="radio" className="btn-check" name="papel" id={`papel-${valor}`} value={valor}
                  checked={dados.papel === valor} onChange={mudar('papel')} />
                <label className="btn btn-outline-success" htmlFor={`papel-${valor}`}>{texto}</label>
              </Fragment>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="nome" className="form-label">{souProdutor ? 'Nome do responsável' : 'Nome'}</label>
          <input id="nome" className="form-control" autoComplete="name" value={dados.nome} onChange={mudar('nome')} required maxLength={100} />
        </div>
        <div>
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" value={dados.email} onChange={mudar('email')} required />
        </div>
        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <input id="password" type="password" className="form-control" autoComplete="new-password" minLength={8}
            aria-describedby="ajuda-password" value={dados.password} onChange={mudar('password')} required />
          <div id="ajuda-password" className="form-text">Pelo menos 8 caracteres.</div>
        </div>
        {souProdutor && (
          <>
            <div>
              <label htmlFor="nomeExploracao" className="form-label">Nome da exploração</label>
              <input id="nomeExploracao" className="form-control" value={dados.nomeExploracao} onChange={mudar('nomeExploracao')} required maxLength={100} />
            </div>
            <div>
              <label htmlFor="localidade" className="form-label">Localidade</label>
              <input id="localidade" className="form-control" value={dados.localidade} onChange={mudar('localidade')} required maxLength={100} />
            </div>
            <div>
              <label htmlFor="descricao" className="form-label">O que produz</label>
              <textarea id="descricao" className="form-control" rows="3" maxLength={1000} value={dados.descricao} onChange={mudar('descricao')} />
            </div>
            <p className="small texto-secundario mb-0">
              A conta de produtor fica a aguardar validação do administrador antes de poder publicar produtos e leilões.
            </p>
          </>
        )}
        <button type="submit" className="btn btn-success" disabled={aEnviar}>{aEnviar ? 'A criar…' : 'Criar conta'}</button>
        <p className="small mb-0">Já tem conta? <Link to="/login">Entrar</Link></p>
      </form>
    </div>
  );
}
