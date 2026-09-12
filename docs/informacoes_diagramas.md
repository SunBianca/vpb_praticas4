# Informações do Projeto para Diagramas de DevOps, UML e Arquitetura de Implantação

## 1. Visão geral

Projeto: Sistema de Gestão Financeira Doméstica

Contexto:
- Aplicação web para gestão financeira pessoal e doméstica.
- Permite controle de contas, categorias, transações, agendamentos e dashboard financeiro.
- Também contempla fluxo de login, cadastro de usuário e formulário de contato.
- O projeto é voltado a uso financeiro individual, com relação entre usuário, contas, categorias, transações e compromissos.

Aplicação pública:
- Front-end: https://vpb-praticas.vercel.app/
- Back-end: https://vpb-praticas4.onrender.com

## 2. Objetivo do sistema

O sistema tem como principal objetivo auxiliar o usuário a:
- controlar contas bancárias;
- registrar receitas e despesas;
- organizar categorias financeiras;
- acompanhar compromissos financeiros (agendamentos);
- consultar resumo do mês atual por meio de dashboard;
- manter histórico de movimentações;
- receber confirmação de pagamento em compromissos financeiros.

## 3. Stack tecnológico

### Front-end
- React
- Vite
- TypeScript
- TanStack Router
- TanStack Query
- Tailwind CSS
- Radix UI
- PWA support via vite-plugin-pwa

### Back-end
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL como banco principal

### Banco de dados
- PostgreSQL gerenciado em nuvem (NeonDB)

### Deploy e infraestrutura
- Front-end em Vercel
- Back-end em Render
- Banco em NeonDB

### Arquivos de infraestrutura do repositório
- `render.yaml` define o serviço web do backend em Render.
- Não há configuração explícita de Dockerfile, Kubernetes, GitHub Actions, Terraform ou helm neste repositório.

## 4. Estrutura do projeto

```text
/
├── README.md
├── render.yaml
├── app/
│   ├── backend/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── serve.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── database.py
│   │   │   └── dependencies.py
│   │   ├── models/
│   │   │   ├── account.py
│   │   │   ├── category.py
│   │   │   ├── mixins.py
│   │   │   ├── schedule.py
│   │   │   ├── transaction.py
│   │   │   └── user.py
│   │   ├── routes/
│   │   │   ├── account_routes.py
│   │   │   ├── category_routes.py
│   │   │   ├── contact_routes.py
│   │   │   ├── dashboard_routes.py
│   │   │   ├── schedule_routes.py
│   │   │   ├── transaction_routes.py
│   │   │   └── user_routes.py
│   │   ├── schemas/
│   │   │   ├── account_schema.py
│   │   │   ├── category_schema.py
│   │   │   ├── contact_schema.py
│   │   │   ├── dashboard_schema.py
│   │   │   ├── schedule_schema.py
│   │   │   ├── transaction_schema.py
│   │   │   └── user_schema.py
│   │   └── services/
│   │       ├── account_service.py
│   │       ├── category_service.py
│   │       ├── contact_service.py
│   │       ├── dashboard_service.py
│   │       ├── schedule_service.py
│   │       ├── transaction_service.py
│   │       └── user_service.py
│   └── frontend/
│       ├── package.json
│       ├── vite.config.ts
│       ├── public/
│       └── src/
│           ├── router.tsx
│           ├── routeTree.gen.ts
│           ├── server.ts
│           ├── start.ts
│           ├── styles.css
│           ├── components/
│           ├── hooks/
│           ├── lib/
│           └── routes/
├── docs/
│   ├── REQUISITOS.md
│   ├── casos_uso/
│   ├── diagrama_atividades/
│   ├── diagrama_classes/
│   ├── diagramas_sequencia/
│   ├── ER Conceitual/
│   ├── er_conceitual/
│   ├── er_logico/
│   └── misc/
```

## 5. Arquitetura de software

### 5.1 Arquitetura lógica

O sistema possui três camadas principais:

1. Front-end (React + Vite)
   - Interface do usuário.
   - Consome a API REST do backend.
   - Gerencia navegação e páginas do sistema.

2. Back-end (FastAPI)
   - Exposição de endpoints REST.
   - Validação com Pydantic.
   - Regras de negócio em serviços.
   - Acesso ao banco via SQLAlchemy.

3. Banco de dados PostgreSQL
   - Armazena usuários, contas, categorias, transações e agendamentos.
   - Mantém relacionamento entre entidades.

### 5.2 Arquitetura de comunicação

- O front-end usa fetch para consumir a API backend em `API_BASE` definido em `app/frontend/src/lib/api.ts`.
- O backend é montado em `app/backend/main.py` com roteadores de usuários, contas, categorias, dashboard, compromissos, transações e contato.
- A CORS middleware permite qualquer origem (`allow_origins=["*"]`) para facilitar integração web.

