// Só deixa passar utilizadores autenticados (e, se indicado, com um dos papéis)
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RotaProtegida({ papeis = [] }) {
  const { utilizador } = useAuth();
  const location = useLocation();

  if (!utilizador) return <Navigate to="/login" state={{ de: location.pathname }} replace />;
  if (papeis.length && !papeis.includes(utilizador.papel)) return <Navigate to="/" replace />;
  return <Outlet />;
}
