'use strict';

const CAMINHO_DADOS = './data/ceps.json';
const MINIMO_CARACTERES = 3;

const campo = document.querySelector('#campo-busca');
const lista = document.querySelector('#lista-sugestoes');
const statusBusca = document.querySelector('#status-busca');
const resultado = document.querySelector('#resultado');

let logradouros = [];   // registros que podem ser pesquisados
let cepsSemRua = [];    // registros do município sem nome de logradouro
let sugestoes = [];     // correspondências da busca atual
let indiceAtivo = -1;   // sugestão destacada pelo teclado

/* ---------- Utilitários ---------- */

// Ignora acentos, maiúsculas e espaços repetidos: "praca" encontra "Praça"
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function mostrarStatus(mensagem, ehErro = false) {
  statusBusca.textContent = mensagem;
  statusBusca.classList.toggle('is-error', ehErro);
}

/* ---------- Carregamento do JSON ---------- */

async function carregarDados() {
  try {
    const resposta = await fetch(CAMINHO_DADOS);

    if (!resposta.ok) {
      throw new Error(`Falha ao carregar os dados (HTTP ${resposta.status})`);
    }

    const registros = await resposta.json();

    logradouros = registros
      .filter((registro) => registro.logradouro)
      .map((registro) => ({ ...registro, chave: normalizar(registro.logradouro) }))
      .sort((a, b) =>
        a.logradouro.localeCompare(b.logradouro, 'pt-BR') ||
        a.bairro.localeCompare(b.bairro, 'pt-BR') ||
        a.cep.localeCompare(b.cep));

    cepsSemRua = registros.filter((registro) => !registro.logradouro).map((registro) => registro.cep);

    campo.disabled = false;
    mostrarStatus(`Base carregada: ${logradouros.length} endereços com logradouro.`);
  } catch (erro) {
    console.error(erro);
    mostrarStatus(
      'Não foi possível carregar a base de CEPs. Abra a página por um servidor local (por exemplo, a extensão Live Server do VS Code).',
      true
    );
  }
}

/* ---------- Autocomplete ---------- */

// Monta o nome do logradouro destacando o trecho digitado
function criarNomeDestacado(nome, termo) {
  const elemento = document.createElement('span');
  elemento.className = 'autocomplete__name';

  const texto = nome.normalize('NFC');
  const inicio = normalizar(texto).indexOf(termo);
  const fim = inicio + termo.length;

  const marca = document.createElement('mark');
  marca.textContent = texto.slice(inicio, fim);

  elemento.append(texto.slice(0, inicio), marca, texto.slice(fim));
  return elemento;
}

function criarOpcao(registro, indice, termo) {
  const opcao = document.createElement('li');
  opcao.id = `sugestao-${indice}`;
  opcao.className = 'autocomplete__option';
  opcao.setAttribute('role', 'option');
  opcao.setAttribute('aria-selected', 'false');

  // Bairro, unidade e CEP diferenciam logradouros com o mesmo nome
  const detalhe = document.createElement('span');
  detalhe.className = 'autocomplete__detail';
  detalhe.textContent = [registro.bairro, registro.unidade, registro.cep].filter(Boolean).join(' · ');

  opcao.append(criarNomeDestacado(registro.logradouro, termo), detalhe);

  // Impede que o campo perca o foco antes de o clique ser registrado
  opcao.addEventListener('mousedown', (evento) => evento.preventDefault());
  opcao.addEventListener('click', () => selecionar(registro));

  return opcao;
}

function abrirLista() {
  lista.hidden = false;
  campo.setAttribute('aria-expanded', 'true');

  // Se a lista passar do fim da tela, sobe a página para ela ficar visível
  if (lista.getBoundingClientRect().bottom > window.innerHeight) {
    campo.parentElement.previousElementSibling.scrollIntoView({ block: 'start' });
  }
}

function fecharLista() {
  lista.hidden = true;
  indiceAtivo = -1;
  campo.setAttribute('aria-expanded', 'false');
  campo.removeAttribute('aria-activedescendant');
}

