// Grupos da Turma: divide a turma em grupos, sorteia os alunos e monta
// o cronograma de seminários. Tudo roda no navegador.
(function () {
  "use strict";

  // ---------- Utilidades ----------
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  const corDoGrupo = (i) => Math.round((i * 137.508 + 170) % 360); // cores bem diferentes entre grupos vizinhos
  const comparaNomes = new Intl.Collator("pt-BR", { sensitivity: "base" }).compare;

  function inteiro(el, min, max) {
    const n = Number(String(el.value).trim());
    if (!Number.isInteger(n) || n < min || n > max) return null;
    return n;
  }

  // Embaralhamento justo (Fisher-Yates) com números aleatórios do navegador.
  function embaralhar(lista) {
    const a = lista.slice();
    const aleatorio = new Uint32Array(1);
    for (let i = a.length - 1; i > 0; i--) {
      crypto.getRandomValues(aleatorio);
      const j = aleatorio[0] % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Regra da divisão ----------
  // Os alunos que sobram vão um para cada grupo, a partir do primeiro.
  function tamanhos(alunos, grupos) {
    const base = Math.floor(alunos / grupos);
    const resto = alunos % grupos;
    return Array.from({ length: grupos }, (_, i) => base + (i < resto ? 1 : 0));
  }

  function descreverDivisao(alunos, grupos) {
    const t = tamanhos(alunos, grupos);
    const maior = t[0], menor = t[t.length - 1];
    const qtdMaior = t.filter((x) => x === maior).length;
    if (maior === menor) {
      return { exata: true, frase: `${plural(grupos, "grupo", "grupos")} de ${plural(maior, "aluno", "alunos")}`, t };
    }
    return {
      exata: false,
      frase: `${plural(qtdMaior, "grupo", "grupos")} de ${maior} e ${plural(grupos - qtdMaior, "grupo", "grupos")} de ${menor} alunos`,
      t,
    };
  }

  function formarGrupos(nomes, grupos, modo) {
    let ordem = nomes.slice();
    if (modo === "sortear") ordem = embaralhar(ordem);
    else if (modo === "alfabetica") ordem.sort(comparaNomes);
    const t = tamanhos(ordem.length, grupos);
    let pos = 0;
    return t.map((qtd, i) => {
      const membros = ordem.slice(pos, pos + qtd);
      pos += qtd;
      return { numero: i + 1, membros };
    });
  }

  function verificarDivisao(alunos, grupos) {
    if (alunos === 0) return "A lista de alunos está vazia. Escolha uma planilha ou digite os nomes.";
    if (grupos === null) return "Digite a quantidade de grupos (um número inteiro a partir de 1).";
    if (grupos > alunos) return `Há mais grupos (${grupos}) do que alunos (${alunos}). Diminua a quantidade de grupos.`;
    return null;
  }

  // ---------- Abas ----------
  const abas = $$(".aba");
  function abrirAba(aba) {
    abas.forEach((a) => {
      const ativa = a === aba;
      a.setAttribute("aria-selected", String(ativa));
      a.classList.toggle("active", ativa);
      a.tabIndex = ativa ? 0 : -1;
      $("#" + a.getAttribute("aria-controls")).hidden = !ativa;
    });
    // A lista de alunos é a mesma nas abas "Sortear grupos" e "Seminário".
    const destino = $("#" + aba.getAttribute("aria-controls") + " .lista-alunos-local");
    if (destino) destino.appendChild(blocoLista);
    try { localStorage.setItem("grupos-aba", aba.id); } catch (e) { /* sem armazenamento: tudo bem */ }
  }
  abas.forEach((a, i) => {
    a.addEventListener("click", () => abrirAba(a));
    a.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const prox = abas[(i + (e.key === "ArrowRight" ? 1 : abas.length - 1)) % abas.length];
      prox.focus();
      abrirAba(prox);
    });
  });

  // ---------- 1. Calcular ----------
  const calcAlunos = $("#calc-alunos"), calcGrupos = $("#calc-grupos"), saidaCalc = $("#saida-calcular");

  function calcular() {
    const alunos = inteiro(calcAlunos, 1, 500);
    const grupos = inteiro(calcGrupos, 1, 200);
    if (alunos === null) return (saidaCalc.innerHTML = `<div class="alert alert-danger mb-0">Digite o número de alunos (de 1 a 500).</div>`);
    const erro = verificarDivisao(alunos, grupos);
    if (erro) return (saidaCalc.innerHTML = `<div class="alert alert-danger mb-0">${esc(erro)}</div>`);

    const d = descreverDivisao(alunos, grupos);
    const base = Math.floor(alunos / grupos), resto = alunos % grupos;
    const conta = d.exata
      ? `${alunos} ÷ ${grupos} = ${base}, divisão exata.`
      : `${alunos} ÷ ${grupos} = ${base}, com resto ${resto}. Os ${plural(resto, "aluno que sobra", "alunos que sobram")} ${resto === 1 ? "entra" : "entram"} um em cada grupo.`;
    const mesas = d.t
      .map((qtd, i) => `
        <div class="col"><div class="card h-100 mesa" style="--h:${corDoGrupo(i)}"><div class="card-body p-2">
          <div class="d-flex justify-content-between small fw-bold text-muted text-uppercase mb-2"><span>Grupo ${i + 1}</span><span>${qtd}</span></div>
          <div class="cadeiras" aria-hidden="true">${'<span class="cadeira"></span>'.repeat(Math.min(qtd, 60))}</div>
        </div></div></div>`)
      .join("");
    saidaCalc.innerHTML = `
      <div class="card shadow-sm"><div class="card-body p-4">
        <h2 class="h3 mb-2">${alunos} alunos em ${grupos} grupos:<br><span class="text-primary">${esc(d.frase)}</span></h2>
        <p class="text-muted">${esc(conta)}</p>
        <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-xl-5 g-2">${mesas}</div>
      </div></div>`;
  }
  [calcAlunos, calcGrupos].forEach((el) => el.addEventListener("input", calcular));
  $("#form-calcular").addEventListener("submit", (e) => e.preventDefault());

  // ---------- Lista de alunos (compartilhada) ----------
  const blocoLista = $("#modelo-lista").content.firstElementChild.cloneNode(true);
  const campoNomes = $("#nomes", blocoLista);
  const campoArquivo = $("#arquivo", blocoLista);
  const areaArquivo = $("#area-arquivo", blocoLista);
  const blocoColuna = $("#bloco-coluna", blocoLista);
  const selColuna = $("#coluna", blocoLista);
  const fonteLista = $("#fonte-lista", blocoLista);

  const EXEMPLO = [
    "Ana Beatriz Souza", "Arthur Lima", "Bruno Henrique Costa", "Camila Ferreira", "Davi Lucas Rocha",
    "Eduarda Martins", "Enzo Gabriel Alves", "Gabriela Nunes", "Guilherme Santos", "Heloísa Pereira",
    "Isaac Ribeiro", "Isabela Carvalho", "João Miguel Barbosa", "Júlia Mendes", "Kauã Oliveira",
    "Laura Cristina Dias", "Lorena Araújo", "Lucas Gomes", "Manuela Teixeira", "Mateus Cardoso",
    "Maria Clara Freitas", "Miguel Batista", "Nicole Pinto", "Pedro Henrique Moraes", "Rafaela Duarte",
    "Ryan Correia", "Sofia Monteiro", "Thiago Vieira", "Valentina Rezende", "Vitor Hugo Castro",
    "Yasmin Farias", "Pietro Moura",
  ];

  let planilha = null; // { nome, abas: [{ nome, linhas }], aba, coluna, cabecalho }

  function lerNomes() {
    const vistos = new Set();
    return campoNomes.value
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter((l) => {
        const chave = l.toLocaleLowerCase("pt-BR");
        if (!l || vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
      });
  }

  function mostrarFonte(html) {
    fonteLista.innerHTML = html;
  }

  function atualizarResumos() {
    const n = lerNomes().length;
    [["#sort-grupos", "#sort-resumo"], ["#sem-grupos", "#sem-resumo"]].forEach(([g, r]) => {
      const grupos = inteiro($(g), 1, 200);
      const erro = verificarDivisao(n, grupos);
      $(r).textContent = erro ? erro : `${n} alunos: ${descreverDivisao(n, grupos).frase}.`;
    });
  }

  campoNomes.addEventListener("input", () => {
    if (planilha) mostrarFonte(`<span class="badge bg-secondary me-1">EDITADA</span> Lista da planilha <b>${esc(planilha.nome)}</b> com alterações suas.`);
    else mostrarFonte(`${plural(lerNomes().length, "nome digitado", "nomes digitados")}.`);
    atualizarResumos();
  });

  // Planilha: Excel (.xlsx, .xls), LibreOffice (.ods) ou CSV.
  const PALAVRA_NOME = /^(nome|nomes|aluno|alunos|aluno\(a\)|estudante|estudantes|nome do aluno|nome completo|nome do\(a\) aluno\(a\))$/i;

  function textoCelula(v) {
    return String(v ?? "").replace(/\s+/g, " ").trim();
  }
  function pareceNome(v) {
    const t = textoCelula(v);
    return t.length >= 2 && /[A-Za-zÀ-ÿ]/.test(t) && !/^\d+([.,]\d+)?$/.test(t);
  }

  function escolherColuna(linhas) {
    const largura = Math.max(0, ...linhas.map((l) => l.length));
    // 1) Cabeçalho com "Nome", "Aluno"... em uma das 5 primeiras linhas.
    for (let r = 0; r < Math.min(5, linhas.length); r++) {
      for (let c = 0; c < largura; c++) {
        if (PALAVRA_NOME.test(textoCelula(linhas[r][c]))) return { coluna: c, cabecalho: r };
      }
    }
    // 2) Senão, a coluna com mais textos que parecem nomes.
    let melhor = 0, pontos = -1;
    for (let c = 0; c < largura; c++) {
      const p = linhas.reduce((s, l) => s + (pareceNome(l[c]) ? 1 : 0), 0);
      if (p > pontos) { melhor = c; pontos = p; }
    }
    return { coluna: melhor, cabecalho: -1 };
  }

  function letraColuna(c) {
    let s = "";
    for (c += 1; c > 0; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(65 + ((c - 1) % 26)) + s;
    return s;
  }

  function aplicarPlanilha() {
    const { linhas } = planilha.abas[planilha.aba];
    const nomes = linhas
      .filter((_, r) => r > planilha.cabecalho)
      .map((l) => textoCelula(l[planilha.coluna]))
      .filter((t) => pareceNome(t) && !PALAVRA_NOME.test(t));
    campoNomes.value = nomes.join("\n");
    const total = lerNomes().length;
    mostrarFonte(
      `<span class="badge bg-success me-1">PLANILHA</span> <b>${esc(planilha.nome)}</b>` +
        (planilha.abas.length > 1 ? `, aba “${esc(planilha.abas[planilha.aba].nome)}”` : "") +
        `: ${plural(total, "aluno", "alunos")}.`
    );
    if (total === 0) mostrarFonte(`<span class="d-block alert alert-danger py-2 mb-0">Não encontrei nomes nessa coluna. Escolha outra coluna acima.</span>`);
    atualizarResumos();
  }

  function montarSeletorColuna() {
    const { linhas } = planilha.abas[planilha.aba];
    const largura = Math.max(1, ...linhas.map((l) => l.length));
    const opcoesAba = planilha.abas.length > 1
      ? planilha.abas.map((a, i) => `<option value="aba:${i}" ${i === planilha.aba ? "selected" : ""}>Aba: ${esc(a.nome)}</option>`).join("")
      : "";
    const opcoesCol = Array.from({ length: largura }, (_, c) => {
      const titulo = planilha.cabecalho >= 0 ? textoCelula(linhas[planilha.cabecalho][c]) : "";
      const amostra = textoCelula((linhas.find((l, r) => r > planilha.cabecalho && pareceNome(l[c])) || [])[c]);
      const rotulo = `Coluna ${letraColuna(c)}${titulo ? ` (${titulo})` : ""}${amostra ? `: ${amostra}` : ""}`;
      return `<option value="col:${c}" ${c === planilha.coluna ? "selected" : ""}>${esc(rotulo.slice(0, 70))}</option>`;
    }).join("");
    selColuna.innerHTML = (opcoesAba ? `<optgroup label="Aba da planilha">${opcoesAba}</optgroup>` : "") + `<optgroup label="Coluna">${opcoesCol}</optgroup>`;
    blocoColuna.hidden = false;
  }

  selColuna.addEventListener("change", () => {
    const [tipo, valor] = selColuna.value.split(":");
    if (tipo === "aba") {
      planilha.aba = Number(valor);
      Object.assign(planilha, escolherColuna(planilha.abas[planilha.aba].linhas));
    } else {
      planilha.coluna = Number(valor);
      // O cabeçalho só vale se estiver na coluna escolhida.
      const { linhas } = planilha.abas[planilha.aba];
      const r = linhas.slice(0, 5).findIndex((l) => PALAVRA_NOME.test(textoCelula(l[planilha.coluna])));
      planilha.cabecalho = r;
    }
    montarSeletorColuna();
    aplicarPlanilha();
  });

  async function abrirArquivo(arquivo) {
    if (!arquivo) return;
    if (typeof XLSX === "undefined") {
      return mostrarFonte(`<span class="d-block alert alert-danger py-2 mb-0">Não consegui carregar o leitor de planilhas. Recarregue a página.</span>`);
    }
    try {
      const dados = await arquivo.arrayBuffer();
      const livro = XLSX.read(dados, { type: "array", codepage: 65001 });
      const abasLidas = livro.SheetNames.map((nome) => ({
        nome,
        linhas: XLSX.utils.sheet_to_json(livro.Sheets[nome], { header: 1, defval: "", blankrows: false, raw: false }),
      })).filter((a) => a.linhas.length);
      if (!abasLidas.length) throw new Error("vazia");
      planilha = { nome: arquivo.name, abas: abasLidas, aba: 0 };
      Object.assign(planilha, escolherColuna(abasLidas[0].linhas));
      montarSeletorColuna();
      aplicarPlanilha();
    } catch (e) {
      planilha = null;
      blocoColuna.hidden = true;
      mostrarFonte(`<span class="d-block alert alert-danger py-2 mb-0">Não consegui ler “${esc(arquivo.name)}”. Use uma planilha do Excel (.xlsx ou .xls), do LibreOffice (.ods) ou um arquivo .csv.</span>`);
    }
  }

  campoArquivo.addEventListener("change", () => abrirArquivo(campoArquivo.files[0]));
  ["dragenter", "dragover"].forEach((ev) => areaArquivo.addEventListener(ev, (e) => { e.preventDefault(); areaArquivo.classList.add("arrastando"); }));
  ["dragleave", "drop"].forEach((ev) => areaArquivo.addEventListener(ev, () => areaArquivo.classList.remove("arrastando")));
  areaArquivo.addEventListener("drop", (e) => { e.preventDefault(); abrirArquivo(e.dataTransfer.files[0]); });

  // ---------- Exportar, copiar, imprimir ----------
  function baixarExcel(nomeArquivo, abasPlanilha) {
    const livro = XLSX.utils.book_new();
    abasPlanilha.forEach(({ nome, linhas, larguras }) => {
      const folha = XLSX.utils.aoa_to_sheet(linhas);
      if (larguras) folha["!cols"] = larguras.map((w) => ({ wch: w }));
      XLSX.utils.book_append_sheet(livro, folha, nome);
    });
    XLSX.writeFile(livro, nomeArquivo);
  }

  async function copiar(texto, botao) {
    const original = botao.textContent;
    try {
      await navigator.clipboard.writeText(texto);
      botao.textContent = "Copiado";
    } catch (e) {
      const area = document.createElement("textarea");
      area.value = texto;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand && document.execCommand("copy");
      area.remove();
      botao.textContent = ok ? "Copiado" : "Não deu para copiar";
    }
    setTimeout(() => (botao.textContent = original), 1800);
  }

  function hoje() {
    return new Date().toLocaleDateString("pt-BR");
  }

  // ---------- 2. Sortear grupos ----------
  const saidaSort = $("#saida-sortear");
  let ultimoSorteio = null;

  function cartoesGrupos(grupos, extra) {
    return grupos
      .map((g, i) => `
        <div class="col"><article class="card h-100 shadow-sm grupo" style="--h:${corDoGrupo(i)}"><div class="card-body">
          <h3 class="h5 card-title d-flex justify-content-between align-items-baseline">Grupo ${g.numero} <span class="badge bg-light text-dark fw-normal">${plural(g.membros.length, "aluno", "alunos")}</span></h3>
          ${extra ? extra(g) : ""}
          <ol class="mb-0 ps-3">${g.membros.map((m) => `<li>${esc(m)}</li>`).join("")}</ol>
        </div></article></div>`)
      .join("");
  }

  function sortear() {
    const nomes = lerNomes();
    const grupos = inteiro($("#sort-grupos"), 1, 200);
    const erro = verificarDivisao(nomes.length, grupos);
    if (erro) return (saidaSort.innerHTML = `<div class="alert alert-danger mb-0">${esc(erro)}</div>`);
    const modo = $('input[name="sort-modo"]:checked').value;
    const lista = formarGrupos(nomes, grupos, modo);
    ultimoSorteio = { lista, modo };
    const comoFoi = { sortear: "sorteados", ordem: "na ordem da lista", alfabetica: "em ordem alfabética" }[modo];
    saidaSort.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h2 class="h4 mb-1">${plural(grupos, "grupo", "grupos")}, alunos ${comoFoi}</h2>
          <p class="text-muted mb-0">${nomes.length} alunos: ${esc(descreverDivisao(nomes.length, grupos).frase)}. Gerado em ${hoje()}.</p>
        </div>
        <div class="botoes d-flex flex-wrap gap-2">
          ${modo === "sortear" ? '<button type="button" class="btn btn-warning" id="sort-de-novo">Sortear de novo</button>' : ""}
          <button type="button" class="btn btn-outline-secondary" id="sort-copiar">Copiar</button>
          <button type="button" class="btn btn-success" id="sort-excel">Baixar Excel</button>
          <button type="button" class="btn btn-outline-secondary" id="sort-imprimir">Imprimir</button>
        </div>
      </div>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">${cartoesGrupos(lista)}</div>`;

    $("#sort-de-novo")?.addEventListener("click", sortear);
    $("#sort-imprimir").addEventListener("click", () => window.print());
    $("#sort-copiar").addEventListener("click", (e) =>
      copiar(lista.map((g) => `Grupo ${g.numero} (${g.membros.length} alunos)\n` + g.membros.map((m, i) => `${i + 1}. ${m}`).join("\n")).join("\n\n"), e.currentTarget)
    );
    $("#sort-excel").addEventListener("click", () => {
      const linhas = [["Grupo", "Nº", "Aluno"]];
      lista.forEach((g) => g.membros.forEach((m, i) => linhas.push([`Grupo ${g.numero}`, i + 1, m])));
      baixarExcel("grupos-da-turma.xlsx", [{ nome: "Grupos", linhas, larguras: [10, 5, 38] }]);
    });
  }
  $("#sort-gerar").addEventListener("click", sortear);
  $("#sort-grupos").addEventListener("input", atualizarResumos);

  // ---------- 3. Seminário ----------
  const saidaSem = $("#saida-seminario");
  const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

  function dataLocal(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  const chaveData = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const mostraData = (d) => `${DIAS[d.getDay()]}, ${d.toLocaleDateString("pt-BR")}`;
  const isoDe = (d) => chaveData(d);

  // Lê "02/11/2026", "2/11", "2026-11-02"... Sem ano: usa o ano da primeira apresentação
  // (ou o seguinte, se a data já passou).
  function lerDatasPuladas(texto, inicio) {
    const datas = new Set(), invalidas = [];
    texto.split(/[\n,;]+/).map((t) => t.trim()).filter(Boolean).forEach((t) => {
      let d = null, m;
      if ((m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(t))) {
        let ano = m[3] ? Number(m[3]) : inicio.getFullYear();
        if (m[3] && m[3].length === 2) ano += 2000;
        d = new Date(ano, Number(m[2]) - 1, Number(m[1]));
        if (!m[3] && d < inicio) d = new Date(ano + 1, Number(m[2]) - 1, Number(m[1]));
        if (d.getDate() !== Number(m[1])) d = null;
      } else if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t))) {
        d = dataLocal(t);
      }
      if (d) datas.add(chaveData(d)); else invalidas.push(t);
    });
    return { datas, invalidas };
  }

  function montarDatas(qtdDias, inicio, diasSemana, puladas) {
    const datas = [];
    const d = new Date(inicio);
    for (let passos = 0; datas.length < qtdDias && passos < 2000; passos++) {
      if (diasSemana.has(d.getDay()) && !puladas.has(chaveData(d))) datas.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return datas;
  }

  function seminario() {
    const nomes = lerNomes();
    const qtdGrupos = inteiro($("#sem-grupos"), 1, 200);
    const erro = verificarDivisao(nomes.length, qtdGrupos);
    if (erro) return (saidaSem.innerHTML = `<div class="alert alert-danger mb-0">${esc(erro)}</div>`);
    const porDia = inteiro($("#sem-por-dia"), 1, 20);
    if (porDia === null) return (saidaSem.innerHTML = `<div class="alert alert-danger mb-0">Digite quantos grupos se apresentam por dia (de 1 a 20).</div>`);
    const inicio = dataLocal($("#sem-inicio").value);
    if (!inicio) return (saidaSem.innerHTML = `<div class="alert alert-danger mb-0">Escolha a data da primeira apresentação.</div>`);
    const diasSemana = new Set($$("#sem-dias input:checked").map((c) => Number(c.value)));
    if (!diasSemana.size) return (saidaSem.innerHTML = `<div class="alert alert-danger mb-0">Marque pelo menos um dia da semana com aula da disciplina.</div>`);

    const avisos = [];
    const { datas: puladas, invalidas } = lerDatasPuladas($("#sem-pular").value, inicio);
    if (invalidas.length) avisos.push(`Não entendi ${invalidas.length === 1 ? "a data" : "as datas"} ${invalidas.map((t) => `“${esc(t)}”`).join(", ")} em “Datas sem aula”. Use o formato 02/11/2026.`);

    // Grupos (sempre sorteados) e temas.
    const grupos = formarGrupos(nomes, qtdGrupos, "sortear");
    let temas = $("#sem-temas").value.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
    if ($('input[name="sem-temas-modo"]:checked').value === "sortear") temas = embaralhar(temas);
    if (temas.length < qtdGrupos) {
      avisos.push(temas.length
        ? `Há ${plural(temas.length, "tema", "temas")} para ${qtdGrupos} grupos. ${qtdGrupos - temas.length === 1 ? "Um grupo ficou" : `${qtdGrupos - temas.length} grupos ficaram`} com o tema “A definir”.`
        : "Nenhum tema foi informado. Os grupos ficaram com o tema “A definir”.");
    } else if (temas.length > qtdGrupos) {
      avisos.push(`Há mais temas do que grupos. ${plural(temas.length - qtdGrupos, "tema ficou", "temas ficaram")} sem grupo: ${temas.slice(qtdGrupos).map(esc).join(", ")}.`);
    }

    const datas = montarDatas(Math.ceil(qtdGrupos / porDia), inicio, diasSemana, puladas);
    if (datas.length * porDia < qtdGrupos) {
      return (saidaSem.innerHTML = `<div class="alert alert-danger mb-0">Não encontrei dias de aula suficientes. Confira os dias da semana marcados e as datas sem aula.</div>`);
    }
    if (chaveData(datas[0]) !== chaveData(inicio)) {
      avisos.push(`A data escolhida (${mostraData(inicio)}) não é um dia de aula marcado ou está entre as datas sem aula. O seminário começa em ${mostraData(datas[0])}.`);
    }
    grupos.forEach((g, i) => {
      g.tema = temas[i] || "A definir";
      g.data = datas[Math.floor(i / porDia)];
      g.ordemNoDia = (i % porDia) + 1;
    });

    const linhasTabela = grupos.map((g, i) => `
      <tr class="${i > 0 && g.ordemNoDia === 1 ? "novo-dia" : ""}" style="--h:${corDoGrupo(i)}">
        <td class="data">${g.ordemNoDia === 1 ? esc(mostraData(g.data)) : ""}</td>
        <td class="grupo-nome"><span class="marca"></span>Grupo ${g.numero}</td>
        <td><b>${esc(g.tema)}</b></td>
        <td>${g.membros.map(esc).join(", ")}</td>
      </tr>`).join("");

    const ultimo = datas[datas.length - 1];
    saidaSem.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h2 class="h4 mb-1">Seminário: ${plural(qtdGrupos, "grupo", "grupos")} em ${plural(datas.length, "dia", "dias")}</h2>
          <p class="text-muted mb-0">De ${esc(mostraData(datas[0]))} a ${esc(mostraData(ultimo))}, ${plural(porDia, "grupo", "grupos")} por dia. ${nomes.length} alunos: ${esc(descreverDivisao(nomes.length, qtdGrupos).frase)}.</p>
        </div>
        <div class="botoes d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-warning" id="sem-de-novo">Sortear de novo</button>
          <button type="button" class="btn btn-outline-secondary" id="sem-copiar">Copiar</button>
          <button type="button" class="btn btn-success" id="sem-excel">Baixar Excel</button>
          <button type="button" class="btn btn-outline-secondary" id="sem-imprimir">Imprimir</button>
        </div>
      </div>
      ${avisos.map((a) => `<div class="alert alert-warning nao-imprimir mb-0">${a}</div>`).join("")}
      <div class="card shadow-sm"><div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>Data</th><th>Grupo</th><th>Tema</th><th>Integrantes</th></tr></thead>
          <tbody>${linhasTabela}</tbody>
        </table>
      </div></div>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">${cartoesGrupos(grupos, (g) => `<p class="fw-bold text-primary mb-0">${esc(g.tema)}</p><p class="small text-muted mb-2">${esc(mostraData(g.data))}${porDia > 1 ? ` · ${g.ordemNoDia}º a apresentar` : ""}</p>`)}</div>`;

    $("#sem-de-novo").addEventListener("click", seminario);
    $("#sem-imprimir").addEventListener("click", () => window.print());
    $("#sem-copiar").addEventListener("click", (e) =>
      copiar(grupos.map((g) => `${mostraData(g.data)} | Grupo ${g.numero}: ${g.tema}\n` + g.membros.map((m, i) => `${i + 1}. ${m}`).join("\n")).join("\n\n"), e.currentTarget)
    );
    $("#sem-excel").addEventListener("click", () => {
      const cronograma = [["Data", "Dia", "Ordem", "Grupo", "Tema", "Integrantes"]];
      grupos.forEach((g) => cronograma.push([g.data.toLocaleDateString("pt-BR"), DIAS[g.data.getDay()], g.ordemNoDia, `Grupo ${g.numero}`, g.tema, g.membros.join(", ")]));
      const alunos = [["Aluno", "Grupo", "Tema", "Data da apresentação"]];
      grupos.forEach((g) => g.membros.forEach((m) => alunos.push([m, `Grupo ${g.numero}`, g.tema, g.data.toLocaleDateString("pt-BR")])));
      alunos.splice(1, alunos.length, ...alunos.slice(1).sort((a, b) => comparaNomes(a[0], b[0])));
      baixarExcel("seminario.xlsx", [
        { nome: "Cronograma", linhas: cronograma, larguras: [12, 6, 7, 10, 32, 70] },
        { nome: "Por aluno", linhas: alunos, larguras: [36, 10, 32, 20] },
      ]);
    });
  }
  $("#sem-gerar").addEventListener("click", seminario);
  $("#sem-grupos").addEventListener("input", atualizarResumos);

  // Primeira apresentação: o próximo dia útil daqui a uma semana.
  (function datasPadrao() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    $("#sem-inicio").value = isoDe(d);
    const outro = d.getDay() <= 3 ? d.getDay() + 2 : d.getDay() - 2; // dois dias de aula por semana
    $$("#sem-dias input").forEach((c) => (c.checked = [d.getDay(), outro].includes(Number(c.value))));
  })();

  // ---------- Início: com uma turma de exemplo, para a tela já mostrar o resultado ----------
  campoNomes.value = EXEMPLO.join("\n");
  mostrarFonte(`<span class="badge bg-warning text-dark me-1">EXEMPLO</span> Turma fictícia com ${EXEMPLO.length} alunos. Troque pela sua planilha ou pelos seus nomes.`);
  let abaInicial = abas[0];
  try {
    const salva = localStorage.getItem("grupos-aba");
    if (salva && $("#" + salva)) abaInicial = $("#" + salva);
  } catch (e) { /* sem armazenamento: abre na primeira aba */ }
  abrirAba(abaInicial);
  calcular();
  atualizarResumos();
  sortear();
  seminario();
})();
