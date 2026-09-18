/**
 * Banco de questões — Segurança em Içamento: Quiz TRLL
 *
 * Fonte principal: "Avaliação de Qualificação Técnica - NR 11" (PDF fornecido pela
 * TRLL Engenharia), questões 1-20, adaptadas para formato de quiz auto-corrigível
 * offline (múltipla escolha / numérica / seleção múltipla).
 *
 * Questões 21 e 22 foram elaboradas a partir do levantamento de demanda feito com
 * o Eng. Tadeu Teodoro (roteiro de contato institucional), que apontou "efeito do
 * ângulo da linga" e "capacidade x raio de operação" como os dois temas de maior
 * dificuldade de memorização em campo, sem questão equivalente no banco original.
 *
 * type:
 *  - "multipla"     -> 1 alternativa correta (correctIndex)
 *  - "numerica"      -> resposta numérica com tolerância (correctValue, tolerance, unit)
 *  - "multi_select"  -> várias alternativas corretas (correctIndices[])
 *
 * category (blocos temáticos definidos com a TRLL):
 *  - peso_cg              Peso e centro de gravidade da carga
 *  - acessorios_wll       Seleção/inspeção de acessórios e leitura de WLL
 *  - angulo_linga         Ângulo da linga e capacidade do conjunto
 *  - capacidade_raio      Capacidade do guindaste em função do raio
 *  - area_exclusao        Área de exclusão, cabo-guia e sinalização
 *  - condicoes_suspensao  Condições que exigem suspender a operação
 *  - documentacao         Documentação, checklist e procedimentos gerais NR11
 */