## 6. Modelos de domínio

### Entidade: Usuario
Atributos principais:
- id
- nome
- email
- senha_hash
- excluido_em

Relacionamentos:
- possui várias contas
- possui várias categorias
- possui vários agendamentos

### Entidade: Conta
Atributos principais:
- id
- id_usuario
- banco
- agencia
- numero_conta
- tipo
- saldo
- excluido_em

Relacionamentos:
- pertence a um usuário
- possui várias transações
- possui vários agendamentos

### Entidade: Categoria
Atributos principais:
- id
- id_usuario
- nome
- descricao
- padrao

Relacionamentos:
- pertence a um usuário
- pode estar em várias transações
- pode estar em vários agendamentos

### Entidade: Transacao
Atributos principais:
- id
- id_conta
- id_categoria
- id_agendamento (opcional)
- tipo
- valor
- data
- descricao
- status

Relacionamentos:
- pertence a uma conta
- pertence a uma categoria
- pode estar vinculada a um agendamento

### Entidade: Agendamento
Atributos principais:
- id
- id_usuario
- id_categoria
- id_conta
- tipo
- valor
- vencimento
- descricao
- status

Relacionamentos:
- pertence a um usuário
- pertence a uma categoria
- pertence a uma conta
- pode gerar transações de pagamento

## 7. Regras de negócio principais

### Usuário
- Cadastro de usuário com nome, e-mail e senha.
- Login com e-mail e senha.
- Exclusão lógica (`deleted_at`) em vez de remoção física.

### Contas
- Cadastro de contas bancárias por usuário.
- Listagem por usuário ou todas as contas ativas.
- Dashboard por conta com saldo total e movimentações do mês.
- Exclusão lógica com `deleted_at`.

### Categorias
- Organização por usuário.
- Suporte a categoria padrão.
- Validação de relação com o usuário da conta/compromisso.

### Transações
- Tipo obrigatório: receita ou despesa.
- Valor deve ser positivo.
- Afeta o saldo da conta vinculada.
- Possui vínculo opcional com agendamento.
- Ao criar, saldo da conta é atualizado.
- Ao excluir, saldo é revertido.

### Agendamentos
- Representam compromissos financeiros futuros.
- Possuem valor, categoria, conta, vencimento e status.
- Status pode ser pendente, pago ou vencido.
- Pagamento atualiza saldo da conta e registra transação vinculada.
- O serviço marca agendamentos vencidos automaticamente quando a data atual ultrapassa o vencimento.

### Dashboard
- Calcula saldo total de todas as contas.
- Soma receitas e despesas do mês atual.
- Exibe quantidade de contas e transações do mês.
- Recupera transações recentes.

## 8. Endpoints da API

### Usuários
- POST /users
- GET /users
- PUT /users/{user_id}/password
- POST /login
- DELETE /users/{user_id}

### Contas
- POST /accounts
- GET /accounts
- GET /accounts/{account_id}
- GET /accounts/{account_id}/dashboard
- DELETE /accounts/{account_id}

### Categorias
- POST /categories
- GET /categories
- GET /categories/{category_id}
- DELETE /categories/{category_id}

### Dashboard
- GET /dashboard

### Agendamentos
- POST /schedules
- GET /schedules
- GET /schedules/{schedule_id}
- PATCH /schedules/{schedule_id}
- POST /schedules/{schedule_id}/payments
- DELETE /schedules/{schedule_id}

### Transações
- POST /transactions
- GET /transactions
- GET /transactions/{transaction_id}
- PATCH /transactions/{transaction_id}
- DELETE /transactions/{transaction_id}

### Contato
- POST /contact

## 9. Variações de dados e validações importantes

### Tipos de dados
- `Decimal` usado para valores monetários.
- `date` usado para datas de transação e vencimento.
- `datetime` para timestamps de criação e atualização.

### Validações implementadas
- campos obrigatórios não podem ser nulos ou vazios;
- valores monetários devem ser decimais válidos e > 0;
- tipos de transação aceitos: `receita` e `despesa`;
- IDs devem ser inteiros positivos;
- conta e categoria devem pertencer ao mesmo usuário;
- agendamentos vencidos são marcados em `vencido` automaticamente.

## 10. Banco de dados e relacionamento

Principais tabelas (nome em português no modelo ORM):
- usuario
- conta
- categoria
- transacao
- agendamento

Principais relações:
- usuario 1:N conta
- usuario 1:N categoria
- usuario 1:N agendamento
- conta 1:N transacao
- categoria 1:N transacao
- categoria 1:N agendamento
- conta 1:N agendamento
- agendamento 1:N transacao (opcional via `id_agendamento`)

