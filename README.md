# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey felipegoesmpsp!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-mpsp/document-management-system-felipe-goes2-20261126/issues/1)

---

## Executando o DMS

Instale as dependências em `backend` e `frontend` com `npm install`. Execute
`npm start` no backend e `npm run dev` no frontend. O Vite encaminha `/api`
para o backend na porta 3000 durante o desenvolvimento.

O backend usa `PORT` (padrão `3000`), `STORAGE_DIR` (padrão
`backend/storage`), `MAX_UPLOAD_SIZE_BYTES` (padrão 10 MB) e
`MAX_UPLOADS_PER_WINDOW` (padrão 100 requisições por IP a cada 15 minutos).
Uploads também aceitam no máximo oito campos de texto e dez partes multipart.

Para uma publicação estática, execute `npm run build` no frontend e configure
o servidor web para encaminhar `/api/` ao backend, removendo o prefixo `/api`.
O proxy do Vite não é aplicado automaticamente à versão compilada. Proteja o
acesso externo com HTTPS e controle de acesso adequado.

O cabeçalho `X-User-Id` é uma identificação provisória, não autenticação.
Metadados e contadores de limite de taxa ficam na memória de cada processo e
são perdidos ao reiniciar; arquivos existentes não são recuperados nem
excluídos automaticamente. Em múltiplas instâncias, o limite não é compartilhado.
Configure limites de taxa no proxy e cota do volume de armazenamento, pois o
limite por arquivo não impede o esgotamento do disco. Atrás de proxy reverso,
configure o endereço IP confiável com cuidado para evitar rate limiting
incorreto ou cabeçalhos de origem falsificados.

Execute os testes com `npm test` em `backend` e com
`node --test frontend/test/documentApi.test.js` na raiz do projeto.

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

