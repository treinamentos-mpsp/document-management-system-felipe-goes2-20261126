import { useEffect, useState } from 'react';
import { ArrowRight, Files, FolderOpen, RefreshCw } from 'lucide-react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [userInput, setUserInput] = useState('');
  const [userId, setUserId] = useState('');
  const [revision, setRevision] = useState(0);
  const [listing, setListing] = useState({ owner: '', documents: [], loading: false, error: '' });

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    setListing({ owner: userId, documents: [], loading: true, error: '' });
    listDocuments(userId)
      .then((documents) => {
        if (active) setListing({ owner: userId, documents, loading: false, error: '' });
      })
      .catch((error) => {
        if (active) setListing({ owner: userId, documents: [], loading: false, error: error.message });
      });
    return () => { active = false; };
  }, [userId, revision]);

  function selectUser(event) {
    event.preventDefault();
    const nextUser = userInput.trim();
    if (!nextUser) return;
    setUserInput(nextUser);
    if (nextUser === userId) setRevision((value) => value + 1);
    else setUserId(nextUser);
  }

  const currentListing = listing.owner === userId ? listing : { documents: [], loading: Boolean(userId), error: '' };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label="Arquivo, início"><span className="brand-mark"><Files size={19} /></span> arquivo<span className="brand-dot">.</span></a>
          <span className="topbar-label">GESTÃO DE DOCUMENTOS</span>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow"><span /> ÁREA DE TRABALHO</p>
            <h1>Seus documentos<span>.</span></h1>
            <p className="page-subtitle">Tudo o que importa, em um só lugar.</p>
          </div>
          <div className="workspace-tag"><FolderOpen size={16} /> Espaço pessoal</div>
        </div>

        <section className="identity-bar" aria-labelledby="identity-title">
          <div className="identity-copy">
            <span className="section-index">01</span>
            <div><h2 id="identity-title">Identificação</h2><p>{userId ? `Visualizando como ${userId}` : 'Selecione seu espaço de documentos.'}</p></div>
          </div>
          <form className="identity-form" onSubmit={selectUser}>
            <label className="sr-only" htmlFor="user-id">Identificador do usuário</label>
            <input id="user-id" value={userInput} onChange={(event) => setUserInput(event.target.value)} placeholder="Seu identificador" required />
            <button type="submit" disabled={!userInput.trim()}>Acessar <ArrowRight size={16} /></button>
          </form>
        </section>

        <div className="content-grid">
          <section className="documents-section" aria-labelledby="documents-title">
            <div className="section-heading">
              <div><p className="section-kicker">SUA BIBLIOTECA <span>/ 02</span></p><h2 id="documents-title">Documentos <span className="count">{currentListing.documents.length}</span></h2></div>
              <button className="icon-button refresh-button" type="button" title="Atualizar lista" aria-label="Atualizar lista" disabled={!userId || currentListing.loading} onClick={() => setRevision((value) => value + 1)}><RefreshCw size={17} /></button>
            </div>
            <DocumentList key={userId} userId={userId} {...currentListing} />
          </section>

          <aside className="upload-section" aria-labelledby="upload-title">
            <p className="section-kicker">NOVO DOCUMENTO <span>/ 03</span></p>
            <h2 id="upload-title">Adicionar arquivo</h2>
            <p className="upload-description">Envie um documento para seu espaço pessoal.</p>
            <UploadComponent key={userId} userId={userId} onUploaded={() => setRevision((value) => value + 1)} />
          </aside>
        </div>
      </main>
      <footer className="footer"><span>ARQUIVO <span className="brand-dot">.</span> DMS</span><span>Gestão de documentos</span></footer>
    </div>
  );
}