const QUIZ_QUESTIONS = [
  {
    id: "q1",
    block: "PARTE_I",
    category: "acessorios_wll",
    type: "multipla",
    title: "Inspeção e Descarte de Cabos de Aço",
    scenario:
      "Durante a inspeção pré-operacional de uma ponte rolante em um galpão industrial, o operador observa arames rompidos e sinais de corrosão acentuada no cabo de aço do guincho principal.",
    question:
      "De acordo com as diretrizes de segurança da NR 11 e normas técnicas associadas, qual deve ser a conduta imediata do operador?",
    options: [
      "Reduzir a capacidade de carga da ponte rolante em 50% e continuar a operação normalmente.",
      "Interromper o uso do equipamento imediatamente, sinalizar o bloqueio e reportar ao setor de manutenção para substituição.",
      "Aumentar a velocidade de içamento para diminuir o tempo de exposição da carga suspensa.",
      "Aplicar lubrificante industrial sobre a área corroída e realizar o teste de carga máxima antes da operação.",
    ],
    correctIndex: 1,
    explanation:
      "Arames rompidos e corrosão acentuada são critérios de descarte imediato do cabo de aço. O equipamento deve ser bloqueado (bloqueio/etiquetagem) e a manutenção acionada antes de qualquer nova operação.",
  },
  {
    id: "q2",
    block: "PARTE_I",
    category: "area_exclusao",
    type: "multipla",
    title: "Transporte de Cargas com Visão Obstruída",
    scenario:
      "Um operador de empilhadeira precisa transportar um palete com caixas volumosas que cobrem completamente sua visão frontal.",
    question:
      "Qual é o procedimento operacional correto e seguro determinado pelas normas de movimentação de carga?",
    options: [
      "Elevar a carga acima do nível dos olhos para enxergar por baixo do palete durante o trajeto.",
      "Deslocar-se com a empilhadeira em marcha à ré, mantendo a carga baixa e a visão desimpedida no sentido do deslocamento.",
      "Dirigir em velocidade máxima acionando a buzina continuamente para afastar pedestres.",
      "Colocar o corpo para fora da cabine lateralmente para observar a pista enquanto avança de frente.",
    ],
    correctIndex: 1,
    explanation:
      "Com visão frontal obstruída, o deslocamento deve ser feito em marcha à ré, carga baixa (próxima ao solo) e visão livre no sentido do movimento, nunca expondo o corpo para fora da cabine.",
  },
  {
    id: "q3",
    block: "PARTE_I",
    category: "documentacao",
    type: "multipla",
    title: "Validade do Cartão de Identificação",
    scenario:
      "Um operador qualificado e habilitado para operação de guindastes móveis possui seu Cartão de Identificação de Operador emitido pela empresa.",
    question:
      "Segundo a NR 11, qual é a periodicidade máxima de validade do exame de saúde e do Cartão de Identificação do operador?",
    options: ["6 meses.", "1 ano (12 meses).", "2 anos (24 meses).", "5 anos (60 meses)."],
    correctIndex: 1,
    explanation:
      "O exame de saúde e o Cartão de Identificação do operador devem ser renovados a cada 12 meses (1 ano).",
  },
  {
    id: "q4",
    block: "PARTE_I",
    category: "acessorios_wll",
    type: "multipla",
    title: "Cálculo do Fator de Segurança (FS)",
    scenario:
      "Uma cinta de poliéster para elevação de carga possui uma Carga de Ruptura Nominal (Rn) de 24.000 kgf. O setor de segurança estabeleceu que a Carga Máxima de Trabalho (Lmáx) permitida para esta operação é de 4.000 kgf.",
    question:
      "Fórmula: FS = Rn / Lmáx. Qual é o Fator de Segurança (FS) aplicado a este acessório de elevação?",
    options: ["FS = 4", "FS = 5", "FS = 6", "FS = 8"],
    correctIndex: 2,
    explanation: "FS = Rn / Lmáx = 24.000 / 4.000 = 6.",
  },
  {
    id: "q5",
    block: "PARTE_I",
    category: "documentacao",
    type: "multipla",
    title: "Armazenamento e Obstrução de Vias",
    scenario:
      "Durante o armazenamento de pallets em um almoxarifado de grande porte, faltam espaços nas prateleiras porta-paletes.",
    question:
      "Qual das seguintes práticas descumpre diretamente as exigências da NR 11 referente ao empilhamento de materiais?",
    options: [
      "Empilhar materiais respeitando a capacidade de suporte do piso e a estabilidade da pilha.",
      "Posicionar materiais temporariamente cobrindo o acesso a extintores e saídas de emergência.",
      "Manter distância mínima de segurança das estruturas de iluminação e aspersores (sprinklers).",
      "Organizar os lotes garantindo corredores de circulação de no mínimo 1,20 m de largura para pedestres.",
    ],
    correctIndex: 1,
    explanation:
      "Obstruir extintores e saídas de emergência, mesmo que temporariamente, descumpre diretamente a norma e coloca em risco a resposta a emergências.",
  },
  {
    id: "q6",
    block: "PARTE_I",
    category: "capacidade_raio",
    type: "multipla",
    title: "Pressão no Solo e Sapatas de Apoio",
    scenario:
      "Um guindaste veicular de massa total igual a 10.000 kg precisa ser patolado. Cada uma das 4 sapatas de apoio possui uma área de contato de 0,5 m² com o solo. Considere g = 10 m/s².",
    question:
      "Fórmula: P_piso = F / A_contato (F = m · g). Qual é a pressão total aproximada exercida por cada sapata no solo, assumindo distribuição uniforme de peso?",
    options: ["25.000 Pa (25 kPa)", "50.000 Pa (50 kPa)", "100.000 Pa (100 kPa)", "200.000 Pa (200 kPa)"],
    correctIndex: 1,
    explanation:
      "F = 10.000 × 10 = 100.000 N. Dividido igualmente por 4 sapatas = 25.000 N por sapata. P = 25.000 / 0,5 = 50.000 Pa (50 kPa).",
  },
  {
    id: "q7",
    block: "PARTE_I",
    category: "documentacao",
    type: "multipla",
    title: "Identificação Visual de Equipamentos Motorizados",
    scenario:
      "A NR 11 determina regras claras sobre a sinalização e identificação visual presente em equipamentos de transporte motorizados (empilhadeiras, guindastes, pontes rolantes).",
    question: "O que DEVE estar obrigatoriamente escrito em local visível no equipamento?",
    options: [
      "Apenas o nome do fabricante e o ano de fabricação.",
      "A Carga Máxima de Trabalho permitida e a identificação do equipamento.",
      "O nome do operador titular do turno e o consumo de combustível.",
      "Apenas o logotipo da empresa proprietária do equipamento.",
    ],
    correctIndex: 1,
    explanation:
      "A Carga Máxima de Trabalho (capacidade) e a identificação do equipamento devem estar visíveis para qualquer pessoa antes de utilizá-lo ou se aproximar dele.",
  },
  {
    id: "q8",
    block: "PARTE_I",
    category: "condicoes_suspensao",
    type: "multipla",
    title: "Operação em Proximidade com Redes Elétricas",
    scenario:
      "Um guindaste móvel está posicionado para descarregar estruturas metálicas próximo a uma linha de distribuição de energia elétrica aérea de média tensão.",
    question:
      "De acordo com os protocolos de segurança de movimentação de carga, qual deve ser a principal medida preventiva?",
    options: [
      "Manter distância mínima de segurança das partes energizadas e utilizar um sinaleiro/guia dedicado.",
      "Operar normalmente, desde que os pneus do guindaste estejam calibrados.",
      "Encostar a lança na fiação elétrica caso seja revestida com tinta isolante.",
      "Executar o içamento em alta velocidade para reduzir o tempo perto da fiação.",
    ],
    correctIndex: 0,
    explanation:
      "Próximo a redes energizadas, é obrigatório manter a distância mínima de segurança e utilizar sinaleiro dedicado — pneus calibrados e tinta não isolam a lança.",
  },
  {
    id: "q9",
    block: "PARTE_I",
    category: "peso_cg",
    type: "multipla",
    title: "Momento de Tombamento da Empilhadeira",
    scenario:
      "Uma empilhadeira possui peso próprio Pemb = 30.000 N atuando a d1 = 1,2 m do eixo dianteiro. Ao elevar uma carga L = 15.000 N posicionada a d2 = 2,0 m do eixo dianteiro.",
    question:
      "Fórmula: M_estabilidade = Pemb·d1 − L·d2. Qual é o valor do Momento de Estabilidade e a condição da empilhadeira?",
    options: [
      "M = +6.000 N·m (Condição Estável)",
      "M = 0 N·m (Condição Limite de Tombamento)",
      "M = -6.000 N·m (Tombamento Iminente)",
      "M = +12.000 N·m (Condição Extremamente Estável)",
    ],
    correctIndex: 0,
    explanation:
      "M = (30.000 × 1,2) − (15.000 × 2,0) = 36.000 − 30.000 = +6.000 N·m. Momento positivo indica condição estável.",
  },
  {
    id: "q10",
    block: "PARTE_I",
    category: "area_exclusao",
    type: "multipla",
    title: "Operação com Cargas Suspensas",
    scenario:
      "Durante a movimentação de uma peça de aço de 8 toneladas por meio de ponte rolante dentro de um galpão industrial agitado.",
    question: "Qual é a regra fundamental de segurança quanto à circulação de pessoas na área de içamento?",
    options: [
      "É permitido transitar sob a carga desde que todos estejam de capacete com jugular.",
      "É rigorosamente proibido a permanência ou passagem de pessoas sob cargas suspensas.",
      "Apenas o operador do controle remoto pode andar debaixo da carga.",
      "Pode-se permanecer abaixo da carga se ela estiver amarrada com duas cintas de nylon.",
    ],
    correctIndex: 1,
    explanation:
      "Nenhuma condição de EPI ou amarração autoriza a permanência sob carga suspensa — a área de exclusão deve ser respeitada por todos, sem exceção.",
  },
  {
    id: "q11",
    block: "PARTE_II",
    category: "acessorios_wll",
    type: "numerica",
    title: "Cálculo da Carga Máxima de Trabalho (Lmáx)",
    scenario:
      "Um cabo de aço de alta resistência possui carga de ruptura nominal Rn = 18.000 kgf. O fator de segurança obrigatório definido pelo engenheiro responsável é FS = 6.",
    question:
      "Fórmula: Lmáx = Rn / FS. Qual é a Carga Máxima de Trabalho (Lmáx), em kgf, que este cabo pode transportar com segurança?",
    correctValue: 3000,
    tolerance: 0,
    unit: "kgf",
    explanation: "Lmáx = 18.000 / 6 = 3.000 kgf.",
  },
  {
    id: "q12",
    block: "PARTE_II",
    category: "acessorios_wll",
    type: "multipla",
    title: "Cálculo de Tensão de Tração em Acessórios",
    scenario:
      "Um olhal de içamento possui área efetiva de seção transversal Aef = 200 mm². Aplica-se uma força de tração Ft = 30.000 N. A tensão máxima admissível do aço é σ_adm = 200 MPa.",
    question:
      "Fórmula: σt = Ft / Aef ≤ σ_adm. Qual é a tensão de tração atuante no olhal e a condição do içamento?",
    options: [
      "100 MPa — SEGURO",
      "150 MPa — SEGURO",
      "150 MPa — INSEGURO",
      "200 MPa — INSEGURO",
    ],
    correctIndex: 1,
    explanation:
      "σt = 30.000 N / 200 mm² = 150 N/mm² = 150 MPa. Como 150 MPa ≤ 200 MPa (σ_adm), o içamento é SEGURO.",
  },
  {
    id: "q13",
    block: "PARTE_II",
    category: "documentacao",
    type: "multipla",
    title: "Sinalização Sonora de Ré",
    scenario:
      "A NR 11 exige itens obrigatórios de segurança para equipamentos de transporte motorizados que se deslocam em áreas fabris.",
    question:
      "Qual dispositivo de alarme sonoro e visual DEVE funcionar obrigatoriamente quando uma empilhadeira engata a marcha à ré?",
    options: [
      "Buzina manual acionada pelo operador apenas quando ele julgar necessário.",
      "Alarme sonoro automático de ré (bip) acompanhado de luz de alerta (giroflex/estroboscópica).",
      "Apenas o farol dianteiro em intensidade máxima.",
      "Nenhum dispositivo é exigido, basta atenção redobrada do operador.",
    ],
    correctIndex: 1,
    explanation:
      "O alarme sonoro automático de ré, associado à luz de alerta (giroflex), é obrigatório e deve acionar sozinho ao engatar a marcha à ré.",
  },
  {
    id: "q14",
    block: "PARTE_II",
    category: "peso_cg",
    type: "multipla",
    title: "Verificação de Capacidade de Carga do Piso",
    scenario:
      "Um lote de material com massa total de 12.000 kg será empilhado sobre paletes com área de contato de 3 m². g = 10 m/s². O piso suporta no máximo P_adm = 35.000 Pa (35 kPa).",
    question:
      "Fórmula: P_piso = m·g / A_contato. Calcule a pressão exercida e informe se o piso suporta este lote.",
    options: ["30 kPa — SUPORTA", "35 kPa — SUPORTA no limite", "40 kPa — NÃO SUPORTA", "45 kPa — SUPORTA com folga"],
    correctIndex: 2,
    explanation:
      "P = (12.000 × 10) / 3 = 40.000 Pa (40 kPa). Como 40 kPa > 35 kPa (P_adm), o piso NÃO SUPORTA o lote nesta configuração.",
  },
  {
    id: "q15",
    block: "PARTE_II",
    category: "documentacao",
    type: "multipla",
    title: "Inspeção Diária Pré-Operacional (Check-list)",
    scenario:
      "Antes de iniciar qualquer turno de trabalho com um equipamento de movimentação motorizado, o operador deve realizar uma rotina obrigatória de inspeção visual e funcional.",
    question:
      "Qual é o nome do documento formal preenchido pelo operador no início do turno para registrar as condições operacionais e de segurança do equipamento?",
    options: [
      "Relatório de manutenção corretiva.",
      "Checklist / Ficha de Inspeção Diária Pré-Operacional do equipamento.",
      "Nota fiscal de compra do equipamento.",
      "Manual do fabricante.",
    ],
    correctIndex: 1,
    explanation:
      "O checklist (ficha de inspeção diária pré-operacional) registra as condições do equipamento antes do início do turno.",
  },
  {
    id: "q16",
    block: "PARTE_II",
    category: "peso_cg",
    type: "multipla",
    title: "Distância de Centro de Carga (CDG) na Empilhadeira",
    scenario:
      "Uma empilhadeira possui capacidade nominal de 2.500 kg com centro de carga a 500 mm (0,5 m). O operador precisa movimentar uma carga de 2.500 kg cujo centro de gravidade fica a 800 mm (0,8 m) dos garfos.",
    question:
      "O que acontecerá com a estabilidade da empilhadeira se o operador tentar levantar essa carga nessa posição, e qual o risco imediato?",
    options: [
      "Nenhuma alteração — o peso total não mudou, então a empilhadeira suporta normalmente.",
      "A capacidade efetiva cai para cerca de 1.562 kg nessa distância; ao levantar 2.500 kg a 0,8 m a empilhadeira ultrapassa sua capacidade real, com risco de tombamento frontal.",
      "A estabilidade aumenta, pois a carga fica mais afastada do operador.",
      "Só há risco se a velocidade de deslocamento for alta.",
    ],
    correctIndex: 1,
    explanation:
      "Capacidade a 0,8 m ≈ (2.500 × 0,5) / 0,8 = 1.562,5 kg. Levantar 2.500 kg a essa distância excede a capacidade real e gera risco de tombamento frontal (para a frente).",
  },
  {
    id: "q17",
    block: "PARTE_II",
    category: "condicoes_suspensao",
    type: "multipla",
    title: "Procedimento em Caso de Falha de Freio em Carga Suspensa",
    scenario:
      "Durante o içamento de uma carga com ponte rolante, o operador percebe que o sistema de freio do guincho está deslizando e a carga começa a descer lentamente sem comando.",
    question: "Qual é a primeira e mais urgente ação do operador para garantir a integridade física das pessoas na área?",
    options: [
      "Continuar a operação rapidamente para descer a carga antes que o freio falhe de vez.",
      "Acionar imediatamente a parada de emergência, alertar e afastar todas as pessoas da área sob e ao redor da carga, isolando a zona de risco.",
      "Tentar ajustar o freio manualmente enquanto a carga ainda está suspensa.",
      "Ignorar, pois um deslizamento lento não é perigoso.",
    ],
    correctIndex: 1,
    explanation:
      "A prioridade absoluta é a integridade das pessoas: acionar a parada de emergência e isolar/afastar a área sob a carga antes de qualquer tentativa técnica de correção.",
  },
  {
    id: "q18",
    block: "PARTE_II",
    category: "area_exclusao",
    type: "multipla",
    title: "Sinalização Padronizada para Riggers / Sinaleiros",
    scenario:
      "Em operações de içamento complexas onde a visão do operador do guindaste é limitada, utiliza-se um profissional auxiliar de sinalização.",
    question:
      "Como é denominado o profissional responsável por orientar o operador por meio de sinais de mão padronizados ou rádio de comunicação?",
    options: ["Encarregado de obra.", "Sinaleiro (rigger).", "Técnico de segurança do trabalho.", "Operador reserva."],
    correctIndex: 1,
    explanation:
      "O sinaleiro (rigger) é o único profissional autorizado a orientar o operador durante a manobra, exceto pelo sinal de parada de emergência, que pode ser dado por qualquer pessoa.",
  },
  {
    id: "q19",
    block: "PARTE_II",
    category: "acessorios_wll",
    type: "multipla",
    title: "Acessórios de Amarrações de Carga — Descarte por Deformação",
    scenario:
      "Durante a inspeção de um gancho de elevação, mede-se uma abertura da garganta do gancho 15% maior do que a dimensão original de fábrica devido a sobrecarga prévia.",
    question: "Qual é a única ação permitida em relação a este gancho deformado?",
    options: [
      "Reforçar com solda e continuar usando.",
      "Reduzir a carga de trabalho pela metade e continuar usando.",
      "Retirar imediatamente de uso e descartar o gancho, substituindo-o por um novo.",
      "Usar apenas para cargas horizontais.",
    ],
    correctIndex: 2,
    explanation:
      "Abertura de garganta acima do limite (geralmente 10-15%, conforme norma/fabricante) invalida definitivamente o gancho — a única ação correta é o descarte, nunca reparo ou uso reduzido.",
  },
  {
    id: "q20",
    block: "PARTE_II",
    category: "documentacao",
    type: "multi_select",
    title: "Parada de Emergência e Desligamento do Equipamento",
    scenario:
      "Ao término do turno de trabalho, o operador de uma empilhadeira a combustão/elétrica deve estacionar o equipamento em local apropriado.",
    question:
      "Selecione as etapas obrigatórias do procedimento de desligamento e estacionamento seguro da empilhadeira antes de abandoná-la.",
    options: [
      "Abaixar completamente os garfos/carga até tocar o solo.",
      "Deixar o motor ligado para o próximo turno usar mais rápido.",
      "Colocar a alavanca em ponto neutro e acionar o freio de estacionamento.",
      "Desligar o motor, retirar a chave e travar o equipamento.",
      "Deixar a carga suspensa para economizar tempo no próximo turno.",
    ],
    correctIndices: [0, 2, 3],
    explanation:
      "Garfos no solo, freio de estacionamento acionado e motor desligado com chave retirada são as três etapas mínimas obrigatórias — nunca deixar motor ligado ou carga suspensa.",
  },
  {
    id: "q21",
    block: "BLOCO_TRLL",
    category: "angulo_linga",
    type: "multipla",
    title: "Efeito do Ângulo da Linga (levantado no contato com a TRLL)",
    scenario:
      "Uma linga de duas pernadas eleva uma carga. Quando o ângulo entre as pernadas e a horizontal diminui (linga mais aberta), a tração em cada pernada não se reduz na mesma proporção do peso dividido igualmente.",
    question: "Qual afirmação está correta sobre o efeito do ângulo da linga na tração das pernadas?",
    options: [
      "Quanto menor o ângulo em relação à horizontal (linga mais aberta), menor a tração em cada pernada.",
      "Quanto menor o ângulo em relação à horizontal (linga mais aberta), maior a tração em cada pernada, podendo ultrapassar o WLL do acessório.",
      "O ângulo da linga não interfere na tração das pernadas, apenas no aspecto visual do içamento.",
      "Abrir o ângulo da linga deixa sempre a carga mais estável e é recomendado.",
    ],
    correctIndex: 1,
    explanation:
      "Este é o mito mais recorrente apontado pela TRLL: \"abrir a linga deixa a carga mais estável\". Na prática, quanto mais aberta (menor ângulo com a horizontal), maior a tração em cada pernada — podendo ultrapassar o WLL do acessório mesmo sem alterar o peso da carga.",
  },
  {
    id: "q22",
    block: "BLOCO_TRLL",
    category: "capacidade_raio",
    type: "multipla",
    title: "Capacidade x Raio de Operação (levantado no contato com a TRLL)",
    scenario:
      "Um guindaste está identificado com capacidade nominal máxima de 80 toneladas. Durante uma operação, a lança está estendida a um raio de operação maior, o que altera a capacidade real disponível conforme a tabela de carga do fabricante.",
    question: "Qual afirmação está correta sobre a capacidade real do guindaste durante a operação?",
    options: [
      "A capacidade de 80 toneladas vale para qualquer raio e configuração de lança.",
      "A capacidade real do guindaste depende do raio de operação, do comprimento da lança e do contrapeso, e deve ser sempre consultada na tabela de carga — podendo ser muito menor que a capacidade nominal.",
      "Somente o peso total do guindaste determina sua capacidade de içamento.",
      "A tabela de carga só é necessária para cargas acima de 50 toneladas.",
    ],
    correctIndex: 1,
    explanation:
      "Este é o segundo mito mais recorrente apontado pela TRLL: \"o guindaste é de 80 t, então aguenta 80 t\". A capacidade real depende do raio, da lança e do contrapeso configurados, e deve ser sempre verificada na tabela de carga — nunca assumida pelo número pintado no equipamento.",
  },
];

// Metadados dos blocos temáticos (usados para filtros e para o painel do gestor)
const QUIZ_CATEGORIES = {
  peso_cg: "Peso e centro de gravidade da carga",
  acessorios_wll: "Seleção/inspeção de acessórios e WLL",
  angulo_linga: "Ângulo da linga e capacidade do conjunto",
  capacidade_raio: "Capacidade do guindaste em função do raio",
  area_exclusao: "Área de exclusão, cabo-guia e sinalização",
  condicoes_suspensao: "Condições que exigem suspender a operação",
  documentacao: "Documentação e procedimentos gerais NR11",
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { QUIZ_QUESTIONS, QUIZ_CATEGORIES };
}
