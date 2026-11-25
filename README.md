# Consulta de CEPs de Diamantina/MG

Landing page para consulta de CEPs de Diamantina, feita com HTML5 semântico, CSS3 e JavaScript puro, sem bibliotecas ou frameworks.

Atividade prática da disciplina de **Programação 2** (com conhecimentos de Desenvolvimento Web), Bacharelado em Sistemas de Informação, 2º Período, UEMG, Unidade Acadêmica de Carangola.

## Equipe

- Gabriel Furtado
- Lucas Calegari
- Flávio Cândido

## Funcionalidades

- Autocomplete a partir de 3 caracteres, sem diferenciar acentos ou maiúsculas.
- Navegação pelas sugestões com mouse, toque ou teclado (setas, Enter e Esc).
- Resultado com Logradouro, Bairro, Localidade/UF e CEP em destaque.
- Modais de Sobre, Termos de Uso e Privacidade.
- Layout responsivo (mobile-first).

## Como executar

O navegador bloqueia o `fetch` de arquivos locais quando o `index.html` é aberto com duplo clique. Use um servidor local, de uma destas formas:

- No VS Code, instale a extensão **Live Server**, clique com o botão direito em `index.html` e escolha **Open with Live Server**.
- Com Node.js, execute `npx serve` na pasta do projeto e abra o endereço exibido.

## Estrutura

```text
├── index.html
├── css/styles.css
├── js/app.js
├── data/ceps.json   # base consolidada, usada pela página
├── data/raw/        # os três retornos originais do ViaCEP
├── assets/          # logotipos e foto da cidade
└── README.md
```

## Base de dados

Fonte: [ViaCEP](https://viacep.com.br/), consultado em 24/11/2026.

| Consulta | Registros retornados |
|----------|----------------------|
| `https://viacep.com.br/ws/MG/Diamantina/Rua/json/`     | 11 |
| `https://viacep.com.br/ws/MG/Diamantina/Avenida/json/` | 1  |
| `https://viacep.com.br/ws/MG/Diamantina/Praca/json/`   | 2  |

Os três retornos originais estão em `data/raw/` (`Rua.json`, `Avenida.json` e `Praca.json`). Eles foram unidos em `data/ceps.json`, removendo duplicidades pelo CEP. Não houve registros repetidos, e o arquivo final tem **14 registros**.

**Limitações da base:**

- A consulta de avenidas retornou apenas o CEP `39100-000`, sem logradouro e sem bairro. Ele é mantido no JSON, mas não aparece nas sugestões. A página o menciona quando a busca não encontra nada.
- Restam 13 registros pesquisáveis, quase todos ligados a unidades dos Correios. Várias ruas conhecidas da cidade não aparecem nessas consultas.

## Créditos

Foto: [Diamantina vista do Cruzeiro](https://commons.wikimedia.org/wiki/File:Diamantina_vista_do_Cruzeiro.jpg), de Leandro Neumann Ciuffo, licença [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). Foi redimensionada para uso na página, onde é exibida recortada e com máscara escura.

## Transparência sobre o uso de IA

Em consonância com os princípios de integridade acadêmica e transparência tecnológica, declara-se que ferramentas de Inteligência Artificial generativa foram utilizadas durante o desenvolvimento deste projeto. Foram aplicadas na geração do código HTML, CSS e JavaScript, na consolidação da base de CEPs, na escolha da fotografia e na documentação, sendo a revisão e a validação final de responsabilidade dos membros da equipe.
