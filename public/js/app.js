/**
 * Lógica do app — Segurança em Içamento: Quiz TRLL
 * Vanilla JS, sem framework, para rodar leve em aparelhos modestos (requisito da TRLL).
 */

(function () {
  "use strict";

  // ---------- Estado ----------
  let currentProfile = null;
  let selectedRole = "colaborador";
  let quizState = null; // { questions, index, answers: [], startedAt }

  // ---------- Helpers de navegação ----------
  function showView(id) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  function updateConnStatus() {
    const el = document.getElementById("connStatus");
    if (navigator.onLine) {
      el.textContent = SupabaseClient.isConfigured ? "online · sincronizando" : "online (local)";
      el.className = "status-pill online";
    } else {
      el.textContent = "offline";
      el.className = "status-pill offline";
    }
  }
  window.addEventListener("online", updateConnStatus);
  window.addEventListener("offline", updateConnStatus);

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    updateConnStatus();
    trySyncQueue();

    currentProfile = DB.getProfile();
    if (currentProfile) {
      document.getElementById("loginKnownProfile").style.display = "block";
      document.getElementById("loginNoProfile").style.display = "none";
      document.getElementById("knownProfileName").textContent = currentProfile.fullName;
      document.getElementById("knownProfileRole").textContent =
        (currentProfile.cargo || "—") +
        (currentProfile.role === "gestor" ? " · acesso de gestor" : "");
    } else {
      document.getElementById("loginKnownProfile").style.display = "none";
      document.getElementById("loginNoProfile").style.display = "block";
    }

    bindEvents();
  });

  function bindEvents() {
    document.getElementById("btnContinueAsProfile").addEventListener("click", enterMenu);
    document.getElementById("btnSwitchProfile").addEventListener("click", () => {
      showView("view-cadastro");
    });
    document.getElementById("btnGoCadastro").addEventListener("click", () => showView("view-cadastro"));

    document.querySelectorAll(".radio-card").forEach((card) => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".radio-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedRole = card.dataset.role;
        document.getElementById("gestorCodeField").style.display =
          selectedRole === "gestor" ? "block" : "none";
      });
    });

    document.getElementById("btnSalvarCadastro").addEventListener("click", handleCadastro);

    document.getElementById("btnLogout").addEventListener("click", () => {
      DB.clearProfile();
      currentProfile = null;
      location.reload();
    });

    document.getElementById("cardIniciarQuiz").addEventListener("click", startQuiz);
    document.getElementById("cardHistorico").addEventListener("click", openHistorico);
    document.getElementById("cardGestor").addEventListener("click", openGestorPanel);

    document.getElementById("btnQuizConfirm").addEventListener("click", confirmAnswer);
    document.getElementById("btnQuizNext").addEventListener("click", nextQuestion);

    document.getElementById("btnVoltarMenuFromResult").addEventListener("click", enterMenu);
    document.getElementById("btnVoltarMenuFromHistorico").addEventListener("click", enterMenu);
    document.getElementById("btnVoltarMenuFromGestor").addEventListener("click", enterMenu);

    document.getElementById("btnExportPDF").addEventListener("click", exportPDF);
    document.getElementById("gestorFilterEmpresa").addEventListener("change", renderGestorPanel);
    document.getElementById("gestorFilterData").addEventListener("change", renderGestorPanel);
    document.getElementById("btnClearFilters").addEventListener("click", () => {
      document.getElementById("gestorFilterData").value = "";
      renderGestorPanel();
    });
  }

  // ---------- Cadastro / Login ----------
  const GESTOR_ACCESS_CODE = "TRLL-2026"; // TODO: substituir por autenticação real do Supabase Auth

  function handleCadastro() {
    const fullName = document.getElementById("inpNome").value.trim();
    const cargo = document.getElementById("inpCargo").value.trim();
    const empresaSetor = document.getElementById("inpEmpresaSetor").value.trim();

    if (!fullName || !cargo) {
      alert("Preencha ao menos nome e cargo/função.");
      return;
    }

    if (selectedRole === "gestor") {
      const code = document.getElementById("inpGestorCode").value.trim();
      if (code !== GESTOR_ACCESS_CODE) {
        alert("Código de acesso de gestor inválido. Confirme com a TRLL Engenharia.");
        return;
      }
    }

    const profile = {
      id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      fullName,
      cargo,
      empresaSetor,
      role: selectedRole,
      createdAt: new Date().toISOString(),
    };

    DB.saveProfile(profile);
    DB.enqueueSync({ type: "profile", payload: profile });
    trySyncQueue();

    currentProfile = profile;
    enterMenu();
  }

  function enterMenu() {
    currentProfile = DB.getProfile();
    document.getElementById("menuGreeting").textContent = `Olá, ${currentProfile.fullName.split(" ")[0]}!`;
    document.getElementById("cardGestor").style.display =
      currentProfile.role === "gestor" ? "flex" : "none";
    showView("view-menu");
  }

  // ---------- Quiz ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz() {
    quizState = {
      questions: shuffle(QUIZ_QUESTIONS),
      index: 0,
      answers: [],
      startedAt: new Date().toISOString(),
    };
    showView("view-quiz");
    renderQuestion();
  }

  function renderQuestion() {
    const q = quizState.questions[quizState.index];
    const total = quizState.questions.length;

    document.getElementById("quizProgressBar").style.width =
      Math.round((quizState.index / total) * 100) + "%";
    document.getElementById("quizCategoryTag").textContent =
      QUIZ_CATEGORIES[q.category] || q.category;
    document.getElementById("quizQuestionTitle").textContent = `Questão ${quizState.index + 1}/${total} — ${q.title}`;
    document.getElementById("quizScenario").textContent = q.scenario;
    document.getElementById("quizQuestionText").textContent = q.question;

    const feedback = document.getElementById("quizFeedback");
    feedback.className = "feedback-box";
    feedback.textContent = "";

    const optionsContainer = document.getElementById("quizOptionsContainer");
    const numericContainer = document.getElementById("quizNumericContainer");
    optionsContainer.innerHTML = "";

    if (q.type === "numerica") {
      optionsContainer.style.display = "none";
      numericContainer.style.display = "block";
      document.getElementById("inpNumericAnswer").value = "";
      document.getElementById("inpNumericAnswer").disabled = false;
    } else {
      optionsContainer.style.display = "block";
      numericContainer.style.display = "none";

      const multi = q.type === "multi_select";
      q.options.forEach((optText, i) => {
        const div = document.createElement("div");
        div.className = "option";
        div.dataset.index = i;
        div.innerHTML = `<span class="marker">${multi ? "" : String.fromCharCode(65 + i)}</span><span>${optText}</span>`;
        div.addEventListener("click", () => {
          if (div.classList.contains("locked")) return;
          if (multi) {
            div.classList.toggle("selected");
          } else {
            optionsContainer.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
            div.classList.add("selected");
          }
        });
        optionsContainer.appendChild(div);
      });
    }

    document.getElementById("btnQuizConfirm").style.display = "block";
    document.getElementById("btnQuizConfirm").disabled = false;
    document.getElementById("btnQuizNext").style.display = "none";
  }

  function confirmAnswer() {
    const q = quizState.questions[quizState.index];
    let isCorrect = false;
    let userAnswer = null;

    if (q.type === "numerica") {
      const raw = document.getElementById("inpNumericAnswer").value;
      if (raw === "") {
        alert("Digite um valor antes de confirmar.");
        return;
      }
      const val = parseFloat(raw);
      userAnswer = val;
      const tol = q.tolerance || 0;
      isCorrect = Math.abs(val - q.correctValue) <= tol;
      document.getElementById("inpNumericAnswer").disabled = true;
    } else if (q.type === "multi_select") {
      const selected = Array.from(document.querySelectorAll("#quizOptionsContainer .option.selected")).map((el) =>
        parseInt(el.dataset.index, 10)
      );
      if (selected.length === 0) {
        alert("Selecione ao menos uma alternativa.");
        return;
      }
      userAnswer = selected;
      const correctSet = new Set(q.correctIndices);
      const selectedSet = new Set(selected);
      isCorrect =
        correctSet.size === selectedSet.size &&
        [...correctSet].every((v) => selectedSet.has(v));

      document.querySelectorAll("#quizOptionsContainer .option").forEach((el) => {
        el.classList.add("locked");
        const idx = parseInt(el.dataset.index, 10);
        if (correctSet.has(idx)) el.classList.add("correct");
        else if (selectedSet.has(idx)) el.classList.add("incorrect");
      });
    } else {
      const selectedEl = document.querySelector("#quizOptionsContainer .option.selected");
      if (!selectedEl) {
        alert("Selecione uma alternativa antes de confirmar.");
        return;
      }
      const idx = parseInt(selectedEl.dataset.index, 10);
      userAnswer = idx;
      isCorrect = idx === q.correctIndex;

      document.querySelectorAll("#quizOptionsContainer .option").forEach((el) => {
        el.classList.add("locked");
        const i = parseInt(el.dataset.index, 10);
        if (i === q.correctIndex) el.classList.add("correct");
        else if (el.classList.contains("selected")) el.classList.add("incorrect");
      });
    }

    const feedback = document.getElementById("quizFeedback");
    feedback.classList.add("show", isCorrect ? "correct" : "incorrect");
    feedback.innerHTML = `<strong>${isCorrect ? "Correto ✓" : "Incorreto ✗"}</strong>${q.explanation}`;

    quizState.answers.push({
      questionId: q.id,
      category: q.category,
      isCorrect,
      userAnswer,
    });

    document.getElementById("btnQuizConfirm").style.display = "none";
    document.getElementById("btnQuizNext").style.display = "block";
    document.getElementById("btnQuizNext").textContent =
      quizState.index === quizState.questions.length - 1 ? "Ver resultado" : "Próxima pergunta";
  }

  function nextQuestion() {
    quizState.index += 1;
    if (quizState.index >= quizState.questions.length) {
      finishQuiz();
    } else {
      renderQuestion();
    }
  }

  function finishQuiz() {
    const score = quizState.answers.filter((a) => a.isCorrect).length;
    const total = quizState.answers.length;
    const finishedAt = new Date().toISOString();

    const attempt = {
      profile: currentProfile,
      profileId: currentProfile.id,
      score,
      total,
      startedAt: quizState.startedAt,
      finishedAt,
      answers: quizState.answers,
      synced: false,
    };

    DB.saveAttempt(attempt);
    DB.enqueueSync({ type: "attempt", payload: attempt });
    trySyncQueue();

    renderResult(attempt);
  }

  function renderResult(attempt) {
    const pct = Math.round((attempt.score / attempt.total) * 100);
    const pass = pct >= 70;

    const circle = document.getElementById("scoreCircle");
    circle.className = "score-circle " + (pass ? "pass" : "fail");
    document.getElementById("scoreNum").textContent = `${attempt.score}/${attempt.total}`;
    document.getElementById("scoreLabel").textContent = `${pct}% de acertos`;

    document.getElementById("resultMessage").textContent = pass
      ? "Bom domínio dos pontos críticos de segurança em içamento. Continue revisando periodicamente."
      : "Há pontos de atenção. Revise os itens abaixo com seu supervisor antes da próxima operação.";

    const list = document.getElementById("resultList");
    list.innerHTML = "";
    attempt.answers.forEach((a, i) => {
      const q = QUIZ_QUESTIONS.find((qq) => qq.id === a.questionId);
      const row = document.createElement("div");
      row.className = "result-row " + (a.isCorrect ? "ok" : "ko");
      row.innerHTML = `<span>${i + 1}. ${q.title}</span><span class="badge">${a.isCorrect ? "Correto" : "Revisar"}</span>`;
      list.appendChild(row);
    });

    showView("view-resultado");
  }

  // ---------- Histórico (colaborador) ----------
  function openHistorico() {
    const attempts = DB.getAttempts().filter((a) => a.profileId === currentProfile.id);
    const list = document.getElementById("historicoList");
    list.innerHTML = "";

    if (attempts.length === 0) {
      list.innerHTML = '<p class="view-subtitle">Nenhuma tentativa registrada ainda.</p>';
    } else {
      attempts.forEach((a) => {
        const pct = Math.round((a.score / a.total) * 100);
        const row = document.createElement("div");
        row.className = "result-row " + (pct >= 70 ? "ok" : "ko");
        const date = new Date(a.finishedAt).toLocaleString("pt-BR");
        row.innerHTML = `<span>${date}</span><span class="badge">${a.score}/${a.total} (${pct}%)</span>`;
        list.appendChild(row);
      });
    }
    showView("view-historico");
  }

  // ---------- Painel do gestor ----------
  const EMPRESA_NAO_INFORMADA = "Empresa não informada";

  function dateKey(isoString) {
    // yyyy-mm-dd local, usado tanto para o filtro quanto para o <input type="date">
    const d = new Date(isoString);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  }

  /** Para cada colaborador (profileId), mantém apenas a tentativa mais recente
   *  dentro do conjunto informado — se ele refez o quiz, a nota exibida é sempre
   *  a da última tentativa. */
  function latestAttemptPerProfile(attempts) {
    const map = new Map();
    attempts.forEach((a) => {
      const current = map.get(a.profileId);
      if (!current || new Date(a.finishedAt) > new Date(current.finishedAt)) {
        map.set(a.profileId, a);
      }
    });
    return Array.from(map.values());
  }

  function groupByEmpresa(attempts) {
    const groups = {};
    attempts.forEach((a) => {
      const empresa = (a.profile?.empresaSetor || "").trim() || EMPRESA_NAO_INFORMADA;
      if (!groups[empresa]) groups[empresa] = [];
      groups[empresa].push(a);
    });
    Object.values(groups).forEach((list) =>
      list.sort((a, b) => (a.profile?.fullName || "").localeCompare(b.profile?.fullName || "", "pt-BR"))
    );
    return groups;
  }

  function getFilteredAttempts() {
    const empresaFiltro = document.getElementById("gestorFilterEmpresa").value;
    const dataFiltro = document.getElementById("gestorFilterData").value; // "" ou yyyy-mm-dd

    let attempts = DB.getAttempts();
    if (dataFiltro) {
      attempts = attempts.filter((a) => dateKey(a.finishedAt) === dataFiltro);
    }
    if (empresaFiltro && empresaFiltro !== "__todas__") {
      attempts = attempts.filter(
        (a) => ((a.profile?.empresaSetor || "").trim() || EMPRESA_NAO_INFORMADA) === empresaFiltro
      );
    }
    return attempts;
  }

  function populateEmpresaFilter() {
    const select = document.getElementById("gestorFilterEmpresa");
    const empresas = Array.from(
      new Set(DB.getAttempts().map((a) => (a.profile?.empresaSetor || "").trim() || EMPRESA_NAO_INFORMADA))
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const previousValue = select.value;
    select.innerHTML = '<option value="__todas__">Todas as empresas</option>';
    empresas.forEach((empresa) => {
      const opt = document.createElement("option");
      opt.value = empresa;
      opt.textContent = empresa;
      select.appendChild(opt);
    });
    if (empresas.includes(previousValue) || previousValue === "__todas__") {
      select.value = previousValue;
    }
  }

  function openGestorPanel() {
    populateEmpresaFilter();
    document.getElementById("gestorFilterData").value = "";
    renderGestorPanel();
    showView("view-gestor");
  }

  function renderGestorPanel() {
    const pendingCount = DB.getSyncQueue().length;
    const banner = document.getElementById("syncBanner");
    if (!SupabaseClient.isConfigured) {
      banner.style.display = "block";
      banner.textContent =
        "Supabase não configurado — exibindo apenas os resultados registrados neste aparelho. Configure window.TRLL_CONFIG para agregar todos os colaboradores.";
    } else if (pendingCount > 0) {
      banner.style.display = "block";
      banner.textContent = `${pendingCount} registro(s) aguardando conexão para sincronizar.`;
    } else {
      banner.style.display = "none";
    }

    const filtered = latestAttemptPerProfile(getFilteredAttempts());
    const groups = groupByEmpresa(filtered);
    const empresasOrdenadas = Object.keys(groups).sort((a, b) => a.localeCompare(b, "pt-BR"));

    document.getElementById("statTotal").textContent = filtered.length;
    const media = filtered.length
      ? Math.round((filtered.reduce((s, a) => s + a.score / a.total, 0) / filtered.length) * 100)
      : 0;
    document.getElementById("statMedia").textContent = media + "%";

    const container = document.getElementById("gestorGroupsContainer");
    container.innerHTML = "";

    if (empresasOrdenadas.length === 0) {
      container.innerHTML = '<p class="view-subtitle">Nenhum resultado encontrado para os filtros selecionados.</p>';
      return;
    }

    empresasOrdenadas.forEach((empresa) => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "company-group";

      const title = document.createElement("div");
      title.className = "company-group-title";
      title.textContent = empresa;
      groupDiv.appendChild(title);

      const list = document.createElement("div");
      list.className = "result-list";
      groups[empresa].forEach((a) => {
        const pct = Math.round((a.score / a.total) * 100);
        const row = document.createElement("div");
        row.className = "result-row " + (pct >= 70 ? "ok" : "ko");
        row.innerHTML = `<span>${a.profile?.fullName ?? "—"}</span><span class="badge">${a.score}/${a.total} (${pct}%)</span>`;
        list.appendChild(row);
      });
      groupDiv.appendChild(list);

      container.appendChild(groupDiv);
    });
  }

  function exportPDF() {
    const empresaFiltro = document.getElementById("gestorFilterEmpresa").value;
    const dataFiltro = document.getElementById("gestorFilterData").value;

    const filtered = latestAttemptPerProfile(getFilteredAttempts());
    if (filtered.length === 0) {
      alert("Nenhum resultado encontrado para os filtros selecionados.");
      return;
    }
    const groups = groupByEmpresa(filtered);
    const empresasOrdenadas = Object.keys(groups).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const lineHeight = 18;
    let y = 64;

    function ensureSpace(extra) {
      if (y + extra > pageHeight - 70) {
        doc.addPage();
        y = 64;
      }
    }

    const periodoLabel = dataFiltro
      ? new Date(dataFiltro + "T00:00:00").toLocaleDateString("pt-BR")
      : "todas as datas registradas";

    empresasOrdenadas.forEach((empresa, idx) => {
      if (idx > 0) {
        doc.addPage();
        y = 64;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(10, 46, 77);
      doc.text(`Resultado NR11 da empresa "${empresa}"`, marginX, y);
      y += 10;

      doc.setDrawColor(10, 46, 77);
      doc.setLineWidth(1);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 22;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 100, 110);
      doc.text(`Período: ${periodoLabel}  ·  Gerado em ${new Date().toLocaleString("pt-BR")}`, marginX, y);
      y += 22;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(28, 39, 51);

      groups[empresa].forEach((a) => {
        ensureSpace(lineHeight);
        const pct = Math.round((a.score / a.total) * 100);
        const cargo = a.profile?.cargo ? ` (${a.profile.cargo})` : "";
        doc.text(`${a.profile?.fullName ?? "—"}${cargo}`, marginX, y);
        doc.text(`${a.score}/${a.total} — ${pct}%`, pageWidth - marginX, y, { align: "right" });
        y += lineHeight;
      });
    });

    // Aviso final único, ao término do documento inteiro
    ensureSpace(70);
    y += 20;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 20;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const disclaimer =
      "O quiz não possui edições e nenhuma possibilidade de alteração, então não tem possibilidade da nota estar errada.";
    const wrapped = doc.splitTextToSize(disclaimer, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, y);

    const empresaSlug = empresaFiltro === "__todas__" ? "todas-empresas" : empresaFiltro.replace(/\W+/g, "-").toLowerCase();
    const dataSlug = dataFiltro || "todas-datas";
    doc.save(`trll_resultado_nr11_${empresaSlug}_${dataSlug}.pdf`);
  }

  // ---------- Service worker (PWA offline) ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW registration failed:", e));
    });
  }
})();
