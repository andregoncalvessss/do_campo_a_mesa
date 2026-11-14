// Passo 2: routing no cliente e rotas protegidas por papel
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import NavInferior from './components/NavInferior.jsx';
import Notificacoes from './components/Notificacoes.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Produtores from './pages/Produtores.jsx';
import Produtor from './pages/Produtor.jsx';
import Leiloes from './pages/Leiloes.jsx';
import SalaLeilao from './pages/SalaLeilao.jsx';
import Login from './pages/Login.jsx';
import Registo from './pages/Registo.jsx';
import Carrinho from './pages/Carrinho.jsx';
import Encomendas from './pages/Encomendas.jsx';
import NaoEncontrado from './pages/NaoEncontrado.jsx';
import PainelProdutor from './pages/produtor/Painel.jsx';
import ProdutosProdutor from './pages/produtor/Produtos.jsx';
import NovoLeilao from './pages/produtor/NovoLeilao.jsx';
import PainelAdmin from './pages/admin/Painel.jsx';

export default function App() {
  return (
    <>
      <a href="#conteudo" className="visually-hidden-focusable btn btn-success m-2">Saltar para o conteúdo</a>
      <Navbar />
      <Notificacoes />
      <main id="conteudo" className="container-xl pagina">
        <Routes>
          {/* Visitante */}
          <Route path="/" element={<Catalogo />} />
          <Route path="/produtores" element={<Produtores />} />
          <Route path="/produtores/:id" element={<Produtor />} />
          <Route path="/leiloes" element={<Leiloes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registo" element={<Registo />} />

          {/* Qualquer utilizador autenticado pode assistir; só compradores licitam */}
          <Route element={<RotaProtegida />}>
            <Route path="/leiloes/:id" element={<SalaLeilao />} />
          </Route>

          {/* Comprador */}
          <Route element={<RotaProtegida papeis={['comprador']} />}>
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/encomendas" element={<Encomendas />} />
          </Route>

          {/* Produtor */}
          <Route element={<RotaProtegida papeis={['produtor']} />}>
            <Route path="/produtor" element={<PainelProdutor />} />
            <Route path="/produtor/produtos" element={<ProdutosProdutor />} />
            <Route path="/produtor/leiloes/novo" element={<NovoLeilao />} />
          </Route>

          {/* Administrador */}
          <Route element={<RotaProtegida papeis={['admin']} />}>
            <Route path="/admin" element={<PainelAdmin />} />
          </Route>

          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
      </main>
      <footer className="rodape">
        <div className="container-xl">Do Campo à Mesa · Trabalho prático de Desenvolvimento Web e para a Cloud</div>
      </footer>
      <NavInferior />
    </>
  );
}
