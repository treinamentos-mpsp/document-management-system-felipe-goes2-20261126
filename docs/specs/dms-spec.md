# Especificação - Document Management System

> Especificação derivada de [spec-template.md](./spec-template.md). Documento de
> planejamento: não contém implementação de backend nem de frontend.

## 1. Objetivo

Entregar uma aplicação web que permita a usuários enviar, listar e baixar
documentos, com armazenamento local no servidor e metadados mantidos em memória
nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (cada documento pertence a um dono)

### Fora do escopo

- Armazenamento externo ou em nuvem (S3, Google Drive etc.)
- Versionamento de documentos
- Autenticação completa (login, senha, tokens); a identificação do usuário é simplificada nesta fase
- Persistência de metadados em banco de dados
- Exclusão, edição ou compartilhamento de documentos
- Pré-visualização de conteúdo

## 3. Requisitos funcionais

| ID    | Requisito                                                                                    |
| ----- | -------------------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento (arquivo único por requisição)                            |
| RF-02 | O usuário pode listar os documentos enviados                                                 |
| RF-03 | O usuário pode baixar um documento pelo identificador                                        |
| RF-04 | O sistema registra o dono do documento no momento do upload                                  |
| RF-05 | A listagem exibe apenas os documentos do usuário identificado na requisição                  |
| RF-06 | O download de um documento de outro usuário é negado (HTTP 404, para não revelar existência) |
| RF-07 | O sistema rejeita uploads sem arquivo ou acima do tamanho máximo configurado                 |
| RF-08 | O frontend exibe mensagens de erro e de sucesso para upload, listagem e download             |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                   |
| ------ | ------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local em `backend/storage` via `multer` com `diskStorage`  |
| RNF-02 | Metadados mantidos em memória nesta fase (perdidos ao reiniciar o servidor)                 |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor)                                          |
| RNF-04 | Backend com Clean Architecture simples: `routes -> controllers -> services -> repositories` |
| RNF-05 | Nenhum serviço externo de armazenamento ou upload de terceiros                              |
| RNF-06 | Erros tratados nos limites do sistema (entrada HTTP, leitura e escrita de arquivos)         |
| RNF-07 | Testes do backend com o runner nativo `node:test`                                           |
| RNF-08 | Stack: Node.js + Express (CommonJS) no backend; React + Vite (ESM) no frontend; JavaScript puro |

### Variáveis de ambiente

