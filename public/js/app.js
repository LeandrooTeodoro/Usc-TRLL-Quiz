/**
 * Lógica do app — Segurança em Içamento: Quiz TRLL
 * Vanilla JS, sem framework, para rodar leve em aparelhos modestos (requisito da TRLL).
 *
 * Nesta versão: tema claro/escuro, pontuação/sequência/medalha, revisão das
 * questões erradas, gráficos no painel do gestor. Persistência e exportação
 * em PDF continuam iguais (localStorage + fila Supabase + jsPDF local).
 */

(function () {
  "use strict";

  // ---------- Estado ----------
  let currentProfile = null;
  let selectedRole = "colaborador";
  let quizState = null; // { questions, index, answers, streak, bestStreak, points, startedAt }

  const PASS = 70; // percentual mínimo considerado aprovado
  const THEME_KEY = "trll_quiz_theme";

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }

  function showView(id) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo(0, 0);
  }

  function pct(score, total) { return Math.round((score / total) * 100); }

  function initials(name) {
    return (name || "—").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  function medalFor(p) {
    if (p >= 95) return "Ouro";
    if (p >= 85) return "Prata";
    if (p >= PASS) return "Bronze";
    return "Em treinamento";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // ---------- Tema ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $("btnTheme").textContent = theme === "dark" ? "☀" : "☾";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#161826" : "#e4e7f5");
  }

  function initTheme() {
    let theme = null;
    try { theme = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (theme !== "light" && theme !== "dark") {
      theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    applyTheme(theme);
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  }

  // ---------- Status de conexão ----------
  function updateConnStatus() {
    const el = $("connStatus");
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
    initTheme();
    updateConnStatus();
    trySyncQueue();

    currentProfile = DB.getProfile();
    if (currentProfile) {
      $("loginKnownProfile").style.display = "block";
      $("loginNoProfile").style.display = "none";
      $("knownProfileName").textContent = currentProfile.fullName;
      $("knownProfileAvatar").textContent = initials(currentProfile.fullName);
      $("knownProfileRole").textContent =
        (currentProfile.cargo || "—") + (currentProfile.role === "gestor" ? " · acesso de gestor" : "");
    } else {
      $("loginKnownProfile").style.display = "none";
      $("loginNoProfile").style.display = "block";
    }

    bindEvents();
  });

  function bindEvents() {
    $("btnTheme").addEventListener("click", toggleTheme);

    $("btnContinueAsProfile").addEventListener("click", enterMenu);
    $("btnSwitchProfile").addEventListener("click", () => showView("view-cadastro"));
    $("btnGoCadastro").addEventListener("click", () => showView("view-cadastro"));
    $("btnVoltarLogin").addEventListener("click", () => showView("view-login"));

    document.querySelectorAll(".radio-card").forEach((card) => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".radio-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedRole = card.dataset.role;
        $("gestorCodeField").style.display = selectedRole === "gestor" ? "block" : "none";
      });
    });

    $("btnSalvarCadastro").addEventListener("click", handleCadastro);

    $("btnLogout").addEventListener("click", () => {
      DB.clearProfile();
      currentProfile = null;
      location.reload();
    });

    $("cardIniciarQuiz").addEventListener("click", startQuiz);
    $("cardHistorico").addEventListener("click", openHistorico);
    $("cardGestor").addEventListener("click", openGestorPanel);

    $("btnQuizConfirm").addEventListener("click", confirmAnswer);
    $("btnQuizNext").addEventListener("click", nextQuestion);
    $("btnQuizAbort").addEventListener("click", () => { quizState = null; enterMenu(); });

    $("btnVoltarMenuFromResult").addEventListener("click", enterMenu);
    $("btnRefazerQuiz").addEventListener("click", startQuiz);
    $("btnVoltarMenuFromHistorico").addEventListener("click", enterMenu);
    $("btnVoltarMenuFromGestor").addEventListener("click", enterMenu);

    $("btnExportPDF").addEventListener("click", exportPDF);
    $("gestorFilterEmpresa").addEventListener("change", renderGestorPanel);
    $("gestorFilterData").addEventListener("change", renderGestorPanel);
    $("btnClearFilters").addEventListener("click", () => {
      $("gestorFilterData").value = "";
      renderGestorPanel();
    });
  }

  // ---------- Cadastro / Login ----------
  const GESTOR_ACCESS_CODE = "TRLL-2026"; // TODO: substituir por autenticação real do Supabase Auth

  function showCadastroError(msg) {
    const box = $("cadastroError");
    box.textContent = msg;
    box.style.display = msg ? "block" : "none";
  }

  function handleCadastro() {
    const fullName = $("inpNome").value.trim();
    const cargo = $("inpCargo").value.trim();
    const empresaSetor = $("inpEmpresaSetor").value.trim();

    if (!fullName || !cargo) {
      showCadastroError("Preencha ao menos nome e cargo/função.");
      return;
    }

    if (selectedRole === "gestor") {
      const code = $("inpGestorCode").value.trim();
      if (code !== GESTOR_ACCESS_CODE) {
        showCadastroError("Código de acesso de gestor inválido. Confirme com a TRLL Engenharia.");
        return;
      }
    }
    showCadastroError("");

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
    $("menuGreeting").textContent = `Olá, ${currentProfile.fullName.split(" ")[0]}!`;
    $("menuRole").textContent =
      (currentProfile.cargo || "Colaborador") + (currentProfile.role === "gestor" ? " · acesso de gestor" : "");
    $("cardGestor").style.display = currentProfile.role === "gestor" ? "flex" : "none";

    const mine = DB.getAttempts().filter((a) => a.profileId === currentProfile.id);
    const best = mine.reduce((m, a) => Math.max(m, pct(a.score, a.total)), 0);
    $("menuPoints").textContent = mine.reduce((t, a) => t + (a.points || 0), 0);
    $("menuBest").textContent = mine.length ? best + "%" : "—";
    $("menuAttempts").textContent = mine.length;
    $("menuMedal").textContent = mine.length ? medalFor(best) : "—";

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
      streak: 0,
      bestStreak: 0,
      points: 0,
      startedAt: new Date().toISOString(),
    };
    showView("view-quiz");
    renderQuestion();
  }

  function renderQuestion() {
    const q = quizState.questions[quizState.index];
    const total = quizState.questions.length;

    $("quizProgressBar").style.width = Math.round((quizState.index / total) * 100) + "%";
    $("quizCounter").textContent = `Questão ${quizState.index + 1} de ${total}`;
    $("quizStreak").textContent = `${quizState.streak} em sequência`;
    $("quizStreak").className = "streak" + (quizState.streak >= 3 ? " hot" : "");
    $("quizPoints").textContent = quizState.points;

    $("quizCategoryTag").textContent = QUIZ_CATEGORIES[q.category] || q.category;
    $("quizQuestionTitle").textContent = q.title;
    $("quizScenario").textContent = q.scenario;
    $("quizQuestionText").textContent = q.question;

    const feedback = $("quizFeedback");
    feedback.className = "feedback-box";
    feedback.innerHTML = "";

    const optionsContainer = $("quizOptionsContainer");
    const numericContainer = $("quizNumericContainer");
    optionsContainer.innerHTML = "";

    if (q.type === "numerica") {
      optionsContainer.style.display = "none";
      numericContainer.style.display = "block";
      $("quizNumericUnit").textContent = q.unit || "";
      $("inpNumericAnswer").value = "";
      $("inpNumericAnswer").disabled = false;
    } else {
      optionsContainer.style.display = "flex";
      numericContainer.style.display = "none";

      const multi = q.type === "multi_select";
      q.options.forEach((optText, i) => {
        const div = document.createElement("div");
        div.className = "option";
        div.dataset.index = i;
        div.innerHTML =
          `<span class="marker">${multi ? "" : String.fromCharCode(65 + i)}</span><span>${escapeHtml(optText)}</span>`;
        div.addEventListener("click", () => {
          if (div.classList.contains("locked")) return;
          if (multi) {
            div.classList.toggle("selected");
            div.querySelector(".marker").textContent = div.classList.contains("selected") ? "✓" : "";
          } else {
            optionsContainer.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
            div.classList.add("selected");
          }
        });
        optionsContainer.appendChild(div);
      });
    }

    $("btnQuizConfirm").style.display = "inline-flex";
    $("btnQuizConfirm").disabled = false;
    $("btnQuizNext").style.display = "none";
  }

  function confirmAnswer() {
    const q = quizState.questions[quizState.index];
    let isCorrect = false;
    let userAnswer = null;

    if (q.type === "numerica") {
      const raw = $("inpNumericAnswer").value;
      if (raw === "") return;
      const val = parseFloat(raw);
      userAnswer = val;
      isCorrect = Math.abs(val - q.correctValue) <= (q.tolerance || 0);
      $("inpNumericAnswer").disabled = true;
    } else if (q.type === "multi_select") {
      const selected = Array.from(document.querySelectorAll("#quizOptionsContainer .option.selected")).map((el) =>
        parseInt(el.dataset.index, 10)
      );
      if (selected.length === 0) return;
      userAnswer = selected;
      const correctSet = new Set(q.correctIndices);
      const selectedSet = new Set(selected);
      isCorrect = correctSet.size === selectedSet.size && [...correctSet].every((v) => selectedSet.has(v));

      document.querySelectorAll("#quizOptionsContainer .option").forEach((el) => {
        el.classList.add("locked");
        const idx = parseInt(el.dataset.index, 10);
        if (correctSet.has(idx)) el.classList.add("correct");
        else if (selectedSet.has(idx)) el.classList.add("incorrect");
      });
    } else {
      const selectedEl = document.querySelector("#quizOptionsContainer .option.selected");
      if (!selectedEl) return;
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

    // Pontuação: 10 por acerto + bônus de 5 a partir da terceira seguida.
    quizState.streak = isCorrect ? quizState.streak + 1 : 0;
    quizState.bestStreak = Math.max(quizState.bestStreak, quizState.streak);
    if (isCorrect) quizState.points += 10 + (quizState.streak >= 3 ? 5 : 0);

    $("quizStreak").textContent = `${quizState.streak} em sequência`;
    $("quizStreak").className = "streak" + (quizState.streak >= 3 ? " hot" : "");
    $("quizPoints").textContent = quizState.points;
    $("quizProgressBar").style.width =
      Math.round(((quizState.index + 1) / quizState.questions.length) * 100) + "%";

    const feedback = $("quizFeedback");
    feedback.className = "feedback-box show " + (isCorrect ? "correct" : "incorrect");
    feedback.innerHTML =
      `<strong>${isCorrect ? "Correto ✓" : "Incorreto ✗"}</strong><p>${escapeHtml(q.explanation)}</p>`;

    quizState.answers.push({
      questionId: q.id,
      category: q.category,
      title: q.title,
      isCorrect,
      userAnswer,
    });

    $("btnQuizConfirm").style.display = "none";
    $("btnQuizNext").style.display = "inline-flex";
    $("btnQuizNext").textContent =
      quizState.index === quizState.questions.length - 1 ? "Ver resultado" : "Próxima pergunta";
  }

  function nextQuestion() {
    quizState.index += 1;
    if (quizState.index >= quizState.questions.length) finishQuiz();
    else renderQuestion();
  }

  function finishQuiz() {
    const score = quizState.answers.filter((a) => a.isCorrect).length;
    const total = quizState.answers.length;

    const attempt = {
      profile: currentProfile,
      profileId: currentProfile.id,
      score,
      total,
      points: quizState.points,
      bestStreak: quizState.bestStreak,
      startedAt: quizState.startedAt,
      finishedAt: new Date().toISOString(),
      answers: quizState.answers,
      synced: false,
    };

    DB.saveAttempt(attempt);
    DB.enqueueSync({ type: "attempt", payload: attempt });
    trySyncQueue();

    renderResult(attempt);
  }

  function renderResult(attempt) {
    const p = pct(attempt.score, attempt.total);
    const pass = p >= PASS;

    const ring = $("scoreCircle");
    ring.style.background =
      `conic-gradient(var(--${pass ? "ok" : "bad"}) ${p * 3.6}deg, var(--border) 0deg)`;
    $("scoreNum").textContent = `${attempt.score}/${attempt.total}`;
    $("scoreLabel").textContent = `${p}% de acertos`;

    $("resultMedal").textContent = medalFor(p);
    $("resultMessage").textContent = pass
      ? "Bom domínio dos pontos críticos de segurança em içamento. Continue revisando periodicamente."
      : "Há pontos de atenção. Revise os itens abaixo com seu supervisor antes da próxima operação.";

    const wrong = attempt.answers.filter((a) => !a.isCorrect);
    $("resultPoints").textContent = "+" + (attempt.points || 0);
    $("resultStreak").textContent = (attempt.bestStreak || 0) + " acertos";
    $("resultWrong").textContent = wrong.length;

    // Revisão das questões erradas (acordeão)
    const wrapper = $("reviewWrapper");
    const reviewList = $("reviewList");
    reviewList.innerHTML = "";
    wrapper.style.display = wrong.length ? "block" : "none";

    wrong.forEach((a) => {
      const q = QUIZ_QUESTIONS.find((qq) => qq.id === a.questionId) || {};
      let correctText = "—";
      if (q.type === "numerica") correctText = q.correctValue + " " + (q.unit || "");
      else if (q.type === "multi_select") correctText = (q.correctIndices || []).map((i) => q.options[i]).join(" · ");
      else if (q.options) correctText = q.options[q.correctIndex];

      const item = document.createElement("div");
      item.className = "review-item";
      item.innerHTML =
        `<div class="review-head"><span class="dot"></span><span>${escapeHtml(q.title || a.title)}</span><span class="chev"></span></div>` +
        `<div class="review-body">` +
        `<p class="sc">${escapeHtml(q.scenario || "")}</p>` +
        `<p class="right"><strong>Resposta correta:</strong> ${escapeHtml(correctText)}</p>` +
        `<p class="exp">${escapeHtml(q.explanation || "")}</p>` +
        `</div>`;
      item.querySelector(".review-head").addEventListener("click", () => item.classList.toggle("open"));
      reviewList.appendChild(item);
    });

    // Lista completa
    const list = $("resultList");
    list.innerHTML = "";
    attempt.answers.forEach((a, i) => {
      const q = QUIZ_QUESTIONS.find((qq) => qq.id === a.questionId);
      const row = document.createElement("div");
      row.className = "result-row " + (a.isCorrect ? "ok" : "ko");
      row.innerHTML =
        `<span>${i + 1}. ${escapeHtml((q && q.title) || a.title)}</span>` +
        `<span class="badge">${a.isCorrect ? "Correto" : "Revisar"}</span>`;
      list.appendChild(row);
    });

    showView("view-resultado");
  }

  // ---------- Histórico (colaborador) ----------
  function openHistorico() {
    const attempts = DB.getAttempts().filter((a) => a.profileId === currentProfile.id);
    const list = $("historicoList");
    const chart = $("historicoChart");
    list.innerHTML = "";
    chart.innerHTML = "";

    if (attempts.length === 0) {
      chart.style.display = "none";
      list.innerHTML = '<p class="empty-note">Nenhuma tentativa registrada ainda.</p>';
    } else {
      chart.style.display = "flex";
      attempts.slice(0, 6).reverse().forEach((a) => {
        const p = pct(a.score, a.total);
        const col = document.createElement("div");
        col.className = "col " + (p >= PASS ? "ok" : "ko");
        col.innerHTML =
          `<span class="pct">${p}%</span><i style="height:${Math.max(6, Math.round(p * 0.62))}px"></i>` +
          `<span class="day">${new Date(a.finishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>`;
        chart.appendChild(col);
      });

      attempts.forEach((a) => {
        const p = pct(a.score, a.total);
        const row = document.createElement("div");
        row.className = "history-row " + (p >= PASS ? "ok" : "ko");
        row.innerHTML =
          `<span>${new Date(a.finishedAt).toLocaleString("pt-BR")}</span>` +
          `<span class="badge">${a.score}/${a.total} (${p}%)</span>`;
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
      if (!current || new Date(a.finishedAt) > new Date(current.finishedAt)) map.set(a.profileId, a);
    });
    return Array.from(map.values());
  }

  function empresaOf(a) {
    return ((a.profile && a.profile.empresaSetor) || "").trim() || EMPRESA_NAO_INFORMADA;
  }

  function groupByEmpresa(attempts) {
    const groups = {};
    attempts.forEach((a) => {
      const empresa = empresaOf(a);
      if (!groups[empresa]) groups[empresa] = [];
      groups[empresa].push(a);
    });
    Object.values(groups).forEach((list) =>
      list.sort((a, b) => (a.profile?.fullName || "").localeCompare(b.profile?.fullName || "", "pt-BR"))
    );
    return groups;
  }

  function getFilteredAttempts() {
    const empresaFiltro = $("gestorFilterEmpresa").value;
    const dataFiltro = $("gestorFilterData").value; // "" ou yyyy-mm-dd

    let attempts = DB.getAttempts();
    if (dataFiltro) attempts = attempts.filter((a) => dateKey(a.finishedAt) === dataFiltro);
    if (empresaFiltro && empresaFiltro !== "__todas__") {
      attempts = attempts.filter((a) => empresaOf(a) === empresaFiltro);
    }
    return attempts;
  }

  function populateEmpresaFilter() {
    const select = $("gestorFilterEmpresa");
    const empresas = Array.from(new Set(DB.getAttempts().map(empresaOf))).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const previousValue = select.value;
    select.innerHTML = '<option value="__todas__">Todas as empresas</option>';
    empresas.forEach((empresa) => {
      const opt = document.createElement("option");
      opt.value = empresa;
      opt.textContent = empresa;
      select.appendChild(opt);
    });
    if (empresas.includes(previousValue) || previousValue === "__todas__") select.value = previousValue;
  }

  function openGestorPanel() {
    populateEmpresaFilter();
    $("gestorFilterData").value = "";
    renderGestorPanel();
    showView("view-gestor");
  }

  function barRow(label, value, cssClass) {
    return (
      `<div class="chart-row"><div class="top"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>` +
      `<div class="bar"><span class="${cssClass.klass}" style="width:${cssClass.width}"></span></div></div>`
    );
  }

  function renderGestorPanel() {
    const pendingCount = DB.getSyncQueue().length;
    const banner = $("syncBanner");
    if (!SupabaseClient.isConfigured) {
      banner.className = "sync-banner show";
      banner.textContent =
        "Supabase não configurado — exibindo apenas os resultados registrados neste aparelho. Configure window.TRLL_CONFIG para agregar todos os colaboradores.";
    } else if (pendingCount > 0) {
      banner.className = "sync-banner show";
      banner.textContent = `${pendingCount} registro(s) aguardando conexão para sincronizar.`;
    } else {
      banner.className = "sync-banner";
    }

    const filtered = latestAttemptPerProfile(getFilteredAttempts());
    const groups = groupByEmpresa(filtered);
    const empresasOrdenadas = Object.keys(groups).sort((a, b) => a.localeCompare(b, "pt-BR"));

    $("statTotal").textContent = filtered.length;
    const media = filtered.length
      ? Math.round((filtered.reduce((s, a) => s + a.score / a.total, 0) / filtered.length) * 100)
      : 0;
    $("statMedia").textContent = media + "%";
    $("statAprovados").textContent = filtered.filter((a) => pct(a.score, a.total) >= PASS).length;
    $("statReprovados").textContent = filtered.filter((a) => pct(a.score, a.total) < PASS).length;

    // Gráfico: média por empresa
    $("chartEmpresas").innerHTML = empresasOrdenadas.length
      ? empresasOrdenadas
          .map((e) => {
            const rows = groups[e];
            const p = Math.round((rows.reduce((t, a) => t + a.score / a.total, 0) / rows.length) * 100);
            return barRow(e, p + "%", { klass: p >= PASS ? "" : "ko", width: p + "%" });
          })
          .join("")
      : '<p class="empty-note">Sem dados no filtro atual.</p>';

    // Gráfico: acertos por bloco temático
    const blocos = {};
    filtered.forEach((a) =>
      (a.answers || []).forEach((ans) => {
        const key = ans.category;
        if (!key) return;
        if (!blocos[key]) blocos[key] = { ok: 0, n: 0 };
        blocos[key].n++;
        if (ans.isCorrect) blocos[key].ok++;
      })
    );
    const blocoKeys = Object.keys(blocos).sort(
      (a, b) => blocos[a].ok / blocos[a].n - blocos[b].ok / blocos[b].n
    );
    $("chartBlocos").innerHTML = blocoKeys.length
      ? blocoKeys
          .map((k) => {
            const p = Math.round((blocos[k].ok / blocos[k].n) * 100);
            return barRow(QUIZ_CATEGORIES[k] || k, p + "%", { klass: p >= PASS ? "" : "ko", width: p + "%" });
          })
          .join("")
      : '<p class="empty-note">Sem dados no filtro atual.</p>';

    // Grupos por empresa
    const container = $("gestorGroupsContainer");
    container.innerHTML = "";

    if (empresasOrdenadas.length === 0) {
      container.innerHTML = '<p class="empty-note">Nenhum resultado encontrado para os filtros selecionados.</p>';
      return;
    }

    empresasOrdenadas.forEach((empresa) => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "company-group";

      const rows = groups[empresa];
      groupDiv.innerHTML =
        `<div class="company-group-title"><h3>${escapeHtml(empresa)}</h3>` +
        `<span>${rows.length} ${rows.length === 1 ? "colaborador" : "colaboradores"}</span></div>`;

      rows.forEach((a) => {
        const p = pct(a.score, a.total);
        const row = document.createElement("div");
        row.className = "person-row " + (p >= PASS ? "ok" : "ko");
        row.innerHTML =
          `<div class="avatar sm">${escapeHtml(initials(a.profile?.fullName))}</div>` +
          `<div class="who"><b>${escapeHtml(a.profile?.fullName ?? "—")}</b>` +
          `<small>${escapeHtml(a.profile?.cargo || "—")} · ${new Date(a.finishedAt).toLocaleDateString("pt-BR")}</small></div>` +
          `<div class="bar"><span class="${p >= PASS ? "" : "ko"}" style="width:${p}%"></span></div>` +
          `<span class="badge">${a.score}/${a.total} — ${p}%</span>`;
        groupDiv.appendChild(row);
      });

      container.appendChild(groupDiv);
    });
  }

  function exportPDF() {
    const empresaFiltro = $("gestorFilterEmpresa").value;
    const dataFiltro = $("gestorFilterData").value;

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
        const p = pct(a.score, a.total);
        const cargo = a.profile?.cargo ? ` (${a.profile.cargo})` : "";
        doc.text(`${a.profile?.fullName ?? "—"}${cargo}`, marginX, y);
        doc.text(`${a.score}/${a.total} — ${p}%`, pageWidth - marginX, y, { align: "right" });
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

    const empresaSlug =
      empresaFiltro === "__todas__" ? "todas-empresas" : empresaFiltro.replace(/\W+/g, "-").toLowerCase();
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
