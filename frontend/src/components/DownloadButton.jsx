import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { downloadDocument, downloadDocumentToFile } from '../services/documentApi.js';

export default function DownloadButton({ document, userId, onResult }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    onResult(null);
    try {
      if (typeof window.showSaveFilePicker === 'function') {
        const fileHandle = await window.showSaveFilePicker({ suggestedName: document.originalName });
        await downloadDocumentToFile(document.id, userId, fileHandle);
        onResult({ type: 'success', text: 'Download concluído com sucesso.' });
        return;
      }
      const blob = await downloadDocument(document.id, userId);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onResult({ type: 'success', text: 'Download iniciado com sucesso.' });
    } catch (downloadError) {
      if (downloadError.name !== 'AbortError') onResult({ type: 'error', text: downloadError.message });
    } finally {
      setDownloading(false);
    }
  }

  return <button className="icon-button" type="button" onClick={handleDownload} disabled={downloading} title={`Baixar ${document.originalName}`} aria-label={`Baixar ${document.originalName}`}>{downloading ? <LoaderCircle className="spinner" size={17} /> : <Download size={17} />}</button>;
}