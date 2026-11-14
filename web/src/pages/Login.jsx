import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { INICIO, useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dados, setDados] = useState({ email: '', password: '' });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const mudar = (campo) => (e) => setDados((d) => ({ ...d, [campo]: e.target.value }));

  async function submeter(e) {
    e.preventDefault();
    setAEnviar(true);
    try {
      const u = await entrar(dados.email, dados.password);
      // Volta à página pedida antes do login, ou à página inicial do papel
      navigate(location.state?.de || INICIO[u.papel] || '/', { replace: true });
    } catch (err) {
      setErro(err.message);
      setAEnviar(false);
    }
  }

  return (
    <div className="formulario-estreito">
      <h1 className="h2 mb-3">Entrar</h1>
      {location.state?.de && <div className="alert alert-info small" role="status">Inicie sessão para continuar.</div>}
      <form className="cartao d-grid gap-3" onSubmit={submeter}>
        {erro && <div className="alert alert-danger mb-0" role="alert">{erro}</div>}
        <div>
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" value={dados.email} onChange={mudar('email')} required />
        </div>
        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <input id="password" type="password" className="form-control" autoComplete="current-password" value={dados.password} onChange={mudar('password')} required />
        </div>
        <button type="submit" className="btn btn-success" disabled={aEnviar}>{aEnviar ? 'A entrar…' : 'Entrar'}</button>
        <p className="small mb-0">Ainda não tem conta? <Link to="/registo">Registar</Link></p>
      </form>
    </div>
  );
}
