import { Link } from 'react-router-dom';

export default function NaoEncontrado() {
  return (
    <div className="text-center py-5">
      <p className="rotulo rotulo--terracota">Erro 404</p>
      <h1 className="h2">Página não encontrada</h1>
      <p className="texto-secundario">O endereço que procura não existe ou foi movido.</p>
      <Link to="/" className="btn btn-success">Voltar ao catálogo</Link>
    </div>
  );
}
