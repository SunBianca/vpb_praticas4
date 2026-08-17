# Projeto: Sistema de Gestão Financeira Doméstica

UNIVERSIDADE DO OESTE DE SANTA CATARINA - UNOESC

Disciplina: Práticas Extensionistas IV

## Alunos
- **[Bianca Aparecida de Almeida Pinto Paz](https://github.com/AkianBiah)** - Código: 447086  
  Curso: Análise e Desenvolvimento de Sistemas

  - **[Camila Bez]().** - Código: 230647  
  Curso: Análise e Desenvolvimento de Sistemas

 - **[Gabriela Palla]()** - Código: 368273
  Curso: Análise e Desenvolvimento de Sistemas

(Em Práticas Extensionistas III, o projeto foi feito junto com o seguinte aluno:)
- **[Victor Lermen](https://github.com/arkherim)** - Código: 230647  
  Curso: Ciência de Dados e Inteligência Artificial
  
## Documentação Consolidada
- [Relatório Final (PDF)](./docs/misc/Victor%20e%20Bianca%20-%20Praticas%203.pdf)

### Infraestrutura e Deploy

O sistema está hospedado em nuvem e pode ser acessado em: **[vpb-praticas.vercel.app](https://vpb-praticas.vercel.app/)**

Serviços utilizados:

- **Front-end:** [Vercel](https://vercel.com/) — hospedagem do app React
- **Back-end:** [Render](https://render.com/) — hospedagem da API FastAPI (Python)
- **Banco de Dados:** [NeonDB](https://neon.tech/) — PostgreSQL gerenciado em nuvem

**Observação:** O serviço de back-end utiliza o plano gratuito do Render, que hiberna automaticamente após um período de inatividade. Na primeira requisição após a hibernação, a API pode levar até 1 minuto para responder enquanto o serviço é reiniciado. Requisições subsequentes funcionam normalmente.

### Ferramentas de IA
- Claude
- Github Copilot
- Lovable

### Definição

### Stack de desenvolvimento:
- Back-end: [Python](https://www.python.org/)
- Front-End: [React](https://react.dev/)
- SGDB: [PostgreSQL](https://www.postgresql.org/)

### Documento de Requisitos de Software
- [requisitos.md](./docs/REQUISITOS.md)  

## Modelagem

### Modelo ER Conceitual
- [PNG](./docs/er_conceitual/ER_Conceitual.png)
- [BRModelo (.brM3)](./docs/er_conceitual/ER_Conceitual.brM3)

### Modelo ER Lógico
#### Atualizado
- [PNG](./docs/er_logico/ER_Logico%20-%20Atualizado.png)

#### Antigo
- [PNG](./docs/er_logico/ER_Logico.png)
- [BRModelo (.brM3)](./docs/er_logico/ER_Logico.brM3)



### Diagrama de Classes
- [PNG](./docs/diagrama_classes/diagrama_classes.png)
- [Draw.io](https://drive.google.com/file/d/1e8C0G9d5Brp17dtFdTj24V11x80_-FJ7/view?usp=sharing)

## Comportamento do Sistema

### Diagrama de Caso de Uso
- [PNG](./docs/casos_uso/caso_de_uso.png)
- [Draw.io](https://drive.google.com/file/d/1iHfiFqNoQ5LtXj-A47aXPQS5wJPPy6DA/view?usp=sharing)

### Diagramas de Sequência
- [Diagramas Agrupados](./docs/diagramas_sequencia/diagrama_sequencia.md)
- PNG:
    - [Login](./docs/diagramas_sequencia/diagramas_sequencia%20(png)/ds_login.png)
    - [Cadastro de Conta](./docs/diagramas_sequencia/diagramas_sequencia%20(png)/ds_conta_bancaria.png)
    - [Cadastro de Movimentação](./docs/diagramas_sequencia/diagramas_sequencia%20(png)/ds_movimentaçao.png)
    - [Cadastro de Compromisso](./docs/diagramas_sequencia/diagramas_sequencia%20(png)/ds_cadastra_compromisso.png)
    - [Confirma Pagamento do Compromisso](./docs/diagramas_sequencia/diagramas_sequencia%20(png)/confirma_compromisso.png)
    - [Relatório Mensal](./docs/diagramas_sequencia/diagramas_sequencia%20(png)/exibe_relatorio.png)
- Mermaid (.mmd):
    - [Login](./docs/diagramas_sequencia/diagramas_sequencia%20(mermaid)/ds_login.mmd)
    - [Cadastro de Conta](./docs/diagramas_sequencia/diagramas_sequencia%20(mermaid)/ds_conta_bancaria.mmd)
    - [Cadastro de Movimentação](./docs/diagramas_sequencia/diagramas_sequencia%20(mermaid)/ds_movimentaçao.mmd)
    - [Cadastro de Compromisso](./docs/diagramas_sequencia/diagramas_sequencia%20(mermaid)/ds_cadastra_compromisso.mmd)
    - [Confirma Pagamento do Compromisso](./docs/diagramas_sequencia/diagramas_sequencia%20(mermaid)/confirma_compromisso.mmd)
    - [Relatório Mensal](./docs/diagramas_sequencia/diagramas_sequencia%20(mermaid)/exibe%20relatorio.mmd)

### Diagramas de Atividades
- [Diagramas Agrupados (Draw.io)](https://drive.google.com/file/d/17XBYSKx-MPohxVqGwh1fZZ2NcCwamuKk/view)
- PNG:
    - [Login](./docs/diagrama_atividades/da_cadastro_login.png)
    - [Cadastro de Conta](./docs/diagrama_atividades/da_cadastro_conta_bancaria.png)
    - [Cadastro de Movimentação](./docs/diagrama_atividades/da_cadastro_transacao.png)
    - [Cadastro de Compromisso](./docs/diagrama_atividades/da_cadastro_compromisso.png)
    - [Pagamento de Compromisso](./docs/diagrama_atividades/da_pagamento_compromisso.png)
    - [Relatório](./docs/diagrama_atividades/da_relatorio.png)
