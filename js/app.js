/**
 * Controlador de Interfaz Amigable — Revisor Normativo TDT ESPOCH
 * Autor: Ing. Diego Haro Avalos | Docente Trabajo de Titulación
 * Carrera de Gestión del Transporte — ESPOCH
 */

document.addEventListener("DOMContentLoaded", () => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("pdf-file-input");
  const btnSelectFile = document.getElementById("btn-select-file");
  const selectModalidad = document.getElementById("select-modalidad");
  const selectNorma = document.getElementById("select-norma");

  const uploadPanel = document.getElementById("upload-panel");
  const progressPanel = document.getElementById("progress-panel");
  const progressBarInner = document.getElementById("progress-bar-inner");
  const progressStatusText = document.getElementById("progress-status-text");
  const dashboardPanel = document.getElementById("dashboard-panel");

  const gaugeCircle = document.getElementById("gauge-fg");
  const gaugePctText = document.getElementById("gauge-pct");
  const dictamenPill = document.getElementById("dictamen-pill");
  const dictamenTitle = document.getElementById("dictamen-title");
  const dictamenMsg = document.getElementById("dictamen-msg");
  const docMetaGrid = document.getElementById("doc-meta-grid");

  const kpiFail = document.getElementById("kpi-fail-num");
  const kpiWarn = document.getElementById("kpi-warn-num");
  const kpiPass = document.getElementById("kpi-pass-num");
  const kpiAll = document.getElementById("kpi-all-num");

  const dimensionsGrid = document.getElementById("dimensions-grid");
  const findingsList = document.getElementById("findings-list");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const searchInput = document.getElementById("search-findings");

  const btnDownloadReport = document.getElementById("btn-download-report");
  const btnReset = document.getElementById("btn-reset");

  const btnDemoBad = document.getElementById("btn-demo-bad");
  const btnDemoGood = document.getElementById("btn-demo-good");

  const btnOpenGuide = document.getElementById("btn-open-guide");
  const guideModal = document.getElementById("guide-modal");
  const btnCloseGuide = document.getElementById("btn-close-guide");

  let currentAnalysis = null;
  let activeStatusFilter = "issues"; // "issues" | "fail" | "pass" | "all"
  let activeCategoryId = null;
  let searchQuery = "";

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // EVENTOS DE SUBIDA DE ARCHIVO PDF
  // ---------------------------------------------------------------------------
  btnSelectFile.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener("click", () => {
    fileInput.click();
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleSelectedFile(files[0]);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleSelectedFile(fileInput.files[0]);
      fileInput.value = "";
    }
  });

  async function handleSelectedFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      alert("Por favor seleccione un archivo en formato PDF (.pdf).");
      return;
    }
    const buffer = await file.arrayBuffer();
    await runAnalysisPipeline(buffer, file.name);
  }

  // Botones de demostración integrados
  btnDemoBad.addEventListener("click", async () => {
    const demo = window.ESPOCHDemoGenerator.createFlawedDemoPDF();
    await runAnalysisPipeline(demo.buffer, demo.fileName);
  });

  btnDemoGood.addEventListener("click", async () => {
    const demo = window.ESPOCHDemoGenerator.createCompliantDemoPDF();
    await runAnalysisPipeline(demo.buffer, demo.fileName);
  });

  async function runAnalysisPipeline(arrayBuffer, fileName) {
    uploadPanel.classList.add("hidden");
    dashboardPanel.classList.add("hidden");
    progressPanel.classList.remove("hidden");
    progressBarInner.style.width = "5%";
    progressStatusText.textContent = `Abriendo archivo "${fileName}"...`;

    try {
      const extracted = await window.PDFExtractor.extractDocument(
        arrayBuffer,
        (currentPage, totalPages, msg) => {
          const pct = Math.min(92, Math.round((currentPage / Math.max(1, totalPages)) * 88) + 5);
          progressBarInner.style.width = `${pct}%`;
          progressStatusText.textContent = msg;
        }
      );

      progressBarInner.style.width = "96%";
      progressStatusText.textContent = "Evaluando los 28 parámetros de la Normativa Institucional ESPOCH...";
      await new Promise((r) => setTimeout(r, 60));

      currentAnalysis = window.ESPOCHAnalyzer.analyze(extracted, {
        fileName,
        modalidad: selectModalidad.value,
        normaBiblio: selectNorma.value
      });

      progressBarInner.style.width = "100%";
      activeCategoryId = null;
      searchQuery = "";
      searchInput.value = "";

      const totalIssues = currentAnalysis.counts.fail + currentAnalysis.counts.warn;
      activeStatusFilter = totalIssues > 0 ? "issues" : "all";
      syncFilterTabUI();

      renderDashboard(currentAnalysis);
      progressPanel.classList.add("hidden");
      dashboardPanel.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error procesando el PDF:", err);
      progressPanel.classList.add("hidden");
      uploadPanel.classList.remove("hidden");
      alert(
        "No se pudo leer el archivo PDF. Verifique que el documento no esté dañado ni protegido con contraseña de apertura.\n\nDetalle técnico: " +
          (err?.message || String(err))
      );
    }
  }

  // ---------------------------------------------------------------------------
  // RENDERIZADO DEL DASHBOARD DE RESULTADOS
  // ---------------------------------------------------------------------------
  function renderDashboard(analysis) {
    const pct = analysis.overallPercentage;
    const radius = 74;
    const circumference = 2 * Math.PI * radius;
    gaugeCircle.style.strokeDasharray = `${circumference}`;
    const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;
    gaugeCircle.style.strokeDashoffset = `${offset}`;

    let gaugeColor = "#15803d";
    if (pct < 65) gaugeColor = "#b91c1c";
    else if (pct < 85) gaugeColor = "#b45309";
    gaugeCircle.style.stroke = gaugeColor;

    gaugePctText.textContent = `${pct.toFixed(1)}%`;
    gaugePctText.style.color = gaugeColor;

    dictamenPill.className = `dictamen-pill ${analysis.dictamen.nivel}`;
    dictamenPill.textContent = analysis.dictamen.etiqueta;
    dictamenTitle.textContent = `Resultado del Análisis: ${analysis.fileName}`;
    dictamenMsg.textContent = analysis.dictamen.mensaje;

    docMetaGrid.innerHTML = `
      <div class="doc-meta-item">
        <strong>Estudiante / Autor(es)</strong>
        <span>${escapeHtml(analysis.meta.autor)}</span>
      </div>
      <div class="doc-meta-item">
        <strong>Director(a) Identificado</strong>
        <span>${escapeHtml(analysis.meta.director)}</span>
      </div>
      <div class="doc-meta-item">
        <strong>Extensión del Documento</strong>
        <span>${analysis.numPages} páginas (${analysis.totalWordCount.toLocaleString("es-EC")} palabras)</span>
      </div>
      <div class="doc-meta-item">
        <strong>Norma Aplicada</strong>
        <span>DBRA ESPOCH + Bibliografía ${escapeHtml(analysis.normaBiblio)}</span>
      </div>
      <div class="doc-meta-item" style="grid-column: 1 / -1;">
        <strong>Título Detectado en Portada</strong>
        <span>${escapeHtml(analysis.meta.titulo)}</span>
      </div>
    `;

    kpiFail.textContent = analysis.counts.fail;
    kpiWarn.textContent = analysis.counts.warn;
    kpiPass.textContent = analysis.counts.pass;
    kpiAll.textContent = analysis.counts.evaluated;

    renderDimensions(analysis);
    renderFindings(analysis);
  }

  function renderDimensions(analysis) {
    dimensionsGrid.innerHTML = analysis.categories
      .map((cat) => {
        let barColor = "#15803d";
        if (cat.percentage < 65) barColor = "#b91c1c";
        else if (cat.percentage < 85) barColor = "#d97706";
        const isActive = activeCategoryId === cat.id ? "active" : "";

        return `
          <div class="dim-card ${isActive}" data-cat-id="${escapeHtml(cat.id)}" title="Clic para filtrar parámetros de esta dimensión">
            <div class="dim-header">
              <span class="dim-title">${escapeHtml(cat.nombre)}</span>
              <span class="dim-pct" style="color:${barColor}">${cat.percentage.toFixed(0)}%</span>
            </div>
            <div class="dim-bar-track">
              <div class="dim-bar-fill" style="width:${Math.min(100, cat.percentage)}%; background:${barColor}"></div>
            </div>
            <div class="dim-stats">
              <span>Cumple: <strong>${cat.passChecks}</strong></span>
              <span>Parcial: <strong>${cat.warnChecks}</strong></span>
              <span>No cumple: <strong>${cat.failChecks}</strong></span>
            </div>
          </div>
        `;
      })
      .join("");

    dimensionsGrid.querySelectorAll(".dim-card").forEach((card) => {
      card.addEventListener("click", () => {
        const cid = card.getAttribute("data-cat-id");
        activeCategoryId = activeCategoryId === cid ? null : cid;
        activeStatusFilter = "all";
        syncFilterTabUI();
        renderDimensions(currentAnalysis);
        renderFindings(currentAnalysis);
        document.getElementById("findings-section").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function renderFindings(analysis) {
    const q = searchQuery.trim().toLowerCase();

    // Ordenar primero incumplimientos, luego observaciones, luego cumplidos
    const priority = { fail: 0, warn: 1, pass: 2, na: 3 };
    const filtered = analysis.checks
      .slice()
      .sort((a, b) => priority[a.status] - priority[b.status])
      .filter((item) => {
        if (activeCategoryId && item.categoryId !== activeCategoryId) return false;
        if (activeStatusFilter === "issues" && item.status !== "fail" && item.status !== "warn") return false;
        if (activeStatusFilter === "fail" && item.status !== "fail") return false;
        if (activeStatusFilter === "pass" && item.status !== "pass") return false;
        if (q) {
          const hay = `${item.titulo} ${item.hallazgo} ${item.comoCorregir} ${item.fuenteNormativa}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    if (filtered.length === 0) {
      findingsList.innerHTML = `
        <div class="empty-filter-msg">
          No hay parámetros que coincidan con el filtro seleccionado.
          ${
            activeCategoryId
              ? '<br><button id="btn-clear-cat" class="btn-demo" style="margin-top:0.6rem;">Mostrar todas las categorías</button>'
              : ""
          }
        </div>
      `;
      const clearBtn = document.getElementById("btn-clear-cat");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          activeCategoryId = null;
          renderDimensions(currentAnalysis);
          renderFindings(currentAnalysis);
        });
      }
      return;
    }

    const badgeLabels = {
      fail: "Incumplimiento",
      warn: "Cumplimiento Parcial",
      pass: "Cumple Normativa",
      na: "Opcional / No Aplica"
    };

    findingsList.innerHTML = filtered
      .map((item) => {
        const showFix = item.status === "fail" || item.status === "warn";
        const showPages = item.pages && item.pages.length > 0 && item.pagesLabel !== "—";

        return `
          <article class="finding-card status-${item.status}">
            <div class="finding-head">
              <div class="finding-title-group">
                <span class="status-badge ${item.status}">${badgeLabels[item.status]}</span>
                <h4 class="finding-title">${escapeHtml(item.titulo)}</h4>
              </div>
              <div class="finding-tags">
                ${showPages ? `<span class="tag-pages">${escapeHtml(item.pagesLabel)}</span>` : ""}
                <span class="tag-norma">${escapeHtml(item.fuenteNormativa)}</span>
              </div>
            </div>
            <div class="finding-body">
              <div class="finding-row">
                <strong>Hallazgo en su documento:</strong> ${escapeHtml(item.hallazgo)}
                ${item.measured ? `<span class="measured-chip">${escapeHtml(item.measured)}</span>` : ""}
              </div>
              <div class="finding-row">
                <strong>Criterio Normativo ESPOCH:</strong> ${escapeHtml(item.explicacionNorma)}
              </div>
              ${
                showFix
                  ? `<div class="fix-box">
                       <strong>¿Cómo corregirlo antes de entregar?:</strong> ${escapeHtml(item.comoCorregir)}
                     </div>`
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  function syncFilterTabUI() {
    filterTabs.forEach((tab) => {
      const f = tab.getAttribute("data-filter");
      tab.classList.toggle("active", f === activeStatusFilter);
    });
  }

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeStatusFilter = tab.getAttribute("data-filter");
      syncFilterTabUI();
      if (currentAnalysis) renderFindings(currentAnalysis);
    });
  });

  // Tarjetas KPI como atajos de filtrado
  document.getElementById("kpi-card-fail").addEventListener("click", () => {
    activeCategoryId = null;
    activeStatusFilter = "fail";
    syncFilterTabUI();
    renderDimensions(currentAnalysis);
    renderFindings(currentAnalysis);
  });
  document.getElementById("kpi-card-warn").addEventListener("click", () => {
    activeCategoryId = null;
    activeStatusFilter = "issues";
    syncFilterTabUI();
    renderDimensions(currentAnalysis);
    renderFindings(currentAnalysis);
  });
  document.getElementById("kpi-card-pass").addEventListener("click", () => {
    activeCategoryId = null;
    activeStatusFilter = "pass";
    syncFilterTabUI();
    renderDimensions(currentAnalysis);
    renderFindings(currentAnalysis);
  });
  document.getElementById("kpi-card-all").addEventListener("click", () => {
    activeCategoryId = null;
    activeStatusFilter = "all";
    syncFilterTabUI();
    renderDimensions(currentAnalysis);
    renderFindings(currentAnalysis);
  });

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    if (currentAnalysis) renderFindings(currentAnalysis);
  });

  // Descargar Reporte en PDF
  btnDownloadReport.addEventListener("click", () => {
    if (!currentAnalysis) return;
    window.ESPOCHReportGenerator.generatePDF(currentAnalysis);
  });

  // Reiniciar para subir otro archivo PDF
  btnReset.addEventListener("click", () => {
    currentAnalysis = null;
    dashboardPanel.classList.add("hidden");
    uploadPanel.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Modal de Guía Rápida Normativa ESPOCH
  btnOpenGuide.addEventListener("click", () => {
    guideModal.classList.remove("hidden");
  });
  btnCloseGuide.addEventListener("click", () => {
    guideModal.classList.add("hidden");
  });
  guideModal.addEventListener("click", (e) => {
    if (e.target === guideModal) guideModal.classList.add("hidden");
  });
});