## 11. Configuração da infraestrutura e ambiente

### Variáveis de ambiente esperadas
O backend usa carregamento de `.env` local e também o uso de variáveis do ambiente:

- APP_ENV
- DATABASE_URL
- PGHOST
- PGDATABASE
- PGUSER
- PGPASSWORD
- PGSSLMODE
- PGCHANNELBINDING

### Detalhe do banco
Em `app/backend/core/database.py` há lógica explícita para:
- tentar `DATABASE_URL` primeiro;
- fallback para variáveis PostgreSQL; 
- exigir conexão PostgreSQL; 
- não suportar SQLite.

### Deploy do backend (Render)
Configuração em `render.yaml`:
- serviço do tipo web;
- ambiente Python;
- runtime python-3.11;
- diretório raiz: `app/backend`;
- build command: `pip install -r requirements.txt`;
- start command: `python -m serve`;
- autoDeploy habilitado.

### Observação importante de operação
O README informa que o Render usa plano gratuito e hiberna após inatividade. Isso implica:
- na primeira requisição após hibernação, pode haver atraso de até 1 minuto;
- o serviço reinicia automaticamente;
- requisições posteriores voltam ao normal.

## 12. DevOps e pipeline de implantação

### Componentes do modelo de DevOps
- Repositório de código
- Front-end em Vercel
- API em Render
- Banco em NeonDB
- Ambiente de produção configurado via nuvem gerenciada

### Fluxo de entrega atual inferido
```text
Desenvolvimento local
        ↓
GitHub repository
        ↓
Vercel (front-end deploy automático)
        ↓
Render (backend deploy automático via render.yaml)
        ↓
NeonDB (PostgreSQL provisionado em nuvem)
```

### Observações relevantes para diagramas DevOps
- Não há evidência de pipeline CI/CD com GitHub Actions neste repositório.
- O deploy é realizado por plataformas externas com configuração declarativa.
- O backend não está contido em Docker na estrutura do projeto atual.
- O sistema depende de variáveis de ambiente para autenticação e acesso ao banco.

## 13. Informações relevantes para UML

### Casos de uso principais
- cadastro de usuário
- login
- criação de conta bancária
- listagem de contas
- criação de categoria
- criação de transação
- listagem de transações
- criação de agendamento
- pagamento de agendamento
- visualização de dashboard financeiro
- envio de mensagem de contato

### Diagrama de classes
Os arquivos de documentação e de código já apontam para modelos principais:
- User
- Account
- Category
- Transaction
- Schedule

### Diagrama de sequência
O projeto possui diagramas em docs/diagramas_sequencia e arquivos Mermaid com cenários como:
- login
- cadastro de conta bancária
- cadastro de movimentação
- cadastro de compromisso
- confirmação de pagamento do compromisso
- exibição de relatório

### Diagrama de atividades
Existe estrutura de diagramas de atividades para:
- cadastro/login
- cadastro de conta bancária
- cadastro de transação
- cadastro de compromisso
- pagamento de compromisso
- relatório

## 14. Resumo para desenho de arquitetura de implantação

Componentes físicos sugeridos:
- Cliente web: navegador do usuário acessando a aplicação React.
- CDN / hosting web: Vercel para o front-end.
- API REST: Render executando o serviço FastAPI.
- Banco de dados: NeonDB com PostgreSQL.
- Camada de rede: HTTPS entre navegador e serviços cloud.

Modelo de implantação em alto nível:
```text
[Usuário / Navegador]
          |
          | HTTPS
          v
[Vercel - Frontend React]
          |
          | API REST (HTTP)
          v
[Render - FastAPI Backend]
          |
          | SQLAlchemy / PostgreSQL driver
          v
[NeonDB - PostgreSQL]
```

## 15. Referências internas do projeto

- README principal: `README.md`
- Requisitos do software: `docs/REQUISITOS.md`
- Diagramas de sequência: `docs/diagramas_sequencia/`
- Diagramas de classes: `docs/diagrama_classes/`
- Diagramas de atividades: `docs/diagrama_atividades/`
- Modelo ER: `docs/er_conceitual/` e `docs/er_logico/`
- Configuração de deploy: `render.yaml`
- Backend principal: `app/backend/main.py`
- Front-end: `app/frontend/src/lib/api.ts`
- Banco: `app/backend/core/database.py`

## 16. Conclusão

Este projeto é uma aplicação financeira full-stack com arquitetura moderna, separação clara entre front-end, back-end e banco de dados, e deploy distribuído em plataformas cloud. As informações acima já são suficientes para a criação de:
- diagramas DevOps;
- diagramas UML de caso de uso, classes, sequência e atividades;
- diagramas de arquitetura de implantação;
- documentação de operação e infraestrutura.
