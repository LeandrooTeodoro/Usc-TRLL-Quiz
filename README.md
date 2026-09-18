# Segurança em Içamento — Quiz TRLL

Projeto Bootcamp Extensionista (UNISAGRADO — Ciências da Computação, disciplina
*Gamificação e Processamento de Imagens*) desenvolvido para a **TRLL Engenharia
LTDA**, atendendo à demanda real levantada com o Eng. Tadeu Teodoro (ver
`docs/roteiro_contato_instituicao_TRLL_preenchido.pdf`): um minigame educativo
offline sobre NR 11 para operadores de guindaste, sinaleiros/riggers e
ajudantes.

Os três documentos-fonte usados neste projeto estão em `docs/`:
`Avaliacao_Qualificacao_NR11_Operadores.pdf` (banco de questões),
`roteiro_contato_instituicao_TRLL_preenchido.pdf` (levantamento de demanda) e
`Facul_preenchido.pdf` (Entrega 1 — proposta formal apresentada à disciplina).

O material de apoio para a apresentação do projeto está em `apresentacao/`:
`Roteiro_Slides_Quiz_TRLL.pdf` e `Roteiro_Fala_Quiz_TRLL.pdf`.

## O que já está implementado

| Módulo | Status | Onde |
|---|---|---|
| Quiz PWA offline (22 questões) | ✅ Funcional | `public/` |
| Cadastro/login local (colaborador e gestor) | ✅ Funcional | `public/js/app.js` |
| Painel do gestor (agrupado por empresa, filtro por data) | ✅ Funcional | `public/js/app.js` |
| Exportação em PDF (por empresa e/ou por data) | ✅ Funcional, 100% offline (jsPDF local) | `public/js/app.js`, `public/js/vendor/jspdf.umd.min.js` |
| Sincronização offline → Supabase | ✅ Configurada e testada em produção | `public/js/supabase-client.js`, `public/config.js` |
| Schema Supabase (tabelas + RLS liberada via anon key) | ✅ Aplicado no projeto Supabase em uso | `supabase/schema.sql` |
| Deploy em produção (Vercel, deploy automático a cada push em `main`) | ✅ No ar (só o quiz — ver nota sobre o módulo de visão abaixo) | `vercel.json` |

## Conteúdo do quiz

As 20 questões do PDF **Avaliação de Qualificação Técnica - NR 11** fornecido
foram convertidas para o formato de quiz auto-corrigível (múltipla escolha,
numérica ou seleção múltipla) em `public/js/quiz-questions.js`, mantendo os
mesmos cenários, valores numéricos e fórmulas do documento original.

