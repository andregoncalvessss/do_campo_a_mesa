// Barra de navegação inferior, só no telemóvel (escondida a partir de lg por CSS)
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import Icone from './Icone.jsx';

export default function NavInferior() {
  const { utilizador } = useAuth();
  const { numArtigos } = useCarrinho();
  const papel = utilizador?.papel;

  const itens = [
    ['/', 'casa', 'Início'],
    ['/leiloes', 'martelo', 'Leilões'],
    ...(papel === 'comprador' ? [['/carrinho', 'carrinho', 'Carrinho'], ['/encomendas', 'caixa', 'Encomendas']] : []),
    ...(papel === 'produtor' ? [['/produtor', 'grelha', 'Painel'], ['/produtor/produtos', 'caixa', 'Produtos']] : []),
    ...(papel === 'admin' ? [['/admin', 'escudo', 'Admin']] : []),
    ...(!papel ? [['/produtores', 'pessoas', 'Produtores'], ['/login', 'utilizador', 'Entrar']] : [])
  ];

  return (
    <nav className="nav-inferior" aria-label="Navegação rápida">
      {itens.map(([para, icone, texto]) => (
        <NavLink key={para} to={para} end>
          <Icone nome={icone} tamanho={20} />
          {texto}
          {para === '/carrinho' && numArtigos > 0 && <span className="contador">{numArtigos}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
