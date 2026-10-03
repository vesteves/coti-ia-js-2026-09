# Parnaioca IA

Projeto do curso **Agentes de IA com JavaScript**, da **COTI Informática**, com o professor **Vitor Esteves**.

A aplicação combina uma API da Pousada Parnaioca com análise estruturada de avaliações, um chat com ferramentas e aprovação humana de cancelamentos, busca documental com RAG e exemplos de integração via MCP e Agents SDK. Os arquivos JSON em `src/data` representam um banco de dados de demonstração.

## Índice

- [Requisitos e instalação](#requisitos-e-instalação)
- [Como obter uma API key da OpenAI](#como-obter-uma-api-key-da-openai)
- [Como preencher o .env](#como-preencher-o-env)
- [Como popular as bases de conhecimento](#como-popular-as-bases-de-conhecimento)
- [Como executar o projeto](#como-executar-o-projeto)
- [Todos os scripts do package.json](#todos-os-scripts-do-packagejson)
- [Exemplos de RAG](#exemplos-de-rag)
- [Exemplos de MCP e agentes](#exemplos-de-mcp-e-agentes)
- [Rotas e exemplos de requisição](#rotas-e-exemplos-de-requisição)
- [Guia do aluno](#guia-do-aluno)
- [Problemas comuns](#problemas-comuns)

## Requisitos e instalação

- **Node.js 24 ou superior**, incluindo o suporte a `node:sqlite` usado no exemplo de banco de dados.
- **npm**.
- Para os recursos de IA: uma API key da OpenAI e acesso a um modelo compatível com os exemplos.
- Para o chat e os exemplos de RAG: bases de conhecimento criadas na etapa de ingestão.

Execute os comandos na raiz deste repositório:

```bash
node --version
npm --version
npm install
```

## Como obter uma API key da OpenAI

1. Acesse a [OpenAI Platform](https://platform.openai.com/) e entre na sua conta ou crie uma conta.
2. Selecione o projeto em que deseja executar os exemplos.
3. Abra a página de [API keys](https://platform.openai.com/api-keys) e use a opção de criar uma nova chave secreta, normalmente chamada **Create new secret key**. Se não puder criar chaves, confira as permissões com o administrador do projeto.
4. Dê um nome à chave, como `parnaioca-curso`, e copie o valor gerado para o campo `OPENAI_API_KEY` do seu `.env`.
5. Confira as configurações de **Billing**, os limites e o uso no painel da Platform para que as chamadas possam ser realizadas pela sua conta. Chamadas de IA e recursos de busca/armazenamento podem gerar custos.

A chave identifica sua aplicação ao acessar a API. Mantenha-a no ambiente do servidor; não a coloque no HTML, em exemplos públicos ou em commits. Se ela for exposta, revogue-a no painel e gere outra. Veja o [quickstart oficial](https://developers.openai.com/api/docs/quickstart) e as [orientações de configuração e proteção de chaves](https://developers.openai.com/api/docs/guides/production-best-practices).

**Não confunda a API key da OpenAI com os tokens de demonstração do chat.** A chave é usada pelo servidor para chamar a OpenAI; os tokens `guest-demo-token`, `employee-demo-token` e `manager-demo-token` identificam perfis na API local.

## Como preencher o .env

Na primeira configuração, copie o arquivo de exemplo:

```bash
# macOS / Linux
cp .env.example .env
```

No PowerShell do Windows:

```powershell
Copy-Item .env.example .env
```

Se já tiver um `.env`, edite o arquivo existente para preservar seus valores. Ele deve ficar na raiz do projeto, ao lado de `package.json`. Os scripts de IA usam `dotenv/config` para carregá-lo.

Preencha inicialmente a chave e o modelo; deixe os IDs vazios até executar a ingestão:

```dotenv
OPENAI_API_KEY=sua-chave-secreta-da-openai
OPENAI_MODEL=gpt-5.6-luna
OPENAI_PUBLIC_VECTOR_STORE_ID=
OPENAI_INTERNAL_VECTOR_STORE_ID=

# Opcional: porta da API da pousada
PORT=8000
```

| Variável                          | Para que serve                                         | Como preencher                                                                                                             |
| --------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                  | Autentica as chamadas à OpenAI.                        | Use a chave criada na Platform.                                                                                            |
| `OPENAI_MODEL`                    | Define o modelo dos exemplos de geração e dos agentes. | O projeto usa `gpt-5.6-luna` como valor padrão; substitua por um modelo compatível disponível na sua conta, se necessário. |
| `OPENAI_PUBLIC_VECTOR_STORE_ID`   | Identifica a base de documentos públicos da pousada.   | Copie o ID impresso por `npm run rag:ingest`.                                                                              |
| `OPENAI_INTERNAL_VECTOR_STORE_ID` | Identifica a base do manual interno de funcionários.   | Copie o outro ID impresso pela ingestão.                                                                                   |
| `PORT`                            | Define a porta da API Express.                         | Opcional; o padrão é `8000`. Não altera a porta do MCP HTTP nem a do guia.                                                 |

Os nomes dos modelos do curso não garantem disponibilidade em toda conta. Escolha um modelo que suporte os recursos utilizados, como Responses, ferramentas, saídas estruturadas e `file_search`.

O `.env` está no `.gitignore` e não deve ser versionado. Os valores acima são exemplos: não use os textos de demonstração como credenciais ou IDs reais.

## Como popular as bases de conhecimento

Com `OPENAI_API_KEY` preenchida, execute:

```bash
npm run rag:ingest
```

O script envia os PDFs da pasta `docs` à OpenAI e cria dois **vector stores**, isto é, bases pesquisáveis de documentos:

| Base    | Documentos                                                                |
| ------- | ------------------------------------------------------------------------- |
| Pública | `cancelamento.pdf`, `politica-hospedagem.pdf`, `passeios.pdf` e `faq.pdf` |
| Interna | `manual-funcionarios.pdf`                                                 |

A ingestão divide os documentos em trechos de até **800 tokens**, com **200 tokens de sobreposição**, aguarda o processamento e verifica falhas. Ao terminar, imprime algo semelhante a:

```dotenv
OPENAI_PUBLIC_VECTOR_STORE_ID=vs_id_da_base_publica
OPENAI_INTERNAL_VECTOR_STORE_ID=vs_id_da_base_interna
```

Copie **os IDs reais retornados** para os respectivos campos do `.env` e salve o arquivo. O script imprime os valores, mas não atualiza o `.env` automaticamente.

Cada execução de `rag:ingest` envia os arquivos novamente e cria novas bases. Reutilize os IDs já criados enquanto estiverem válidos. O código configura expiração dos vector stores após 30 dias sem atividade.

Os dados de hóspedes, quartos e reservas já estão em `src/data/*.json`; não é necessário executar uma carga de banco para iniciar a API. A ingestão popula somente as bases documentais do RAG.

## Como executar o projeto

A ordem para a primeira execução completa é:

1. Execute `npm install`.
2. Crie o `.env` e preencha `OPENAI_API_KEY` e `OPENAI_MODEL`.
3. Execute `npm run rag:ingest`.
4. Copie os dois IDs retornados para o `.env`.
5. Execute `npm run dev`.

### Desenvolvimento

```bash
npm run dev
```

Inicia a API e reinicia o processo ao salvar alterações em arquivos acompanhados pelo `tsx watch`. Após alterar o `.env`, reinicie o servidor para carregar os novos valores.

A API fica disponível em **http://localhost:8000**. Em outro terminal:

```bash
curl http://localhost:8000/health
```

A resposta deve conter `data.status` igual a `ok`.

**Na implementação atual, a API exige a chave e os dois IDs de vector store já na inicialização**, porque importa o agente de `src/tool-calling.ts`. Isso vale mesmo quando você pretende consultar apenas `/health` ou as rotas de dados.

### Execução sem observação de arquivos

```bash
npm start
```

Executa a mesma API em TypeScript, sem reiniciar automaticamente ao salvar. Use uma forma de execução da API por vez para evitar conflito de porta.

### Verificação e execução compilada

```bash
npm run typecheck
npm run build
npm run prod
```

`typecheck` verifica os tipos sem gerar arquivos. `build` compila para `dist`. `prod` executa `dist/index.js` e exige um build prévio e a mesma configuração de ambiente da API. Encerre o servidor anterior antes de iniciar outro na mesma porta.

Para trocar a porta, ajuste `PORT` no `.env`. Em macOS/Linux também é possível informar a variável no comando:

```bash
PORT=3000 npm start
```

Os servidores permanecem ativos até você encerrá-los com **Ctrl+C**. Scripts de consulta e demonstração terminam após imprimir o resultado.

## Todos os scripts do package.json

| Comando                                   | O que faz                                                                                                             | Requisitos / observações                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run dev`                             | Executa `src/index.ts` com `tsx watch`, reiniciando a API ao salvar alterações.                                       | Chave, modelo e IDs das duas bases configurados. Porta padrão `8000`.                                   |
| `npm start`                               | Executa `src/index.ts` com `tsx`, sem observar alterações.                                                            | Mesma configuração de `dev`.                                                                            |
| `npm run rag:ingest`                      | Envia os PDFs e cria as bases pública e interna, aguardando a indexação.                                              | Chave; imprime os IDs para copiar ao `.env`. Não precisa da API local ativa.                            |
| `npm run rag:search -- public "pergunta"` | Pesquisa diretamente uma base e imprime arquivo, score e trechos recuperados; não gera uma resposta final com LLM.    | Chave e ID da base escolhida. Use `internal` para pesquisar a base interna.                             |
| `npm run rag:answer -- "pergunta"`        | Gera uma resposta usando `file_search` na base pública e imprime também o output completo, com resultados da busca.   | Chave, modelo e ID da base pública.                                                                     |
| `npm run mcp:server`                      | Inicia o servidor MCP via stdio, expondo a ferramenta `find_guest` e o recurso de catálogo de quartos.                | Não precisa de chave de IA. Aguarda um cliente pelo protocolo; logs vão para stderr.                    |
| `npm run mcp:client`                      | Inicia seu próprio servidor MCP filho, lista ferramentas, busca João, demonstra uma chamada inválida e lê o catálogo. | Não precisa de chave nem de iniciar `mcp:server` separadamente.                                         |
| `npm run mcp:http-server`                 | Inicia o servidor MCP com transporte Streamable HTTP.                                                                 | Endpoint fixo `http://127.0.0.1:8001/mcp`; sem chave de IA.                                             |
| `npm run mcp:http-client`                 | Conecta ao MCP HTTP, lista ferramentas e executa `find_guest` para João.                                              | Requer `mcp:http-server` ativo em outro terminal; sem chave de IA.                                      |
| `npm run mcp:agent`                       | Executa um agente com loop manual: descobre ferramentas via MCP e encaminha as chamadas solicitadas pelo modelo.      | Chave e modelo; inicia o servidor stdio automaticamente. Não precisa dos vector stores.                 |
| `npm run framework:agents`                | Executa o assistente com o OpenAI Agents SDK e `MCPServerStdio`, imprimindo a resposta final.                         | Chave e modelo; inicia o servidor stdio automaticamente. Não precisa da API local ou dos vector stores. |
| `npm run example:api`                     | Consulta `/bedrooms` com `fetch` e imprime uma tabela de quartos.                                                     | API da pousada ativa; usa `http://localhost:8000`, fixo no exemplo.                                     |
| `npm run example:database`                | Cria SQLite em memória, carrega os JSON e consulta as reservas de João com joins e parâmetros vinculados.             | Node.js 24+; sem chave de IA. Fecha o banco e não persiste dados em disco.                              |
| `npm run typecheck`                       | Executa `tsc --noEmit` para verificar os tipos.                                                                       | Dependências instaladas; não chama a OpenAI.                                                            |
| `npm run build`                           | Compila TypeScript para JavaScript na pasta `dist`.                                                                   | Dependências instaladas; não inicia servidor nem chama a OpenAI.                                        |
| `npm run prod`                            | Executa a API compilada em `dist/index.js`.                                                                           | Build prévio; chave e IDs das duas bases configurados.                                                  |
| `npm run guia`                            | Serve `guia-aluno.html`, com navegação por aulas e assuntos.                                                          | Acesse `http://127.0.0.1:8002`; não precisa de `.env`, chave ou API da pousada ativa.                   |

O separador `--` encaminha os argumentos seguintes para o script. Coloque perguntas entre aspas para facilitar a leitura no terminal.

## Exemplos de RAG

Recuperar trechos de documentos públicos:

```bash
npm run rag:search -- public "Qual é a política de cancelamento?"
```

Recuperar trechos do manual interno:

```bash
npm run rag:search -- internal "Quais procedimentos os funcionários devem seguir?"
```

Gerar uma resposta apoiada nos documentos públicos:

```bash
npm run rag:answer -- "Qual é a política de cancelamento?"
```

Esses comandos acessam a OpenAI diretamente, sem precisar da API Express ativa. A busca interna no terminal é um exemplo para o desenvolvedor com acesso ao `.env`; ela não usa os tokens de perfil do chat.

## Exemplos de MCP e agentes

### Cliente local via stdio

```bash
npm run mcp:client
```

O cliente inicia o processo servidor e encerra a conexão ao terminar. O catálogo de quartos é um **resource** em `parnaioca://bedrooms/catalog`; a busca de hóspede é a **tool** `find_guest`.

### Cliente e servidor via HTTP

No terminal A:

```bash
npm run mcp:http-server
```

No terminal B:

```bash
npm run mcp:http-client
```

### Agente manual e Agents SDK

Com chave e modelo configurados, execute cada exemplo separadamente:

```bash
npm run mcp:agent
npm run framework:agents
```

Ambos perguntam se João está cadastrado e qual é seu e-mail. O primeiro explicita o loop de ferramentas; o segundo usa a orquestração do framework. Os exemplos MCP não incorporam automaticamente a autenticação e as permissões da rota `/chat`.

## Rotas e exemplos de requisição

| Método e rota                 | Função                                                                             | Autenticação                  |
| ----------------------------- | ---------------------------------------------------------------------------------- | ----------------------------- |
| `GET /health`                 | Verifica se o servidor está ativo.                                                 | Sem token.                    |
| `GET /guests`                 | Lista hóspedes.                                                                    | Sem token.                    |
| `GET /bedrooms`               | Lista quartos.                                                                     | Sem token.                    |
| `GET /reservations`           | Lista reservas com os objetos `guest` e `bedroom` relacionados.                    | Sem token.                    |
| `POST /chat`                  | Conversa com o agente, incluindo ferramentas e busca documental conforme o perfil. | Bearer token de demonstração. |
| `POST /reviews/analyze`       | Analisa sentimento, categoria e prioridade de uma avaliação com saída estruturada. | Sem token.                    |
| `POST /approvals/:approvalId` | Aprova ou rejeita uma solicitação de cancelamento.                                 | Bearer token de gerente.      |

As respostas usam o envelope `{ message, data }`. As reservas originais contêm `guestId` e `bedroomId`; a consulta de reservas popula os objetos relacionados.

### Consultas de dados

```bash
curl http://localhost:8000/guests
curl http://localhost:8000/bedrooms
curl http://localhost:8000/reservations
```

### Análise de avaliação

```bash
curl http://localhost:8000/reviews/analyze \
  -H "Content-Type: application/json" \
  -d '{"review":"A praia é linda, mas esperei duas horas para entrar no quarto."}'
```

A rota atual usa **`/reviews/analyze`**, no plural. `review` deve ser um texto não vazio. A resposta contém `sentiment`, `category` e `priority`.

### Chat e perfis

| Perfil                   | Token de demonstração | Acesso no agente do chat                                                                         |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| Hóspede (`guest`)        | `guest-demo-token`    | Consulta de quarto por ID e base documental pública.                                             |
| Funcionário (`employee`) | `employee-demo-token` | Consulta de hóspedes, reservas e quartos, solicitação de cancelamento e bases pública e interna. |
| Gerente (`manager`)      | `manager-demo-token`  | Mesmas ferramentas do funcionário; também pode decidir solicitações na rota de aprovação.        |

```bash
curl http://localhost:8000/chat \
  -H "Authorization: Bearer employee-demo-token" \
  -H "Content-Type: application/json" \
  -d '{"message":"Considerando 6 de setembro de 2026, qual é a próxima reserva de João Silva?","conversationId":"estudo-joao"}'
```

Para continuar a conversa, repita o token e o `conversationId`:

```bash
curl http://localhost:8000/chat \
  -H "Authorization: Bearer employee-demo-token" \
  -H "Content-Type: application/json" \
  -d '{"message":"Qual é o nome do quarto dessa reserva?","conversationId":"estudo-joao"}'
```

`message` e `conversationId` são obrigatórios. O histórico é separado por usuário e conversa, mas fica em memória e desaparece ao reiniciar o processo.

### Cancelamento com aprovação humana

Primeiro, o funcionário solicita o cancelamento pelo chat:

```bash
curl http://localhost:8000/chat \
  -H "Authorization: Bearer employee-demo-token" \
  -H "Content-Type: application/json" \
  -d '{"message":"Solicite o cancelamento da reservation-001 e informe o ID de aprovação.","conversationId":"cancelamento-estudo"}'
```

A ferramenta cria uma solicitação pendente; a reserva ainda não foi cancelada. Copie o ID retornado e envie a decisão como gerente:

```bash
curl http://localhost:8000/approvals/ID_RETORNADO \
  -H "Authorization: Bearer manager-demo-token" \
  -H "Content-Type: application/json" \
  -d '{"decision":"approved"}'
```

Para rejeitar uma solicitação pendente, use `"decision":"rejected"`. Somente `approved` altera a reserva para `cancelled`. Uma solicitação já decidida não pode ser decidida novamente.

Os tokens são fixos e as aprovações e alterações de reservas ficam em memória. As rotas públicas de consulta continuam sem autenticação. Esses comportamentos fazem parte da demonstração do curso.

Os exemplos de `curl` acima usam a sintaxe de shells como bash/zsh. No Windows, ajuste as aspas conforme seu terminal ou use um cliente HTTP com os mesmos headers e corpos JSON.

## Guia do aluno

```bash
npm run guia
```

Abra **http://127.0.0.1:8002** para estudar as aulas 00 a 08, com menu detalhado, busca de assuntos, práticas e sugestões de prompts. O material também está em [guia-aluno.html](guia-aluno.html).

O servidor do guia é independente da API da pousada. Encerre-o com **Ctrl+C**.

## Problemas comuns

| Sintoma                                                                              | Como resolver                                                                                                                                             |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY não foi configurada`                                                 | Preencha a chave no `.env` da raiz e execute o comando a partir da raiz do projeto. Reinicie processos já ativos.                                         |
| `OPENAI_PUBLIC_VECTOR_STORE_ID` ou `OPENAI_INTERNAL_VECTOR_STORE_ID` não configurado | Execute a ingestão com a chave preenchida, copie os dois IDs impressos para o `.env` e reinicie a API.                                                    |
| Modelo indisponível ou sem acesso                                                    | Ajuste `OPENAI_MODEL` para um modelo compatível habilitado na sua conta.                                                                                  |
| Erro de autenticação da OpenAI                                                       | Confira se a chave é válida, não foi revogada e pertence ao projeto com acesso aos recursos utilizados.                                                   |
| Erro de quota ou limite da OpenAI                                                    | Confira billing, uso e limites na Platform. Evite repetir a ingestão sem necessidade.                                                                     |
| Vector store não encontrado ou expirado                                              | Confira o ID e o projeto da chave. Se precisar criar novas bases, execute a ingestão e atualize os IDs.                                                   |
| `EADDRINUSE`                                                                         | A porta já está ocupada. Encerre o processo anterior; para a API, também é possível ajustar `PORT`. MCP HTTP e guia usam as portas fixas `8001` e `8002`. |
| Falha de conexão no `mcp:http-client`                                                | Inicie `npm run mcp:http-server` em outro terminal.                                                                                                       |
| Falha de conexão no `example:api`                                                    | Inicie a API na porta `8000`, usada pelo exemplo.                                                                                                         |
| `/chat` responde HTTP 401                                                            | Envie um dos Bearer tokens de demonstração; não envie a API key da OpenAI nessa requisição.                                                               |
| Aprovação responde HTTP 403                                                          | Use `manager-demo-token`; funcionário e hóspede não podem decidir solicitações.                                                                           |
| `prod` não encontra `dist/index.js`                                                  | Execute `npm run build` antes de `npm run prod`.                                                                                                          |
