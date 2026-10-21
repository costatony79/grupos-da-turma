# Grupos da Turma

App para o professor organizar a turma em grupos. Funciona inteiro no navegador:
a lista de alunos não é enviada para nenhum lugar.

## O que ele faz

1. **Calcular**: informe o número de alunos e de grupos, e o app diz quantos alunos
   ficam em cada grupo. Quando a conta não dá exata, os alunos que sobram vão um para
   cada grupo, e nenhum grupo fica com mais de um aluno de diferença
   (32 alunos em 5 grupos: 2 grupos de 7 e 3 grupos de 6).
2. **Sortear grupos**: carregue a lista de chamada (Excel `.xlsx`/`.xls`, LibreOffice
   `.ods` ou `.csv`) ou digite os nomes, escolha a quantidade de grupos e o app monta
   os grupos sorteados, na ordem da lista ou em ordem alfabética.
3. **Seminário**: faz o mesmo sorteio e acrescenta um tema e uma data de apresentação
   para cada grupo, usando os dias com aula da disciplina e pulando as datas sem aula.

Os resultados podem ser copiados, impressos ou baixados como planilha do Excel.

## Planilha da turma

O app encontra sozinho a coluna com os nomes: procura um cabeçalho como "Nome",
"Aluno" ou "Nome do aluno" e, se não achar, usa a coluna com mais nomes. Se a
planilha tiver várias abas ou a coluna errada for escolhida, troque no campo
"Coluna com os nomes". Linhas vazias, números e nomes repetidos são ignorados.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie estes arquivos.
2. Em **Settings > Pages**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.

Para testar no computador, basta abrir o `index.html` no navegador.

## Arquivos

- `index.html`: a página.
- `js/app.js`: as contas, o sorteio e o cronograma.
- `css/bootstrap.min.css`: visual do [Bootstrap 5.0.2](https://getbootstrap.com)
  (licença MIT, em `css/bootstrap-LICENSE.txt`).
- `js/xlsx.full.min.js`: biblioteca [SheetJS](https://sheetjs.com) para ler e gravar
  planilhas (licença Apache 2.0, em `js/xlsx-LICENSE.txt`).
