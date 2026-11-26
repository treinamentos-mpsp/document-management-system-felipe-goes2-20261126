import { useState } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ userId, documents, loading, error }) {
  const [message, setMessage] = useState(null);
  if (!userId) return <div className="empty-state"><span className="empty-icon"><FolderOpen size={24} /></span><h3>Seu espaço começa aqui</h3><p>Identifique-se para acessar seus documentos.</p></div>;
  if (loading) return <div className="empty-state" role="status"><p>Carregando documentos...</p></div>;
  if (error) return <div className="empty-state"><p className="feedback error" role="alert">{error}</p></div>;
  if (!documents.length) return <div className="empty-state"><span className="empty-icon"><FolderOpen size={24} /></span><h3>Nenhum documento ainda</h3><p>Os arquivos enviados aparecerão aqui.</p></div>;

  return (
    <div className="document-list">
      {message && <p className={`list-feedback feedback ${message.type}`} role="status">{message.text}</p>}
      <div className="list-header"><span>NOME</span><span>DATA DE ENVIO</span><span>TAMANHO</span><span className="sr-only">Ação</span></div>
      <ul>
        {documents.map((document) => (
          <li className="document-row" key={document.id}>
            <div className="document-name"><span className="document-icon"><FileText size={19} /></span><div><strong title={document.originalName}>{document.originalName}</strong><span>{document.mimeType}</span></div></div>
            <span className="document-date">{dateFormatter.format(new Date(document.uploadedAt))}</span>
            <span className="document-size">{formatSize(document.size)}</span>
            <DownloadButton document={document} userId={userId} onResult={setMessage} />
          </li>
        ))}
      </ul>
    </div>
  );
}