function filtrar() {
  const termo = normalizar(campo.value);

  fecharLista();
  lista.replaceChildren();
  sugestoes = [];

  if (termo.length < MINIMO_CARACTERES) {
    const faltam = MINIMO_CARACTERES - termo.length;
    mostrarStatus(termo.length === 0
      ? ''
      : `Digite mais ${faltam} ${faltam === 1 ? 'caractere' : 'caracteres'} para buscar.`);
    return;
  }

  sugestoes = logradouros.filter((registro) => registro.chave.includes(termo));

  if (sugestoes.length === 0) {
    const complemento = cepsSemRua.length > 0
      ? ` A base também tem o CEP ${cepsSemRua.join(', ')} para Diamantina, sem logradouro específico.`
      : '';
    mostrarStatus(`Nenhum logradouro encontrado.${complemento}`);
    return;
  }

  lista.append(...sugestoes.map((registro, indice) => criarOpcao(registro, indice, termo)));
  lista.scrollTop = 0;
  abrirLista();
  mostrarStatus(sugestoes.length === 1
    ? '1 sugestão encontrada.'
    : `${sugestoes.length} sugestões encontradas.`);
}

function destacarOpcao(novoIndice) {
  const opcoes = lista.children;

  if (indiceAtivo >= 0) {
    opcoes[indiceAtivo].setAttribute('aria-selected', 'false');
  }

  // O resto da divisão faz a navegação circular entre o início e o fim
  indiceAtivo = (novoIndice + opcoes.length) % opcoes.length;

  const ativa = opcoes[indiceAtivo];
  ativa.setAttribute('aria-selected', 'true');
  ativa.scrollIntoView({ block: 'nearest' });
  campo.setAttribute('aria-activedescendant', ativa.id);
}

function tratarTeclado(evento) {
  if (lista.hidden) {
    if (evento.key === 'ArrowDown' && sugestoes.length > 0) {
      evento.preventDefault();
      abrirLista();
      destacarOpcao(0);
    }
    return;
  }

  switch (evento.key) {
    case 'ArrowDown':
      evento.preventDefault();
      destacarOpcao(indiceAtivo + 1);
      break;
    case 'ArrowUp':
      evento.preventDefault();
      destacarOpcao(indiceAtivo < 0 ? -1 : indiceAtivo - 1);
      break;
    case 'Enter':
      evento.preventDefault();
      // Sem destaque, o Enter só escolhe quando há uma única sugestão
      if (indiceAtivo >= 0) {
        selecionar(sugestoes[indiceAtivo]);
      } else if (sugestoes.length === 1) {
        selecionar(sugestoes[0]);
      }
      break;
    case 'Escape':
      evento.preventDefault();
      fecharLista();
      break;
  }
}

/* ---------- Exibição do resultado ---------- */

function preencher(id, valor) {
  document.querySelector(`#${id}`).textContent = valor || 'Não informado';
}

function selecionar(registro) {
  campo.value = registro.logradouro;
  sugestoes = [];
  fecharLista();
  mostrarStatus('');

  preencher('resultado-cep', registro.cep);
  preencher('resultado-logradouro', registro.logradouro);
  preencher('resultado-bairro', registro.bairro);
  preencher('resultado-localidade', `${registro.localidade}/${registro.uf}`);
  preencher('resultado-complemento', registro.complemento);
  preencher('resultado-unidade', registro.unidade);

  // Complemento e unidade só aparecem quando existem no registro
  document.querySelector('#linha-complemento').hidden = !registro.complemento;
  document.querySelector('#linha-unidade').hidden = !registro.unidade;

  resultado.hidden = false;
  resultado.scrollIntoView({ block: 'nearest' });
}

/* ---------- Modais ---------- */

function configurarModais() {
  document.querySelectorAll('[data-modal]').forEach((botao) => {
    const modal = document.querySelector(`#${botao.dataset.modal}`);

    botao.addEventListener('click', () => {
      modal.showModal();
      modal.querySelector('.modal__body').scrollTop = 0;
    });

    // Devolve o foco ao link que abriu o modal
    modal.addEventListener('close', () => botao.focus());
  });

  document.querySelectorAll('dialog').forEach((modal) => {
    modal.querySelector('[data-close]').addEventListener('click', () => modal.close());

    // Clique no fundo escurecido (fora da caixa) também fecha
    modal.addEventListener('click', (evento) => {
      if (evento.target === modal) {
        modal.close();
      }
    });
  });
}

/* ---------- Inicialização ---------- */

campo.addEventListener('input', () => {
  resultado.hidden = true;
  filtrar();
});

campo.addEventListener('keydown', tratarTeclado);
campo.addEventListener('blur', fecharLista);

campo.addEventListener('focus', () => {
  if (sugestoes.length > 0) {
    abrirLista();
  }
});

configurarModais();
carregarDados();