| Variável                | Padrão                   | Descrição                             |
| ----------------------- | ------------------------ | ------------------------------------- |
| `PORT`                  | `3000`                   | Porta HTTP do backend                 |
| `STORAGE_DIR`           | `backend/storage`        | Pasta de gravação dos arquivos        |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` (10 MB)       | Tamanho máximo de upload em bytes     |

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição                                              |
| ------------ | ------ | ------------------------------------------------------ |
| id           | string | Identificador único do documento (UUID)                |
| originalName | string | Nome original do arquivo enviado                       |
| storedName   | string | Nome do arquivo gravado no `STORAGE_DIR` (uso interno) |
| mimeType     | string | Tipo MIME informado no upload                          |
| size         | number | Tamanho em bytes                                       |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                         |
| owner        | string | Identificador do usuário dono                          |

Observações:

- `storedName` não é exposto nas respostas da API.
- Os metadados vivem em um repositório em memória (Map por `id`). Os arquivos
  permanecem no disco após reinício, mas sem metadados correspondentes até a
  fase de persistência.

## 6. Contratos de API

Todas as rotas são servidas pelo backend. No frontend, as chamadas usam o
prefixo `/api`, removido pelo proxy do Vite (ex.: `/api/upload` -> `/upload`).

### Identificação do usuário (simplificada)

- Cabeçalho `X-User-Id` com o identificador do usuário.
- Ausente ou vazio: resposta HTTP 400.
- Premissa a validar: esse mecanismo é provisório e não é autenticação.

### POST /upload

- Entrada: `multipart/form-data` com o campo `file` (arquivo único) e o cabeçalho `X-User-Id`.
- Sucesso: HTTP 201

```json
{
  "id": "3f2c1a9e-7b1d-4c2e-9a55-0e1f4b8d2c11",
  "originalName": "contrato.pdf",
  "mimeType": "application/pdf",
  "size": 204800,
  "uploadedAt": "2026-11-26T18:00:00.000Z",
  "owner": "user-123"
}
```

- Erros:
  - 400: campo `file` ausente ou cabeçalho `X-User-Id` ausente
  - 413: arquivo acima de `MAX_UPLOAD_SIZE_BYTES`
  - 500: falha ao gravar o arquivo

### GET /documents

- Entrada: cabeçalho `X-User-Id`.
- Sucesso: HTTP 200 com a lista de metadados dos documentos do usuário (pode ser vazia).

```json
[
  {
    "id": "3f2c1a9e-7b1d-4c2e-9a55-0e1f4b8d2c11",
    "originalName": "contrato.pdf",
    "mimeType": "application/pdf",
    "size": 204800,
    "uploadedAt": "2026-11-26T18:00:00.000Z",
    "owner": "user-123"
  }
]
```

- Erros: 400 se `X-User-Id` estiver ausente.

### GET /documents/:id/download

- Entrada: parâmetro `id` e cabeçalho `X-User-Id`.
- Sucesso: HTTP 200 com o conteúdo binário, `Content-Type` igual ao `mimeType`
  e `Content-Disposition: attachment; filename="<originalName>"`.
- Erros:
  - 400: cabeçalho `X-User-Id` ausente
  - 404: documento inexistente ou pertencente a outro usuário
  - 500: arquivo não encontrado no disco ou falha de leitura

### Formato de erro (comum)

```json
{ "error": "Mensagem em português descrevendo o problema" }
```

## 7. Decisões arquiteturais

- **Backend** em Clean Architecture simples, com fluxo de dependência
  `routes -> controllers -> services -> repositories`. Camadas internas não
  conhecem camadas externas.
  - `routes/`: define endpoints e delega aos controllers
  - `controllers/`: trata HTTP (entrada, saída, validação básica)
  - `services/`: regras de negócio (ex.: dono do documento, filtragem por usuário, limite de tamanho)
  - `repositories/`: persistência (memória nesta fase; arquivos via `diskStorage`)
- **Upload** com `multer` e `diskStorage` gravando em `STORAGE_DIR`. Nome de
  arquivo gerado pelo servidor (UUID), preservando a extensão, para evitar
  colisões e path traversal; o nome original fica apenas nos metadados.
- **Frontend** em React + Vite, organizado em `components/`, `pages/` e `services/`
  (camada de acesso à API com `fetch` via `/api`). Componentes funcionais com Hooks.
- **Princípios**: SOLID, DRY, KISS, YAGNI. Sem overengineering.
- **Dependências**: preferir as já presentes no `package.json`; `multer` é a
  dependência de upload.

### Riscos e pontos em aberto

| Risco / dúvida                                 | Tratamento proposto                                               |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| Metadados em memória são perdidos ao reiniciar | Aceito nesta fase; persistência fica para evolução                |
| `X-User-Id` não é autenticação                 | Documentado como provisório; validar com o time antes de produção |
| Arquivos órfãos após reinício                  | Aceito nesta fase; limpeza fica para evolução                     |
| Tipos de arquivo permitidos não definidos      | Assumido: qualquer tipo, com limite de tamanho; validar           |
| Tamanho máximo padrão (10 MB)                  | Assumido; ajustável via `MAX_UPLOAD_SIZE_BYTES`                   |

## 8. Plano de execução

Cada etapa é de planejamento; a implementação só começa após aprovação desta spec.

1. **Estrutura do projeto**: criar as pastas `backend/` e `frontend/`, com
   `package.json` de cada um e `backend/storage` no `.gitignore`.
   - Critério: estrutura criada, `.gitignore` ignora `backend/storage`.
2. **Configuração**: módulo de leitura das variáveis de ambiente com os padrões da seção 4.
   - Critério: valores padrão aplicados quando as variáveis não estão definidas.
3. **Repositório de documentos (em memória)**: operações de criação, listagem
   por dono e busca por `id`.
   - Critério: testes `node:test` cobrem criação, filtragem por dono e busca inexistente.
4. **Armazenamento de arquivos**: configuração do `multer` com `diskStorage`,
   nome gerado por UUID, limite de tamanho.
   - Critério: arquivo gravado em `STORAGE_DIR`; excesso de tamanho gera 413.
5. **Serviço de documentos**: regras de upload, listagem e download (dono,
   existência, leitura do arquivo).
   - Critério: download de outro usuário retorna 404 na camada de serviço.
6. **Controllers e rotas**: `POST /upload`, `GET /documents`,
   `GET /documents/:id/download` com tratamento de erro no formato da seção 6.
   - Critério: cada endpoint responde com status e corpo especificados, incluindo erros.
7. **Montagem da aplicação Express**: `app` com rotas, handler de erro
   centralizado e `server` lendo `PORT`.
   - Critério: `GET /documents` responde 200 com lista vazia em instância nova.
8. **Frontend - camada de API**: funções `fetch` para `/api/upload`,
   `/api/documents` e `/api/documents/:id/download`, enviando `X-User-Id`.
   - Critério: funções tratam respostas de erro e propagam a mensagem.
9. **Frontend - componentes e páginas**: formulário de upload, tabela de
   documentos e ação de download, com mensagens de sucesso e erro (RF-08).
   - Critério: fluxo upload -> listagem -> download funciona com o backend rodando.
10. **Proxy e ambiente de desenvolvimento**: configurar o proxy `/api` no Vite
    e documentar a execução local no README.
    - Critério: frontend acessa o backend via `/api` sem CORS.
11. **Validação final**: executar a suíte `node:test` do backend e testar o
    fluxo manualmente.
    - Critério: todos os requisitos RF-01 a RF-08 verificados.

### Dependências entre etapas

- Etapa 2 depende da 1.
- Etapas 3 e 4 dependem da 2.
- Etapa 5 depende das 3 e 4.
- Etapa 6 depende da 5.
- Etapa 7 depende da 6.
- Etapa 8 depende da 7.
- Etapa 9 depende da 8.
- Etapa 10 depende da 9.
- Etapa 11 depende da 10.