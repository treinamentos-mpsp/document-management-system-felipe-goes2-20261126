import { useRef, useState } from 'react';
import { ArrowUpRight, FileUp, LoaderCircle } from 'lucide-react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ userId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || !userId || uploading) return;
    setUploading(true);
    setMessage(null);
    try {
      await uploadDocument(file, userId);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage({ type: 'success', text: 'Documento enviado com sucesso.' });
      onUploaded();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <label className={`file-picker${!userId || uploading ? ' is-disabled' : ''}`}>
        <input ref={inputRef} type="file" disabled={!userId || uploading} onChange={(event) => { setFile(event.target.files[0] || null); setMessage(null); }} />
        <span className="upload-icon"><FileUp size={22} /></span>
        <span className="file-picker-title">{file ? file.name : 'Selecionar arquivo'}</span>
        <span className="file-picker-hint">{file ? 'Clique para trocar' : 'Escolha um arquivo do dispositivo'}</span>
      </label>
      <button className="upload-button" type="submit" disabled={!userId || !file || uploading}>
        {uploading ? 'Enviando...' : 'Enviar documento'} {uploading ? <LoaderCircle className="spinner" size={17} /> : <ArrowUpRight size={17} />}
      </button>
      {!userId && <p className="upload-note">Identifique-se para enviar documentos.</p>}
      {message && <p className={`feedback ${message.type}`} role="status">{message.text}</p>}
    </form>
  );
}