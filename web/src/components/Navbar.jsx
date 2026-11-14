// Passo 1: barra de navegação responsiva do Bootstrap; os links mudam conforme o papel
import { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import Icone from './Icone.jsx';

const LINKS = {
  visitante: [['/', 'Produtos'], ['/produtores', 'Produtores'], ['/leiloes', 'Leilões']],
  comprador: [['/', 'Produtos'], ['/produtores', 'Produtores'], ['/leiloes', 'Leilões'], ['/encomendas', 'Encomendas']],
  produtor: [['/', 'Produtos'], ['/leiloes', 'Leilões'], ['/produtor', 'Painel'], ['/produtor/produtos', 'Os meus produtos']],
  admin: [['/', 'Produtos'], ['/leiloes', 'Leilões'], ['/admin', 'Administração']]
};

export default function Navbar() {
  const { utilizador, sair } = useAuth();
  const { numArtigos } = useCarrinho();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const links = LINKS[utilizador?.papel || 'visitante'];

  // Fecha o menu colapsável ao mudar de página (telemóvel)
  useEffect(() => { document.getElementById('menu')?.classList.remove('show'); }, [pathname]);

  return (
    <header className="cabecalho">
      <nav className="navbar navbar-expand-lg container-xl" aria-label="Navegação principal">
        <Link to="/" className="navbar-brand marca">
          <Icone nome="folha" tamanho={26} /> Do Campo à Mesa
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#menu" aria-controls="menu" aria-expanded="false" aria-label="Abrir menu">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="menu">
          <ul className="navbar-nav me-auto">
            {links.map(([para, texto]) => (
              <li className="nav-item" key={para}>
                <NavLink to={para} end className="nav-link">{texto}</NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-2 py-2 py-lg-0">
            {utilizador?.papel === 'comprador' && (
              <Link to="/carrinho" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                aria-label={`Carrinho, ${numArtigos} artigos`}>
                <Icone nome="carrinho" /> <span className="contador">{numArtigos}</span>
              </Link>
            )}
            {utilizador ? (
              <>
                <span className="small fw-semibold">{utilizador.nome}</span>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { sair(); navigate('/'); }}>Sair</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-secondary btn-sm">Entrar</Link>
                <Link to="/registo" className="btn btn-success btn-sm">Registar</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