Duas questões adicionais (21 e 22) foram criadas a partir do
**levantamento de demanda com a TRLL** (`roteiro_contato_instituicao_TRLL_preenchido.pdf`),
que identificou "efeito do ângulo da linga" e "capacidade x raio de operação"
como os dois temas de maior dificuldade de memorização em campo — e que não
tinham questão equivalente no banco original. Essas duas questões também
confrontam diretamente os mitos mais citados pela instituição ("guindaste de
80 t aguenta 80 t", "abrir a linga deixa a carga mais estável").

## Como rodar localmente (quiz)

O Service Worker exige `http://` (não abre via `file://`). Qualquer servidor
estático simples resolve:

```bash
cd public
python -m http.server 8000
# ou: npx serve .
```

Acesse `http://localhost:8000`. No primeiro acesso, cadastre-se como
**Colaborador** (qualquer nome/cargo) ou como **Gestor** usando o código de
teste `TRLL-2026` (definido em `public/js/app.js`, função `handleCadastro`
— trocar por autenticação real do Supabase Auth antes de produção).

## Como conectar ao Supabase (opcional para rodar; necessário para agregar dados entre aparelhos)

Este repositório já está configurado com um projeto Supabase real
(`public/config.js`, versionado — ver nota sobre a anon key abaixo), então
rodando localmente ou publicado na Vercel, a sincronização entre aparelhos já
funciona. O passo a passo abaixo serve para quem for apontar o projeto para
um Supabase próprio (ex.: outra instância/ambiente):

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode `supabase/schema.sql` no SQL Editor do projeto.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public
   key** e preencha `public/config.js` (`SUPABASE_URL` e `SUPABASE_ANON_KEY`).
   Esse arquivo já é carregado em `index.html` antes de `js/supabase-client.js`.

A anon key é uma chave pública por design — o acesso real é controlado pelas
políticas de RLS em `supabase/schema.sql`, então `public/config.js` pode ser
versionado normalmente (diferente de uma `service_role` key, que nunca deve
ir para o cliente).

Sem esse passo, o app funciona 100% em modo local (localStorage) — o que já
atende ao requisito de funcionamento offline em campo. Quando configurado, a
fila de sincronização (`db.js` + `supabase-client.js`) envia os dados
pendentes assim que o aparelho volta a ficar online.

**Nota sobre autenticação:** o login do app é local, sem senha (ver
"Próximos passos"), então não há sessão de Supabase Auth. As políticas de RLS
liberam leitura/escrita para qualquer requisição com a anon key — aceitável
para este uso interno (treinamento NR-11, sem dados sensíveis), mas deve
evoluir para Supabase Auth real antes de qualquer uso com dados mais
sensíveis.

## Deploy (Vercel)

O quiz está publicado na Vercel, importado diretamente do repositório GitHub
(`LeandrooTeodoro/Usc-TRLL-Quiz`, branch `main`). `vercel.json` publica
`public/` como site estático — **qualquer `git push` para `main` gera um
redeploy automático**, sem precisar repetir a configuração pelo painel.

`api/detect_epi.py` (módulo de visão) não faz parte desse deploy: ver
"Módulo de processamento de imagens" abaixo para o motivo (limite de tamanho
de função serverless) e as alternativas.

## Painel do gestor e relatório em PDF

- Os colaboradores são agrupados por **Empresa/Setor** (campo preenchido no
  cadastro), em ordem alfabética dentro de cada grupo.
- Filtros de **empresa** e de **data** (`gestorFilterEmpresa` / `gestorFilterData`
  em `index.html`) controlam tanto o que aparece na tela quanto o que é
  exportado — é possível exportar o resultado de um dia específico (ex.:
  12/09/2026) mesmo depois de outras tentativas terem sido feitas em outras
  datas, ou exportar tudo deixando a data em branco.
- Se um colaborador refizer o quiz, apenas a **tentativa mais recente** dele é
  considerada (tanto no painel quanto no PDF) — as tentativas antigas ficam
  guardadas no histórico local, mas não contam mais para a nota exibida.
- O PDF é gerado no próprio navegador com `jsPDF` (biblioteca local, sem
  depender de internet — cacheada pelo Service Worker), então a exportação
  funciona mesmo offline. Uma seção por empresa, título
  `Resultado NR11 da empresa "Nome da Empresa"`, lista alfabética com nota
  (`acertos/total — percentual%`) e, ao final do documento inteiro, o aviso
  fixo: *"O quiz não possui edições e nenhuma possibilidade de alteração,
  então não tem possibilidade da nota estar errada."*

## Módulo de processamento de imagens

`api/detect_epi.py` é uma função serverless Python (runtime da Vercel) que usa
YOLOv8 (`ultralytics`) para detectar pessoas na imagem e cruzar a posição de
cada uma com um polígono de "zona de risco" (ex.: área sob o gancho/carga)
definido pelo gestor. Retorna se há pessoa dentro da zona de risco.

**Limitação a ser resolvida em versão futura:** o modelo pré-treinado (COCO)
não possui classe de capacete/EPI — apenas "person". Detecção real de uso de
capacete exige treinar um modelo com dataset específico (ex.: *Hard Hat
Workers Dataset*, Roboflow) e apontar `TRLL_YOLO_MODEL_PATH` para os novos
pesos. A interface do endpoint já foi desenhada para essa troca não exigir
mudanças no restante do sistema.

Este módulo depende de conexão (inferência roda no backend), diferente do
quiz — está alinhado com a resposta da TRLL de que o **quiz** é o item que
precisa ser offline; o módulo de imagem é usado pelo gestor, tipicamente com
conexão disponível.

**Deploy:** `ultralytics` traz `torch`/`torchvision` como dependência, o que
passa muito do limite de tamanho de função serverless da Vercel (pacote final
> 5 GB contra um máximo de 500 MB) — por isso `vercel.json` hoje só publica
`public/` (o quiz), e `api/detect_epi.py` não fica ativo nesse deploy. Para
publicar esse módulo, ele precisa de um host que aceite esse peso (ex.: uma
VM/container próprio, Render, Railway, Hugging Face Spaces) ou trocar
`ultralytics` por um runtime mais leve (ex.: ONNX Runtime com o modelo
exportado para `.onnx`, sem depender do `torch` completo).

## Identidade visual

Paleta azul institucional TRLL (placeholder até receber a paleta oficial e o
logotipo, conforme combinado no contato), fonte Calibri, verde = acerto/
liberação e vermelho = erro/bloqueio — mesma lógica semafórica usada nos
laudos técnicos da empresa (`public/css/style.css`).

## Próximos passos (não implementados ainda)

- Autenticação real via Supabase Auth (hoje o login é local, sem senha).
- Treinar modelo customizado de EPI para o módulo de imagem.
- Aplicar a paleta/logo oficiais da TRLL quando recebidos.
- Testar com uma turma real de treinamento NR-11 (piloto combinado com o
  Eng. Tadeu Teodoro) e ajustar o banco de questões conforme feedback.
- Publicar `api/detect_epi.py` num host que aceite o peso do `ultralytics`
  (ou trocar por um runtime mais leve) — ver "Módulo de processamento de
  imagens" acima.
