// Linha temporal dos 4 estados de uma encomenda (cor + texto, nunca só cor)
import Icone from './Icone.jsx';
import { ESTADOS } from '../utils/formato.js';

export default function EstadoEncomenda({ estado }) {
  const atual = ESTADOS.indexOf(estado);
  return (
    <ol className="linha-temporal" aria-label={`Estado da encomenda: ${estado}`}>
      {ESTADOS.map((e, i) => (
        <li key={e} className={`${i <= atual ? 'feito' : ''} ${i === atual && i < ESTADOS.length - 1 ? 'atual' : ''}`}
          aria-current={i === atual ? 'step' : undefined}>
          <span className="marca-passo">{i <= atual && <Icone nome="certo" tamanho={12} />}</span>
          <span className="text-capitalize">{e}</span>
        </li>
      ))}
    </ol>
  );
}
