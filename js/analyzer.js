/**
 * Motor Evaluador de Cumplimiento Normativo ESPOCH (DBRA + Proyecto de Investigación de Grado)
 * Autor del Sistema: Ing. Diego Haro Avalos
 * Docente Trabajo de Titulación - Carrera de Gestión del Transporte (ESPOCH)
 */

window.ESPOCHAnalyzer = (function () {
  const { normalizeText, round2 } = window.PDFExtractor;

  function formatPageRanges(pageNums, maxDisplay = 10) {
    if (!pageNums || pageNums.length === 0) return "—";
    const sorted = Array.from(new Set(pageNums)).sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
        start = sorted[i];
        prev = sorted[i];
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}–${prev}`);

    if (ranges.length > maxDisplay) {
      return `Págs. ${ranges.slice(0, maxDisplay).join(", ")} (+${ranges.length - maxDisplay} más)`;
    }
    return (sorted.length === 1 ? "Pág. " : "Págs. ") + ranges.join(", ");
  }

  function extractStudentMetadata(doc) {
    const coverPages = doc.pages.slice(0, Math.min(3, doc.numPages));
    let titulo = "No identificado automáticamente";
    let autor = "No identificado automáticamente";
    let director = "No identificado en portada";
    let facultad = "No especificada";
    let carrera = "No especificada";
    let anio = "—";

    const p1 = coverPages[0];
    if (p1) {
      // Buscar portada real (si pág 1 es pasta y pág 2 es portada con Director)
      let portadaPage = p1;
      if (
        coverPages[1] &&
        coverPages[1].bodyLines.some((l) => /ESCUELA\s+SUPERIOR\s+POLIT/i.test(normalizeText(l.text))) &&
        coverPages[1].bodyLines.some((l) => /DIRECTOR/i.test(normalizeText(l.text)))
      ) {
        portadaPage = coverPages[1];
      }

      const lines = portadaPage.bodyLines;
      for (let i = 0; i < lines.length; i++) {
        const t = lines[i].text;
        const n = lines[i].norm;

        if (/^FACULTAD\s+DE\b/.test(n)) {
          facultad = t;
        } else if (/^(?:CARRERA|ESCUELA\s+DE)\b/.test(n)) {
          carrera = t;
        } else if (/^AUTOR(?:\/A|\(ES\)|ES|A)?\s*:?/i.test(n)) {
          const after = t.replace(/^AUTOR(?:\/A\(ES\)|\/A|\(ES\)|ES|A)?\s*:?\s*/i, "").trim();
          if (after.length > 3) {
            autor = after;
          } else if (lines[i + 1] && !/DIRECTOR|RIOBAMBA/i.test(lines[i + 1].norm)) {
            autor = lines[i + 1].text;
          }
        } else if (/^DIRECTOR(?:\/A)?\s*:?/i.test(n)) {
          const after = t.replace(/^DIRECTOR(?:\/A)?\s*:?\s*/i, "").trim();
          if (after.length > 3) {
            director = after;
          } else if (lines[i + 1] && !/RIOBAMBA/i.test(lines[i + 1].norm)) {
            director = lines[i + 1].text;
          }
        } else if (/^20\d{2}$/.test(t.trim())) {
          anio = t.trim();
        }
      }

      // Extraer título entre CARRERA (o FACULTAD) y TRABAJO DE INTEGRACIÓN / TITULACIÓN
      let idxCarrera = lines.findIndex((l) => /^(?:CARRERA|ESCUELA\s+DE)\b/.test(l.norm));
      if (idxCarrera === -1) {
        idxCarrera = lines.findIndex((l) => /^FACULTAD\s+DE\b/.test(l.norm));
      }
      let idxModalidad = lines.findIndex((l) =>
        /TRABAJO\s+DE\s+(?:INTEGRACI|TITULACI)|TESIS\s+DE\s+GRADO|PRESENTADO\s+PARA\s+OPTAR/.test(l.norm)
      );
      if (idxCarrera !== -1 && idxModalidad !== -1 && idxModalidad > idxCarrera + 1) {
        const titleLines = lines
          .slice(idxCarrera + 1, idxModalidad)
          .map((l) => l.text.replace(/^[""«»]+|[""«»]+$/g, "").trim())
          .filter(Boolean);
        if (titleLines.length > 0) {
          titulo = titleLines.join(" ");
        }
      }
    }

    return { titulo, autor, director, facultad, carrera, anio };
  }

  function isTocLine(line) {
    // Línea típica de índice con puntos suspensivos o tabulación seguida de número romano/arábigo al final
    return /(?:\.{4,}|…{2,})\s*(?:[ivxlcdm]+|\d+)\s*$/i.test(line.text);
  }

  function segmentDocument(doc) {
    const sections = {
      pastaPage: null,
      portadaPage: 1,
      derechoAutorPage: null,
      autenticidadPage: null,
      certificacionPage: null,
      dedicatoriaPage: null,
      agradecimientoPage: null,
      indiceContenidoPage: null,
      indiceTablasPage: null,
      indiceIlustracionesPage: null,
      indiceAnexosPage: null,
      resumenPage: null,
      abstractPage: null,
      introduccionPage: null,
      capitulos: {}, // { 1: page, 2: page, ... }
      conclusionesPage: null,
      recomendacionesPage: null,
      glosarioPage: null,
      bibliografiaPage: null,
      anexosPage: null
    };

    // Verificar si hay Pasta en pág 1 y Portada en pág 2
    if (
      doc.numPages >= 2 &&
      doc.pages[0].bodyLines.some((l) => /ESCUELA\s+SUPERIOR\s+POLIT/.test(l.norm)) &&
      doc.pages[1].bodyLines.some((l) => /ESCUELA\s+SUPERIOR\s+POLIT/.test(l.norm))
    ) {
      const p1HasDir = doc.pages[0].bodyLines.some((l) => /DIRECTOR/.test(l.norm));
      const p2HasDir = doc.pages[1].bodyLines.some((l) => /DIRECTOR/.test(l.norm));
      if (!p1HasDir && p2HasDir) {
        sections.pastaPage = 1;
        sections.portadaPage = 2;
      }
    }

    let inIndexZone = false;

    for (const page of doc.pages) {
      const pNum = page.pageNumber;
      if (pNum <= sections.portadaPage) continue;

      const topLines = page.bodyLines.slice(0, 6);
      const fullNorm = normalizeText(page.fullText);
      const dottedCount = page.bodyLines.filter(isTocLine).length;
      const isMostlyTocPage = dottedCount >= 4;

      // Detectar páginas legales preliminares por título o por texto jurídico oficial DBRA
      if (pNum <= 12 && !sections.introduccionPage) {
        if (
          !sections.derechoAutorPage &&
          (/DERECHO\s+DE\s+AUTOR|COPYRIGHT/.test(fullNorm) &&
            (/SE\s+AUTORIZA\s+LA\s+REPRODUCCION|©/.test(fullNorm) || topLines.some((l) => /^DERECHO\s+DE\s+AUTOR/.test(l.norm))))
        ) {
          sections.derechoAutorPage = pNum;
        }
        if (
          !sections.autenticidadPage &&
          (/DECLARACION\s+DE\s+AUTENTICIDAD/.test(fullNorm) ||
            (/DECLARO\s+QUE\s+EL\s+PRESENTE\s+TRABAJO/.test(fullNorm) && /PATRIMONIO\s+INTELECTUAL/.test(fullNorm)))
        ) {
          sections.autenticidadPage = pNum;
        }
        if (
          !sections.certificacionPage &&
          (/CERTIFICACION\s+DE\s+DIRECCION/.test(fullNorm) ||
            (/TRIBUNAL\s+DEL\s+TRABAJO/.test(fullNorm) && /CERTIFICA\s+QUE/.test(fullNorm)))
        ) {
          sections.certificacionPage = pNum;
        }
      }

      for (let i = 0; i < Math.min(5, topLines.length); i++) {
        const ln = topLines[i];
        if (isTocLine(ln)) continue;
        const n = ln.norm;

        if (!sections.dedicatoriaPage && /^DEDICATORIA$/.test(n)) {
          sections.dedicatoriaPage = pNum;
        } else if (!sections.agradecimientoPage && /^AGRADECIMIENTOS?$/.test(n)) {
          sections.agradecimientoPage = pNum;
        } else if (!sections.indiceContenidoPage && /^INDICE\s+(?:DE\s+CONTENIDOS?|GENERAL)$|^TABLA\s+DE\s+CONTENIDOS?$/.test(n)) {
          sections.indiceContenidoPage = pNum;
          inIndexZone = true;
        } else if (!sections.indiceTablasPage && /^INDICE\s+DE\s+TABLAS$|^LISTA\s+DE\s+TABLAS$/.test(n)) {
          sections.indiceTablasPage = pNum;
          inIndexZone = true;
        } else if (!sections.indiceIlustracionesPage && /^INDICE\s+DE\s+(?:ILUSTRACIONES|FIGURAS|GRAFICOS)$|^LISTA\s+DE\s+(?:ILUSTRACIONES|FIGURAS)$/.test(n)) {
          sections.indiceIlustracionesPage = pNum;
          inIndexZone = true;
        } else if (!sections.indiceAnexosPage && /^INDICE\s+DE\s+ANEXOS$|^LISTA\s+DE\s+ANEXOS$/.test(n)) {
          sections.indiceAnexosPage = pNum;
          inIndexZone = true;
        } else if (!sections.resumenPage && /^RESUMEN(?:\s+EJECUTIVO)?$/.test(n) && !isMostlyTocPage) {
          sections.resumenPage = pNum;
          inIndexZone = false;
        } else if (!sections.abstractPage && /^(?:SUMMARY|ABSTRACT|SUMMARY\s*\/\s*ABSTRACT)$/.test(n) && !isMostlyTocPage) {
          sections.abstractPage = pNum;
          inIndexZone = false;
        } else if (!sections.introduccionPage && /^(?:\d+\.?\s+)?INTRODUCCION$/.test(n) && !isMostlyTocPage) {
          sections.introduccionPage = pNum;
          inIndexZone = false;
        }
      }

      if (isMostlyTocPage && !sections.introduccionPage) continue;

      // Buscar Capítulos, Conclusiones, Recomendaciones, Glosario, Bibliografía, Anexos en líneas de encabezado
      for (let i = 0; i < page.bodyLines.length; i++) {
        const ln = page.bodyLines[i];
        if (isTocLine(ln)) continue;
        const n = ln.norm;

        // Evitar falsos positivos dentro de páginas de índice
        if (inIndexZone && pNum === sections.indiceContenidoPage) continue;

        const capMatch = n.match(/^CAPITULO\s+(I|II|III|IV|V|VI|1|2|3|4|5|6)\b/);
        if (capMatch && ln.text.length <= 75) {
          const mapCap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6 };
          const cNum = mapCap[capMatch[1]];
          if (cNum && !sections.capitulos[cNum]) {
            sections.capitulos[cNum] = pNum;
          }
        }

        if (i <= 6) {
          if (!sections.conclusionesPage && /^(?:\d+(?:\.\d+)?\.?\s+)?CONCLUSIONES(?:\s+Y\s+RECOMENDACIONES)?$/.test(n)) {
            sections.conclusionesPage = pNum;
            if (/RECOMENDACIONES/.test(n) && !sections.recomendacionesPage) {
              sections.recomendacionesPage = pNum;
            }
          } else if (!sections.recomendacionesPage && /^(?:\d+(?:\.\d+)?\.?\s+)?RECOMENDACIONES$/.test(n)) {
            sections.recomendacionesPage = pNum;
          } else if (!sections.glosarioPage && /^GLOSARIO(?:\s+DE\s+TERMINOS)?$/.test(n)) {
            sections.glosarioPage = pNum;
          } else if (
            !sections.bibliografiaPage &&
            /^(?:BIBLIOGRAFIA|REFERENCIAS\s+BIBLIOGRAFICAS|REFERENCIAS)$/.test(n)
          ) {
            sections.bibliografiaPage = pNum;
          } else if (
            !sections.anexosPage &&
            pNum !== sections.indiceAnexosPage &&
            ((sections.introduccionPage && pNum > sections.introduccionPage) ||
              (sections.bibliografiaPage && pNum > sections.bibliografiaPage)) &&
            /^(?:ANEXOS|ANEXO\s+[A-Z1-9])\b/.test(n) &&
            ln.text.length <= 100
          ) {
            sections.anexosPage = pNum;
          }
        }
      }
    }

    // Determinar rangos de las 3 grandes partes del trabajo (Pág. 6 DBRA)
    const bodyStart =
      sections.introduccionPage ||
      sections.capitulos[1] ||
      (sections.abstractPage ? sections.abstractPage + 1 : Math.min(doc.numPages, 3));

    const finalsCandidates = [sections.glosarioPage, sections.bibliografiaPage, sections.anexosPage].filter(
      (p) => p && p >= bodyStart
    );
    const finalsStart = finalsCandidates.length > 0 ? Math.min(...finalsCandidates) : null;
    const bodyEnd = finalsStart ? finalsStart - 1 : doc.numPages;
    const prelimStart = sections.portadaPage + 1;
    const prelimEnd = bodyStart - 1;

    return {
      ...sections,
      prelimStart,
      prelimEnd,
      bodyStart,
      bodyEnd,
      finalsStart
    };
  }

  function analyze(doc, options = {}) {
    const modalidad = options.modalidad || "investigacion"; // "investigacion" | "general"
    const normaBiblio = options.normaBiblio || "APA"; // "APA" | "ISO690" | "VANCOUVER"
    const rulesRef = window.ESPOCH_NORMATIVA.reglasReferencia;

    const meta = extractStudentMetadata(doc);
    const seg = segmentDocument(doc);
    const results = [];

    function addCheck({
      code,
      categoryId,
      weight,
      status, // "pass" | "warn" | "fail" | "na"
      scoreRatio, // 0..1
      pages = [],
      measured = "",
      hallazgo = "",
      recomendacionExtra = ""
    }) {
      const ref = rulesRef[code];
      const effectiveRatio =
        status === "pass" ? 1 : status === "fail" ? 0 : status === "na" ? null : scoreRatio ?? 0.5;
      results.push({
        code,
        categoryId,
        titulo: ref.titulo,
        fuenteNormativa: ref.fuenteNormativa,
        explicacionNorma: ref.explicacionNorma,
        comoCorregir: recomendacionExtra ? `${ref.comoCorregir} ${recomendacionExtra}` : ref.comoCorregir,
        weight,
        status,
        scoreRatio: effectiveRatio,
        earnedPoints: effectiveRatio === null ? 0 : round2(weight * effectiveRatio),
        pages,
        pagesLabel: formatPageRanges(pages),
        measured,
        hallazgo
      });
    }

    // Si el PDF es escaneado (sin texto seleccionable)
    if (doc.totalWordCount < 40) {
      addCheck({
        code: "A1_TAMANO_PAPEL",
        categoryId: "formato_general",
        weight: 100,
        status: "fail",
        pages: Array.from({ length: doc.numPages }, (_, i) => i + 1),
        measured: `${doc.totalWordCount} palabras extraíbles`,
        hallazgo:
          "El archivo PDF subido contiene páginas escaneadas como imagen o carece de capa de texto digital seleccionable. Según la Guía DBRA ESPOCH (pág. 51), el Trabajo de Titulación electrónico debe generarse directamente desde Microsoft Word a PDF."
      });
      return buildFinalSummary(doc, meta, seg, results, options);
    }

    // =========================================================================
    // CATEGORÍA 1: FORMATO GENERAL, PAPEL Y MÁRGENES (18 puntos)
    // =========================================================================

    // A1. Tamaño de papel A4 (21.0 x 29.7 cm) -> 3 pt
    {
      const badPages = [];
      let detectedOtherSize = "";
      for (const p of doc.pages) {
        const w = p.orientation === "portrait" ? p.widthCm : p.heightCm;
        const h = p.orientation === "portrait" ? p.heightCm : p.widthCm;
        const isA4 = Math.abs(w - 21.0) <= 0.35 && Math.abs(h - 29.7) <= 0.35;
        if (!isA4) {
          badPages.push(p.pageNumber);
          if (!detectedOtherSize) {
            const isLetter = Math.abs(w - 21.59) <= 0.35 && Math.abs(h - 27.94) <= 0.35;
            detectedOtherSize = isLetter ? `Carta / Letter (${w} × ${h} cm)` : `${w} × ${h} cm`;
          }
        }
      }
      if (badPages.length === 0) {
        addCheck({
          code: "A1_TAMANO_PAPEL",
          categoryId: "formato_general",
          weight: 3,
          status: "pass",
          measured: "A4 (21,0 × 29,7 cm) en el 100% de páginas",
          hallazgo: `Las ${doc.numPages} páginas del documento cumplen correctamente con el formato A4 reglamentario.`
        });
      } else {
        const ratioOk = (doc.numPages - badPages.length) / doc.numPages;
        addCheck({
          code: "A1_TAMANO_PAPEL",
          categoryId: "formato_general",
          weight: 3,
          status: ratioOk > 0.7 ? "warn" : "fail",
          scoreRatio: ratioOk > 0.7 ? 0.5 : 0,
          pages: badPages,
          measured: detectedOtherSize,
          hallazgo: `Se detectaron ${badPages.length} página(s) configuradas en tamaño ${detectedOtherSize} en lugar de A4 (21,0 × 29,7 cm).`
        });
      }
    }

    // A2. Márgenes reglamentarios -> 4 pt
    {
      const marginViolationPages = [];
      const leftSamples = [];
      const rightSamples = [];
      const topSamples = [];
      let landscapeChecked = 0;
      let landscapeViolations = 0;

      const evalStart = Math.max(2, seg.bodyStart);
      for (const p of doc.pages) {
        if (p.pageNumber < evalStart) continue;
        if (p.bodyLines.length < 4) continue;

        if (p.orientation === "portrait") {
          // Líneas normales del cuerpo (excluyendo títulos centrados o celdas internas desplazadas)
          const leftAlignedLines = p.bodyLines.filter(
            (l) => l.text.length > 45 && l.xStartCm > 1.2 && l.xStartCm < 6.0
          );
          const rightReachingLines = p.bodyLines.filter(
            (l) => l.text.length > 50 && l.rightMarginCm > 1.0 && l.rightMarginCm < 4.5
          );
          const pageMinTop = p.bodyLines[0].topMarginCm;
          const pageMinBottom = p.bodyLines[p.bodyLines.length - 1].bottomDistCm;

          let pageLeft = null;
          if (leftAlignedLines.length >= 2) {
            const xs = leftAlignedLines.map((l) => l.xStartCm).sort((a, b) => a - b);
            pageLeft = xs[Math.floor(xs.length * 0.2)]; // borde izquierdo base de párrafos
            leftSamples.push(pageLeft);
          }

          let pageRight = null;
          if (rightReachingLines.length >= 2) {
            const rs = rightReachingLines.map((l) => l.rightMarginCm).sort((a, b) => a - b);
            pageRight = rs[Math.floor(rs.length * 0.2)];
            rightSamples.push(pageRight);
          }

          topSamples.push(pageMinTop);

          const badLeft = pageLeft !== null && (pageLeft < 3.12 || pageLeft > 3.95);
          const badRight = pageRight !== null && (pageRight < 2.12 || pageRight > 3.75);
          const badTop = pageMinTop < 2.08;
          const badBottom = pageMinBottom < 2.08;

          if (badLeft || badRight || badTop || badBottom) {
            marginViolationPages.push(p.pageNumber);
          }
        } else {
          // Orientación horizontal: Superior = 3.5 cm, Izq/Der/Inf = 2.5 cm (Pág. 4 DBRA)
          landscapeChecked++;
          const pageMinTop = p.bodyLines[0].topMarginCm;
          const minLeft = Math.min(...p.bodyLines.map((l) => l.xStartCm));
          if (pageMinTop < 3.12 || minLeft < 2.08) {
            landscapeViolations++;
            marginViolationPages.push(p.pageNumber);
          }
        }
      }

      const median = (arr) => {
        if (!arr.length) return null;
        const s = arr.slice().sort((a, b) => a - b);
        return round2(s[Math.floor(s.length / 2)]);
      };
      const medLeft = median(leftSamples);
      const medRight = median(rightSamples);
      const minTop = topSamples.length ? round2(Math.min(...topSamples)) : null;

      const measuredStr = `Izq: ~${medLeft ?? "—"} cm | Der: ~${medRight ?? "—"} cm | Sup mín: ~${minTop ?? "—"} cm`;
      const evaluatedCount = Math.max(1, doc.numPages - evalStart + 1);
      const failRate = marginViolationPages.length / evaluatedCount;

      if (marginViolationPages.length === 0) {
        addCheck({
          code: "A2_MARGENES",
          categoryId: "formato_general",
          weight: 4,
          status: "pass",
          measured: measuredStr,
          hallazgo: "Los márgenes medidos en las páginas del trabajo se ajustan a la norma ESPOCH (Izquierdo 3,5 cm; Superior, Derecho e Inferior 2,5 cm)."
        });
      } else {
        const details = [];
        if (medLeft !== null && (medLeft < 3.15 || medLeft > 3.9)) {
          details.push(`margen izquierdo promedio medido de ${medLeft} cm (debe ser 3,5 cm)`);
        }
        if (medRight !== null && (medRight < 2.15 || medRight > 3.1)) {
          details.push(`margen derecho medido de ${medRight} cm (debe ser 2,5 cm)`);
        }
        if (minTop !== null && minTop < 2.1) {
          details.push(`texto invadiendo margen superior a ${minTop} cm del borde (mínimo 2,5 cm)`);
        }
        if (landscapeViolations > 0) {
          details.push(`${landscapeViolations} hoja(s) horizontal(es) sin el margen superior de 3,5 cm para empastado`);
        }
        if (details.length === 0) {
          details.push(`desbordamiento o desajuste puntual de márgenes en ${marginViolationPages.length} página(s)`);
        }

        addCheck({
          code: "A2_MARGENES",
          categoryId: "formato_general",
          weight: 4,
          status: failRate <= 0.2 ? "warn" : "fail",
          scoreRatio: failRate <= 0.2 ? 0.55 : 0,
          pages: marginViolationPages,
          measured: measuredStr,
          hallazgo: `Se detectaron inconsistencias de márgenes en ${marginViolationPages.length} página(s): ${details.join("; ")}.`
        });
      }
    }

    // A3. Tipografía Times New Roman -> 3.5 pt
    {
      const nonTimesPages = [];
      const detectedOtherFonts = new Map();
      let totalChars = 0;
      let timesChars = 0;

      for (const p of doc.pages) {
        let pageHasWrongFont = false;
        for (const ln of p.lines) {
          if (ln.fontFamily === "Symbol/Math") continue;
          const len = ln.text.length;
          totalChars += len;
          if (ln.fontFamily === "Times New Roman") {
            timesChars += len;
          } else {
            // Ignorar fragmentos diminutos aislados (<= 3 caracteres como viñetas)
            if (len > 4) {
              pageHasWrongFont = true;
              detectedOtherFonts.set(ln.fontFamily, (detectedOtherFonts.get(ln.fontFamily) || 0) + len);
            }
          }
        }
        if (pageHasWrongFont) nonTimesPages.push(p.pageNumber);
      }

      const timesRatio = totalChars > 0 ? timesChars / totalChars : 1;
      if (nonTimesPages.length === 0 || timesRatio >= 0.992) {
        addCheck({
          code: "A3_TIPOGRAFIA",
          categoryId: "formato_general",
          weight: 3.5,
          status: "pass",
          measured: `Times New Roman (${round2(timesRatio * 100)}%)`,
          hallazgo: "Todo el documento emplea uniformemente la fuente institucional Times New Roman."
        });
      } else {
        const otherList = Array.from(detectedOtherFonts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([f]) => f)
          .slice(0, 4)
          .join(", ");

        addCheck({
          code: "A3_TIPOGRAFIA",
          categoryId: "formato_general",
          weight: 3.5,
          status: timesRatio >= 0.88 ? "warn" : "fail",
          scoreRatio: timesRatio >= 0.88 ? 0.5 : 0,
          pages: nonTimesPages,
          measured: `Times New Roman: ${round2(timesRatio * 100)}% | Otras: ${otherList}`,
          hallazgo: `Se detectó el uso de tipografías distintas a Times New Roman (${otherList}) en ${nonTimesPages.length} página(s) del documento.`
        });
      }
    }

    // A4. Tamaño de letra general 11 pt -> 3 pt
    {
      const wrongSizePages = [];
      const sizeHistogram = new Map();
      let bodyParagraphLines = 0;
      let ok11Lines = 0;

      for (const p of doc.pages) {
        if (p.pageNumber <= seg.portadaPage) continue;
        let pageBadCount = 0;
        for (const ln of p.bodyLines) {
          // Excluir líneas legítimas en 8 pt (Fuente/Realizado por/Total referencias) y 9 pt (citas en bloque)
          if (/^(?:Fuente|Realizado\s+por|Elaborado\s+por)\s*:/i.test(ln.text)) continue;
          if (/^Total\s+\d+\s+referencias/i.test(ln.text)) continue;
          if (ln.text.length < 35) continue;

          bodyParagraphLines++;
          const sz = Math.round(ln.fontSize * 2) / 2;
          sizeHistogram.set(sz, (sizeHistogram.get(sz) || 0) + 1);

          if (Math.abs(ln.fontSize - 11) <= 0.6 || Math.abs(ln.fontSize - 9) <= 0.4) {
            ok11Lines++;
          } else {
            pageBadCount++;
          }
        }
        if (pageBadCount >= 2) wrongSizePages.push(p.pageNumber);
      }

      let modalSize = 11;
      let bestCnt = -1;
      for (const [sz, cnt] of sizeHistogram.entries()) {
        if (cnt > bestCnt) {
          bestCnt = cnt;
          modalSize = sz;
        }
      }

      const ratio11 = bodyParagraphLines > 0 ? ok11Lines / bodyParagraphLines : 1;
      if (ratio11 >= 0.92) {
        addCheck({
          code: "A4_TAMANO_TEXTO",
          categoryId: "formato_general",
          weight: 3,
          status: "pass",
          measured: `Moda del cuerpo: ${modalSize} pt (${round2(ratio11 * 100)}% en 11 pt)`,
          hallazgo: "El cuerpo del trabajo utiliza correctamente tamaño de fuente de 11 puntos."
        });
      } else {
        addCheck({
          code: "A4_TAMANO_TEXTO",
          categoryId: "formato_general",
          weight: 3,
          status: ratio11 >= 0.7 ? "warn" : "fail",
          scoreRatio: ratio11 >= 0.7 ? 0.45 : 0,
          pages: wrongSizePages,
          measured: `Tamaño predominante detectado: ${modalSize} pt (exigido: 11 pt)`,
          hallazgo: `En ${wrongSizePages.length} página(s) el texto general presenta tamaño predominante de ${modalSize} pt en lugar de los 11 puntos establecidos por la ESPOCH.`
        });
      }
    }

    // A5. Espacio interlineado de 1,5 -> 2.5 pt
    {
      const badSpacingPages = [];
      const badPageMedians = [];
      const ratios = [];

      for (const p of doc.pages) {
        if (p.pageNumber < seg.bodyStart || p.pageNumber > seg.bodyEnd) continue;
        const pageRatios = [];
        for (const para of p.paragraphs) {
          if (para.lines.length < 3) continue;
          // Verificar que sea párrafo corrido del cuerpo (no celda interna de tabla compacta)
          const avgFont = para.lines.reduce((acc, l) => acc + l.fontSize, 0) / para.lines.length;
          const maxSpanCm = Math.max(...para.lines.map((l) => l.xEndCm - l.xStartCm));
          if (avgFont < 10.5 || avgFont > 13 || maxSpanCm < 9.0) continue;
          for (const dy of para.intraLineGaps) {
            if (dy > 10 && dy < 34) {
              const r = dy / avgFont;
              ratios.push(r);
              pageRatios.push(r);
            }
          }
        }
        if (pageRatios.length >= 2) {
          pageRatios.sort((a, b) => a - b);
          const medR = pageRatios[Math.floor(pageRatios.length / 2)];
          // En PDF (Word/Writer), interlineado 1.5 da razón dy/fontSize entre 1.44 y 2.05
          if (medR < 1.44 || medR > 2.06) {
            badSpacingPages.push(p.pageNumber);
            badPageMedians.push(medR);
          }
        }
      }

      const describeRatio = (r) => {
        if (r < 1.28) return "1,0 (sencillo)";
        if (r < 1.44) return "1,15 líneas";
        if (r > 2.06) return "2,0 (doble)";
        return "1,5 líneas";
      };

      ratios.sort((a, b) => a - b);
      const globalMedRatio = ratios.length > 0 ? ratios[Math.floor(ratios.length / 2)] : 1.75;

      if (badSpacingPages.length === 0) {
        const approxWordSpacing = describeRatio(globalMedRatio);
        addCheck({
          code: "A5_INTERLINEADO",
          categoryId: "formato_general",
          weight: 2.5,
          status: "pass",
          measured: `Interlineado estimado: ~${approxWordSpacing} (factor ${round2(globalMedRatio)}×)`,
          hallazgo: "El interlineado de los párrafos del cuerpo corresponde al espacio interlineado de 1,5 exigido."
        });
      } else {
        badPageMedians.sort((a, b) => a - b);
        const badMed = badPageMedians[Math.floor(badPageMedians.length / 2)];
        const badDesc = describeRatio(badMed);
        const bodyCount = Math.max(1, seg.bodyEnd - seg.bodyStart + 1);
        const badFrac = badSpacingPages.length / bodyCount;
        addCheck({
          code: "A5_INTERLINEADO",
          categoryId: "formato_general",
          weight: 2.5,
          status: badFrac <= 0.25 ? "warn" : "fail",
          scoreRatio: badFrac <= 0.25 ? 0.5 : 0,
          pages: badSpacingPages,
          measured: `Interlineado anómalo detectado: ~${badDesc}`,
          hallazgo: `Se detectó interlineado distinto a 1,5 (aprox. ${badDesc}) en ${badSpacingPages.length} página(s) del desarrollo del trabajo.`
        });
      }
    }

    // A6. Sin sangría en párrafos, títulos y viñetas -> 2 pt
    {
      const indentedPages = [];
      let totalBodyParas = 0;
      let indentedParas = 0;

      for (const p of doc.pages) {
        // Evaluar desde Introducción hasta Conclusiones (excluyendo Bibliografía donde SÍ va sangría francesa)
        if (p.pageNumber < seg.bodyStart || p.pageNumber > seg.bodyEnd) continue;
        let pageIndented = 0;

        for (const para of p.paragraphs) {
          if (para.lines.length < 2) continue;
          const l0 = para.lines[0];
          const l1 = para.lines[1];
          if (l0.text.length < 40 || l1.text.length < 40) continue;
          // Ignorar bloques centrados
          if (Math.abs(l0.centerXCm - 11.0) < 0.8 && l0.rightMarginCm > 4.0) continue;

          totalBodyParas++;
          const diffCm = l0.xStartCm - l1.xStartCm;
          // Si la 1ra línea tiene sangría >= 0.45 cm respecto a la 2da línea
          if (diffCm >= 0.45 && diffCm <= 2.5) {
            indentedParas++;
            pageIndented++;
          }
        }

        // También verificar títulos jerárquicos con sangría escalonada indebida
        for (const ln of p.bodyLines) {
          if (/^\d+(?:\.\d+)+\.?\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(ln.text) && ln.xStartCm > 4.15) {
            pageIndented++;
          }
        }

        if (pageIndented > 0) indentedPages.push(p.pageNumber);
      }

      if (indentedPages.length === 0) {
        addCheck({
          code: "A6_SIN_SANGRIA",
          categoryId: "formato_general",
          weight: 2,
          status: "pass",
          measured: "0 cm de sangría en párrafos y títulos",
          hallazgo: "No se detectó sangría de primera línea ni sangría escalonada en títulos del cuerpo del trabajo."
        });
      } else {
        const frac = totalBodyParas > 0 ? indentedParas / totalBodyParas : 0.5;
        addCheck({
          code: "A6_SIN_SANGRIA",
          categoryId: "formato_general",
          weight: 2,
          status: frac <= 0.15 && indentedPages.length <= 3 ? "warn" : "fail",
          scoreRatio: frac <= 0.15 && indentedPages.length <= 3 ? 0.5 : 0,
          pages: indentedPages,
          measured: `${indentedParas} párrafo(s)/título(s) con sangría en ${indentedPages.length} pág(s)`,
          hallazgo: `Se encontró sangría de primera línea o sangría en subtítulos/viñetas en ${indentedPages.length} página(s). Recuerde que la normativa ESPOCH prohíbe aplicar sangría en el cuerpo del texto.`
        });
      }
    }

    // =========================================================================
    // CATEGORÍA 2: PAGINACIÓN POR SECCIONES (13 puntos)
    // =========================================================================

    // B1. Portada sin numeración visible -> 2 pt
    {
      const cover = doc.pages[seg.portadaPage - 1];
      const hasCoverNum = Boolean(cover && cover.pageNumInfo);
      if (!hasCoverNum) {
        addCheck({
          code: "B1_PORTADA_SIN_PAG",
          categoryId: "paginacion",
          weight: 2,
          status: "pass",
          measured: "Portada sin número visible",
          hallazgo: "La Portada cumple correctamente al no mostrar numeración de página."
        });
      } else {
        addCheck({
          code: "B1_PORTADA_SIN_PAG",
          categoryId: "paginacion",
          weight: 2,
          status: "fail",
          pages: [seg.portadaPage],
          measured: `Número visible detectado: '${cover.pageNumInfo.raw}'`,
          hallazgo: `La Portada (pág. ${seg.portadaPage}) muestra el número de página '${cover.pageNumInfo.raw}', cuando por normativa no debe enumerarse visiblemente.`
        });
      }
    }

    // B2. Preliminares en romanos minúsculas (ii, iii, iv...) -> 3 pt
    {
      if (seg.prelimEnd < seg.prelimStart) {
        addCheck({
          code: "B2_PAG_PRELIMINARES",
          categoryId: "paginacion",
          weight: 3,
          status: "fail",
          pages: [1],
          measured: "Sin páginas preliminares detectadas antes del texto",
          hallazgo: "No se encontraron páginas preliminares numeradas en romanos minúsculas antes del inicio del texto."
        });
      } else {
        const badPages = [];
        const issues = [];
        let expectedRoman = 2; // Inicia en ii (Derecho de Autor)
        for (let pNum = seg.prelimStart; pNum <= seg.prelimEnd; pNum++) {
          const pInfo = doc.pages[pNum - 1].pageNumInfo;
          if (!pInfo) {
            badPages.push(pNum);
            if (issues.length < 3) issues.push(`pág. PDF ${pNum} sin numeración`);
          } else if (pInfo.type !== "roman_lower") {
            badPages.push(pNum);
            if (issues.length < 3) issues.push(`pág. PDF ${pNum} tiene '${pInfo.raw}' (no es romano en minúscula)`);
          } else if (pNum === seg.prelimStart && pInfo.value !== 2) {
            badPages.push(pNum);
            issues.push(`inicia en '${pInfo.raw}' en lugar de 'ii'`);
            expectedRoman = pInfo.value;
          } else if (pInfo.value !== expectedRoman) {
            badPages.push(pNum);
            if (issues.length < 3) issues.push(`salto de secuencia en pág. PDF ${pNum} ('${pInfo.raw}')`);
            expectedRoman = pInfo.value;
          }
          expectedRoman++;
        }

        const totalPrelim = seg.prelimEnd - seg.prelimStart + 1;
        if (badPages.length === 0) {
          const firstRaw = doc.pages[seg.prelimStart - 1].pageNumInfo?.raw || "ii";
          const lastRaw = doc.pages[seg.prelimEnd - 1].pageNumInfo?.raw || "";
          addCheck({
            code: "B2_PAG_PRELIMINARES",
            categoryId: "paginacion",
            weight: 3,
            status: "pass",
            measured: `Romanos minúsculas continuos (${firstRaw} – ${lastRaw})`,
            hallazgo: `Las ${totalPrelim} páginas preliminares están correctamente enumeradas en números romanos en minúsculas iniciando en 'ii'.`
          });
        } else {
          const okFrac = (totalPrelim - badPages.length) / totalPrelim;
          addCheck({
            code: "B2_PAG_PRELIMINARES",
            categoryId: "paginacion",
            weight: 3,
            status: okFrac >= 0.6 ? "warn" : "fail",
            scoreRatio: okFrac >= 0.6 ? 0.5 : 0,
            pages: badPages,
            measured: `${badPages.length} de ${totalPrelim} preliminares con error`,
            hallazgo: `Incumplimiento en la numeración romana en minúsculas de páginas preliminares: ${issues.join("; ")}.`
          });
        }
      }
    }

    // B3. Cuerpo del trabajo en números arábigos (1, 2, 3...) -> 3 pt
    {
      const badPages = [];
      const issues = [];
      let expectedArabic = 1;
      const totalBody = Math.max(0, seg.bodyEnd - seg.bodyStart + 1);

      for (let pNum = seg.bodyStart; pNum <= seg.bodyEnd; pNum++) {
        const pInfo = doc.pages[pNum - 1].pageNumInfo;
        if (!pInfo) {
          badPages.push(pNum);
          if (issues.length < 3) issues.push(`pág. PDF ${pNum} sin número`);
        } else if (pInfo.type !== "arabic") {
          badPages.push(pNum);
          if (issues.length < 3) issues.push(`pág. PDF ${pNum} usa '${pInfo.raw}' en vez de arábigo`);
        } else if (pNum === seg.bodyStart && pInfo.value !== 1) {
          badPages.push(pNum);
          issues.push(`Introducción/Cuerpo inicia en '${pInfo.raw}' en lugar de '1'`);
          expectedArabic = pInfo.value;
        } else if (pInfo.value !== expectedArabic) {
          badPages.push(pNum);
          if (issues.length < 3) issues.push(`secuencia interrumpida en pág. PDF ${pNum} ('${pInfo.raw}')`);
          expectedArabic = pInfo.value;
        }
        expectedArabic++;
      }

      if (totalBody > 0 && badPages.length === 0) {
        addCheck({
          code: "B3_PAG_CUERPO",
          categoryId: "paginacion",
          weight: 3,
          status: "pass",
          measured: `Arábigos continuos (1 – ${totalBody})`,
          hallazgo: `El cuerpo del trabajo (${totalBody} páginas, desde Introducción hasta Conclusiones/Recomendaciones) está enumerado correctamente en arábigos iniciando en 1.`
        });
      } else {
        const okFrac = totalBody > 0 ? (totalBody - badPages.length) / totalBody : 0;
        addCheck({
          code: "B3_PAG_CUERPO",
          categoryId: "paginacion",
          weight: 3,
          status: okFrac >= 0.7 ? "warn" : "fail",
          scoreRatio: okFrac >= 0.7 ? 0.5 : 0,
          pages: badPages,
          measured: `${badPages.length} pág(s) con error de numeración arábiga`,
          hallazgo: `Observaciones en la paginación arábiga del cuerpo del trabajo: ${issues.join("; ") || "no se detectó numeración arábiga continua desde 1"}.`
        });
      }
    }

    // B4. Páginas finales sin paginación -> 3 pt
    {
      if (!seg.finalsStart) {
        addCheck({
          code: "B4_PAG_FINALES",
          categoryId: "paginacion",
          weight: 3,
          status: "fail",
          pages: [doc.numPages],
          measured: "No se detectaron secciones finales (Bibliografía / Anexos)",
          hallazgo: "No se pudo verificar ausencia de paginación en páginas finales porque no se identificó la sección de Bibliografía o Anexos."
        });
      } else {
        const numberedFinalPages = [];
        for (let pNum = seg.finalsStart; pNum <= doc.numPages; pNum++) {
          if (doc.pages[pNum - 1].pageNumInfo) {
            numberedFinalPages.push(pNum);
          }
        }
        const totalFinals = doc.numPages - seg.finalsStart + 1;
        if (numberedFinalPages.length === 0) {
          addCheck({
            code: "B4_PAG_FINALES",
            categoryId: "paginacion",
            weight: 3,
            status: "pass",
            measured: `${totalFinals} página(s) finales sin numeración`,
            hallazgo: "Las páginas finales (Glosario, Bibliografía y/o Anexos) cumplen correctamente con NO llevar numeración de página."
          });
        } else {
          addCheck({
            code: "B4_PAG_FINALES",
            categoryId: "paginacion",
            weight: 3,
            status: "fail",
            pages: numberedFinalPages,
            measured: `${numberedFinalPages.length} de ${totalFinals} páginas finales tienen número`,
            hallazgo: `Las páginas finales NO deben enumerarse según la Guía DBRA (págs. 6 y 26), pero se detectó numeración visible en ${numberedFinalPages.length} página(s) correspondientes a Glosario, Bibliografía o Anexos.`
          });
        }
      }
    }

    // B5. Posición del número de página (centrado y a 2 cm del borde inferior) -> 2 pt
    {
      const badPosPages = [];
      const distSamples = [];
      let notCenteredCount = 0;
      let topZoneCount = 0;

      for (const p of doc.pages) {
        const pi = p.pageNumInfo;
        if (!pi) continue;
        if (pi.zone === "top") {
          topZoneCount++;
          badPosPages.push(p.pageNumber);
          continue;
        }
        distSamples.push(pi.bottomDistCm);
        const distOk = pi.bottomDistCm >= 1.45 && pi.bottomDistCm <= 2.65;
        if (!pi.isCentered) notCenteredCount++;
        if (!pi.isCentered || !distOk) {
          badPosPages.push(p.pageNumber);
        }
      }

      distSamples.sort((a, b) => a - b);
      const medDist = distSamples.length ? round2(distSamples[Math.floor(distSamples.length / 2)]) : null;

      if (distSamples.length === 0 && topZoneCount === 0) {
        addCheck({
          code: "B5_POSICION_PAG",
          categoryId: "paginacion",
          weight: 2,
          status: "fail",
          measured: "Sin números de página detectados",
          hallazgo: "No se detectaron números de página en el margen inferior del documento."
        });
      } else if (badPosPages.length === 0) {
        addCheck({
          code: "B5_POSICION_PAG",
          categoryId: "paginacion",
          weight: 2,
          status: "pass",
          measured: `Centrado, a ~${medDist} cm del borde inferior`,
          hallazgo: "La numeración de página está correctamente centrada y ubicada a ~2 cm del borde inferior."
        });
      } else {
        const reasons = [];
        if (topZoneCount > 0) reasons.push(`numeración en el borde superior en ${topZoneCount} pág(s)`);
        if (notCenteredCount > 0) reasons.push(`alineación no centrada en ${notCenteredCount} pág(s)`);
        if (medDist !== null && (medDist < 1.45 || medDist > 2.65)) {
          reasons.push(`distancia al borde inferior de ${medDist} cm (debe ser 2,0 cm)`);
        }
        addCheck({
          code: "B5_POSICION_PAG",
          categoryId: "paginacion",
          weight: 2,
          status: badPosPages.length <= 3 ? "warn" : "fail",
          scoreRatio: badPosPages.length <= 3 ? 0.5 : 0,
          pages: badPosPages,
          measured: `Distancia inferior mediana: ${medDist ?? "—"} cm`,
          hallazgo: `La posición del número de página presenta observaciones en ${badPosPages.length} página(s): ${reasons.join("; ")}.`
        });
      }
    }

    // =========================================================================
    // CATEGORÍA 3: PORTADA Y PÁGINAS PRELIMINARES (17 puntos)
    // =========================================================================

    // C1. Portada Matriz (elementos, facultad/carrera Gestión del Transporte, isologo y tamaños) -> 5 pt
    {
      const cover = doc.pages[seg.portadaPage - 1];
      const coverNorm = normalizeText(cover.fullText);
      const missing = [];
      const sizeIssues = [];

      // Verificar escudo/isologo institucional (~4x4 cm)
      const logoImg = cover.images.find((im) => im.yMin < cover.heightPt * 0.35);
      if (!logoImg) {
        missing.push("Isologo institucional de la ESPOCH (4×4 cm) en la parte superior");
      } else if (
        Math.abs(logoImg.widthCm - 4.0) > 1.3 ||
        Math.abs(logoImg.heightCm - 4.0) > 1.3
      ) {
        sizeIssues.push(`Isologo medido de ${logoImg.widthCm}×${logoImg.heightCm} cm (norma: 4×4 cm)`);
      }

      const checkCoverLine = (regex, label, expectedPt) => {
        const ln = cover.bodyLines.find((l) => regex.test(l.norm));
        if (!ln) {
          missing.push(label);
        } else if (expectedPt && Math.abs(ln.fontSize - expectedPt) > 1.1) {
          sizeIssues.push(`${label} está en ${ln.fontSize} pt (debe ser ${expectedPt} pt)`);
        }
      };

      checkCoverLine(/ESCUELA\s+SUPERIOR\s+POLITECNICA\s+DE\s+CHIMBORAZO/, "Nombre institucional ESPOCH", 16);
      checkCoverLine(/FACULTAD\s+DE\s+ADMINISTRACION\s+DE\s+EMPRESAS|^FACULTAD\s+DE\b/, "Facultad (FADE)", 14);
      checkCoverLine(/GESTION\s+DEL\s+TRANSPORTE|^CARRERA\b/, "Carrera de Gestión del Transporte", 12);
      checkCoverLine(/TRABAJO\s+DE\s+(?:INTEGRACION\s+CURRICULAR|TITULACION)/, "Modalidad (Trabajo de Integración Curricular / Titulación)", 12);
      checkCoverLine(/TIPO\s*:/, "Especificación 'Tipo:'", 12);
      checkCoverLine(/PRESENTADO\s+PARA\s+OPTAR\s+AL\s+GRADO\s+ACADEMICO/, "Leyenda 'Presentado para optar al grado académico de:'", 12);
      checkCoverLine(/LICENCIAD|INGENIER/, "Grado académico a optar", 14);
      checkCoverLine(/AUTOR/, "Bloque AUTOR/A(ES)", 14);
      checkCoverLine(/DIRECTOR/, "Bloque DIRECTOR/A", 12);
      checkCoverLine(/RIOBAMBA\s*[-–—]?\s*ECUADOR/, "Ciudad y País (Riobamba - Ecuador)", 12);

      if (!/GESTION\s+DEL\s+TRANSPORTE/.test(coverNorm)) {
        missing.push("Mención explícita a la Carrera de Gestión del Transporte");
      }

      if (missing.length === 0 && sizeIssues.length === 0) {
        addCheck({
          code: "C1_PORTADA",
          categoryId: "preliminares",
          weight: 5,
          status: "pass",
          pages: [seg.portadaPage],
          measured: "Todos los bloques y puntajes (16/14/12 pt) verificados",
          hallazgo: "La Portada contiene todos los datos institucionales, de la Carrera de Gestión del Transporte, autoría, dirección y tamaños tipográficos reglamentarios."
        });
      } else {
        const totalErrors = missing.length * 2 + sizeIssues.length;
        const ratio = Math.max(0, 1 - totalErrors * 0.14);
        const msgParts = [];
        if (missing.length > 0) msgParts.push(`Elementos faltantes o con texto distinto al oficial: ${missing.join(", ")}`);
        if (sizeIssues.length > 0) msgParts.push(`Tamaños de fuente/isologo fuera de norma: ${sizeIssues.join("; ")}`);

        addCheck({
          code: "C1_PORTADA",
          categoryId: "preliminares",
          weight: 5,
          status: ratio >= 0.5 ? "warn" : "fail",
          scoreRatio: round2(ratio),
          pages: [seg.portadaPage],
          measured: `${missing.length} faltante(s), ${sizeIssues.length} ajuste(s) de tamaño`,
          hallazgo: msgParts.join(". ") + "."
        });
      }
    }

    // C2. Páginas preliminares legales obligatorias y su orden -> 4 pt
    {
      const missingLegal = [];
      if (!seg.derechoAutorPage) missingLegal.push("Derecho de Autor (Copyright ©)");
      if (!seg.autenticidadPage) missingLegal.push("Declaración de Autenticidad y Cesión de Derechos de Autor");
      if (!seg.certificacionPage) missingLegal.push("Certificación de Dirección / Tribunal del Trabajo");

      let orderOk = true;
      if (seg.derechoAutorPage && seg.autenticidadPage && seg.derechoAutorPage > seg.autenticidadPage) {
        orderOk = false;
      }
      if (seg.autenticidadPage && seg.certificacionPage && seg.autenticidadPage > seg.certificacionPage) {
        orderOk = false;
      }

      if (missingLegal.length === 0 && orderOk) {
        addCheck({
          code: "C2_PAGINAS_LEGALES",
          categoryId: "preliminares",
          weight: 4,
          status: "pass",
          pages: [seg.derechoAutorPage, seg.autenticidadPage, seg.certificacionPage],
          measured: `Orden verificado en págs. PDF ${seg.derechoAutorPage}, ${seg.autenticidadPage} y ${seg.certificacionPage}`,
          hallazgo: "Constan las tres páginas legales preliminares obligatorias en la secuencia exacta exigida por la DBRA."
        });
      } else {
        const foundCount = 3 - missingLegal.length;
        const ratio = Math.max(0, (foundCount / 3) * (orderOk ? 1 : 0.7));
        const msg = [];
        if (missingLegal.length > 0) msg.push(`No se detectaron: ${missingLegal.join(", ")}`);
        if (!orderOk) msg.push("El orden entre Derecho de Autor, Declaración de Autenticidad y Certificación está invertido");

        addCheck({
          code: "C2_PAGINAS_LEGALES",
          categoryId: "preliminares",
          weight: 4,
          status: ratio >= 0.5 ? "warn" : "fail",
          scoreRatio: round2(ratio),
          pages: [seg.derechoAutorPage, seg.autenticidadPage, seg.certificacionPage].filter(Boolean),
          measured: `${foundCount}/3 páginas legales encontradas`,
          hallazgo: msg.join(". ") + "."
        });
      }
    }

    // C3. Dedicatoria y Agradecimiento (opcionales) -> 2 pt
    {
      if (!seg.dedicatoriaPage && !seg.agradecimientoPage) {
        addCheck({
          code: "C3_DEDICATORIA_AGRADECIMIENTO",
          categoryId: "preliminares",
          weight: 2,
          status: "na",
          measured: "Secciones opcionales no incluidas",
          hallazgo: "No se incluyeron páginas de Dedicatoria ni Agradecimiento (son opcionales según la Guía DBRA, págs. 11–12; no afecta el puntaje)."
        });
      } else {
        const obs = [];
        const affectedPages = [];

        if (seg.dedicatoriaPage) {
          const dPage = doc.pages[seg.dedicatoriaPage - 1];
          // Excluir título DEDICATORIA y firma final corta (Nombre)
          const contentParas = dPage.paragraphs.filter(
            (pr) => !/^DEDICATORIA$/i.test(pr.text.trim()) && pr.text.trim().split(/\s+/).length > 4
          );
          if (contentParas.length > 1) {
            obs.push(`la Dedicatoria tiene ${contentParas.length} párrafos (la guía exige redactarla en UN SOLO PÁRRAFO breve)`);
            affectedPages.push(seg.dedicatoriaPage);
          }
          const diminutivosRegex = /\b(?:mamita|papito|hermanit[oa]s?|abuelit[oa]s?|hijit[oa]s?|amorcito|pequeñit[oa]s?|angelito|pedacito|corazoncito|sobrinit[oa]s?|primit[oa]s?|amiguit[oa]s?|perrito|gatito)\b/i;
          const dimMatch = dPage.fullText.match(diminutivosRegex);
          if (dimMatch) {
            obs.push(`se detectó el uso de diminutivo ('${dimMatch[0]}') en la Dedicatoria (prohibido en pág. 11 DBRA)`);
            affectedPages.push(seg.dedicatoriaPage);
          }
        }

        if (obs.length === 0) {
          addCheck({
            code: "C3_DEDICATORIA_AGRADECIMIENTO",
            categoryId: "preliminares",
            weight: 2,
            status: "pass",
            pages: [seg.dedicatoriaPage, seg.agradecimientoPage].filter(Boolean),
            measured: "Formato formal y párrafo único cumplidos",
            hallazgo: "Las páginas opcionales incluidas (Dedicatoria / Agradecimiento) cumplen con las recomendaciones de brevedad, párrafo único y ausencia de diminutivos."
          });
        } else {
          addCheck({
            code: "C3_DEDICATORIA_AGRADECIMIENTO",
            categoryId: "preliminares",
            weight: 2,
            status: "warn",
            scoreRatio: 0.4,
            pages: affectedPages,
            measured: `${obs.length} observación(es) de estilo`,
            hallazgo: `Observaciones en páginas opcionales: ${obs.join("; ")}.`
          });
        }
      }
    }

    // C4. Índices de Contenido, Tablas, Ilustraciones y Anexos -> 6 pt
    {
      const issues = [];
      const idxPages = [];

      // Contar si en el cuerpo hay tablas, ilustraciones y anexos reales
      let hasBodyTables = false;
      let hasBodyIllus = false;
      for (let pNum = seg.bodyStart; pNum <= seg.bodyEnd; pNum++) {
        const txt = doc.pages[pNum - 1].fullText;
        if (/\b(?:Tabla|Cuadro)\s+\d+/i.test(txt)) hasBodyTables = true;
        if (/\b(?:Ilustraci[óo]n|Figura|Gr[áa]fico)\s+\d+/i.test(txt)) hasBodyIllus = true;
      }

      if (!seg.indiceContenidoPage) {
        issues.push("Falta el ÍNDICE DE CONTENIDO obligatorio");
      } else {
        idxPages.push(seg.indiceContenidoPage);
        // Revisar líneas del Índice de Contenido
        const tocEnd =
          seg.indiceTablasPage ||
          seg.indiceIlustracionesPage ||
          seg.indiceAnexosPage ||
          seg.resumenPage ||
          seg.bodyStart;

        let capWithPageNum = 0;
        let finalWithPageNum = 0;
        let priorListed = 0;

        for (let p = seg.indiceContenidoPage; p < tocEnd; p++) {
          for (const ln of doc.pages[p - 1].bodyLines) {
            const n = ln.norm;
            // Verificar si CAPÍTULO I, II... tiene número de página al final (prohibido pág. 13 DBRA)
            if (/^CAPITULO\s+(?:I|II|III|IV|V|VI|\d+)\b/.test(n) && /(?:\.{3,}|\s+)\d+\s*$/.test(ln.text)) {
              capWithPageNum++;
              idxPages.push(p);
            }
            // Verificar si GLOSARIO, BIBLIOGRAFÍA o ANEXOS tienen número de página en el índice
            if (/^(?:GLOSARIO|BIBLIOGRAFIA|ANEXOS?)\b/.test(n) && /(?:\.{3,}|\s+)\d+\s*$/.test(ln.text)) {
              finalWithPageNum++;
              idxPages.push(p);
            }
            // Verificar si incluyeron secciones ubicadas ANTES del Índice de Contenido
            if (/^(?:PORTADA|DERECHO\s+DE\s+AUTOR|DECLARACION\s+DE\s+AUTENTICIDAD|DEDICATORIA|AGRADECIMIENTO)\b/.test(n)) {
              priorListed++;
              idxPages.push(p);
            }
          }
        }

        if (capWithPageNum > 0) {
          issues.push(`en el Índice de Contenido se especificó número de página en ${capWithPageNum} línea(s) de 'CAPÍTULO' (la norma DBRA pág. 13 indica que NO se pone número de página al CAPÍTULO, PARTE O SECCIÓN)`);
        }
        if (finalWithPageNum > 0) {
          issues.push("en el Índice de Contenido se colocó número de página a Glosario, Bibliografía o Anexos (las páginas finales no llevan paginación)");
        }
        if (priorListed > 0) {
          issues.push("el Índice de Contenido lista secciones preliminares ubicadas antes de dicho índice (solo deben registrarse secciones posteriores al Índice de Contenido)");
        }
      }

      if (hasBodyTables && !seg.indiceTablasPage) {
        issues.push("existen tablas en el documento pero falta el ÍNDICE DE TABLAS");
      }
      if (hasBodyIllus && !seg.indiceIlustracionesPage) {
        issues.push("existen ilustraciones/figuras en el documento pero falta el ÍNDICE DE ILUSTRACIONES");
      }
      if (seg.anexosPage && !seg.indiceAnexosPage) {
        issues.push("existen Anexos en el documento pero falta el ÍNDICE DE ANEXOS");
      }

      // Si existe Índice de Anexos, comprobar que NO especifique números de página (pág. 16 DBRA)
      if (seg.indiceAnexosPage) {
        const iaPage = doc.pages[seg.indiceAnexosPage - 1];
        const annexLinesWithPage = iaPage.bodyLines.filter(
          (l) => /^ANEXO\s+[A-Z0-9]/i.test(l.norm) && /(?:\.{3,}|\s{2,})\d+\s*$/.test(l.text)
        );
        if (annexLinesWithPage.length > 0) {
          issues.push("el ÍNDICE DE ANEXOS incluye números de página (según pág. 16 DBRA, los anexos no llevan paginación ni número en su índice)");
          idxPages.push(seg.indiceAnexosPage);
        }
      }

      if (issues.length === 0) {
        addCheck({
          code: "C4_INDICES",
          categoryId: "preliminares",
          weight: 6,
          status: "pass",
          pages: [
            seg.indiceContenidoPage,
            seg.indiceTablasPage,
            seg.indiceIlustracionesPage,
            seg.indiceAnexosPage
          ].filter(Boolean),
          measured: "Índices completos y sin numeración indebida en Capítulos/Anexos",
          hallazgo: "Los índices normativos están presentes y cumplen con las reglas de estructuración y numeración de la DBRA."
        });
      } else {
        const ratio = Math.max(0, 1 - issues.length * 0.28);
        addCheck({
          code: "C4_INDICES",
          categoryId: "preliminares",
          weight: 6,
          status: ratio >= 0.44 ? "warn" : "fail",
          scoreRatio: round2(ratio),
          pages: idxPages,
          measured: `${issues.length} observación(es) en índices`,
          hallazgo: `Se detectaron las siguientes novedades en los índices: ${issues.join("; ")}.`
        });
      }
    }

    // =========================================================================
    // CATEGORÍA 4: RESUMEN, PALABRAS CLAVE Y ABSTRACT (12 puntos)
    // =========================================================================

    // D1. Resumen informativo (200–300 palabras, un solo párrafo, 3ra persona) -> 5 pt
    let resumenKeywordLine = "";
    {
      if (!seg.resumenPage) {
        addCheck({
          code: "D1_RESUMEN",
          categoryId: "resumen_abstract",
          weight: 5,
          status: "fail",
          measured: "Sección RESUMEN no encontrada",
          hallazgo: "No se encontró la página preliminar obligatoria de RESUMEN."
        });
      } else {
        const rPage = doc.pages[seg.resumenPage - 1];
        const bodyParas = [];
        for (const pr of rPage.paragraphs) {
          const t = pr.text.trim();
          if (/^RESUMEN$/i.test(t)) continue;
          if (/^Palabras\s+claves?\s*:/i.test(t)) {
            resumenKeywordLine = t;
            continue;
          }
          // Si las palabras clave quedaron pegadas al final del párrafo, separarlas
          const kwIdx = t.search(/Palabras\s+claves?\s*:/i);
          if (kwIdx !== -1) {
            const beforeKw = t.slice(0, kwIdx).trim();
            resumenKeywordLine = t.slice(kwIdx).trim();
            if (beforeKw) bodyParas.push(beforeKw);
          } else {
            bodyParas.push(t);
          }
        }

        // Si las palabras clave están en líneas individuales debajo
        if (!resumenKeywordLine) {
          const kwLineIdx = rPage.bodyLines.findIndex((l) => /^PALABRAS\s+CLAVES?\s*:/i.test(l.norm));
          if (kwLineIdx !== -1) {
            resumenKeywordLine = rPage.bodyLines
              .slice(kwLineIdx)
              .map((l) => l.text)
              .join(" ");
          }
        }

        const resumenFull = bodyParas.join(" ").trim();
        const wordCount = resumenFull ? resumenFull.split(/\s+/).length : 0;
        const paraCount = bodyParas.filter((p) => p.split(/\s+/).length > 10).length;

        const issues = [];
        if (wordCount < 200 || wordCount > 300) {
          issues.push(`extensión de ${wordCount} palabras (la norma exige estrictamente entre 200 y 300 palabras)`);
        }
        if (paraCount > 1) {
          issues.push(`está dividido en ${paraCount} párrafos (debe estructurarse en UN SOLO PÁRRAFO)`);
        }
        const firstPersonMatch = resumenFull.match(
          /\b(?:realicé|investigué|determiné|obtuve|concluí|realizamos|investigamos|obtuvimos|concluimos|proponemos|nuestro\s+trabajo|nuestra\s+investigaci[óo]n|mi\s+investigaci[óo]n)\b/i
        );
        if (firstPersonMatch) {
          issues.push(`redacción en primera persona ('${firstPersonMatch[0]}'); debe redactarse en pasado y tercera persona`);
        }

        // Verificar indicios del esquema POMRC
        const hasObjetivo = /objetivo|prop[óo]sito|finalidad|busc[óo]|determinar|analizar|evaluar|diseñar/i.test(resumenFull);
        const hasMetodo = /metodolog|enfoque|diseño|muestra|poblaci[óo]n|encuesta|entrevista|instrumento|m[ée]todo|cuantitativ|cualitativ/i.test(resumenFull);
        const hasResultConcl = /resultado|conclu|determin[óo]|evidenci[óo]|demostr[óo]|permiti[óo]|propone/i.test(resumenFull);
        if (wordCount > 50 && (!hasObjetivo || !hasMetodo || !hasResultConcl)) {
          const missingPomrc = [];
          if (!hasObjetivo) missingPomrc.push("Objetivo");
          if (!hasMetodo) missingPomrc.push("Metodología");
          if (!hasResultConcl) missingPomrc.push("Resultados/Conclusión");
          issues.push(`revisar esquema POMRC (no se aprecia claramente: ${missingPomrc.join(", ")})`);
        }

        if (issues.length === 0) {
          addCheck({
            code: "D1_RESUMEN",
            categoryId: "resumen_abstract",
            weight: 5,
            status: "pass",
            pages: [seg.resumenPage],
            measured: `${wordCount} palabras | 1 párrafo | POMRC completo`,
            hallazgo: `El Resumen cumple con la extensión normativa (${wordCount} palabras, rango 200–300), está estructurado en un solo párrafo, en tercera persona y contempla los componentes POMRC.`
          });
        } else {
          const ratio = Math.max(0, 1 - issues.length * 0.35);
          addCheck({
            code: "D1_RESUMEN",
            categoryId: "resumen_abstract",
            weight: 5,
            status: ratio >= 0.3 ? "warn" : "fail",
            scoreRatio: round2(ratio),
            pages: [seg.resumenPage],
            measured: `${wordCount} palabras | ${Math.max(1, paraCount)} párrafo(s)`,
            hallazgo: `El Resumen (pág. ${seg.resumenPage}) presenta observaciones: ${issues.join("; ")}.`
          });
        }
      }
    }

    // D2. Palabras clave (5 palabras clave con formato <PALABRA CLAVE>) -> 3.5 pt
    {
      if (!seg.resumenPage || !resumenKeywordLine) {
        addCheck({
          code: "D2_PALABRAS_CLAVE",
          categoryId: "resumen_abstract",
          weight: 3.5,
          status: "fail",
          pages: seg.resumenPage ? [seg.resumenPage] : [],
          measured: "Sin línea de Palabras clave al final del Resumen",
          hallazgo: "No se encontró el bloque 'Palabras clave:' al final de la página del Resumen."
        });
      } else {
        const rawAfterColon = resumenKeywordLine.replace(/^Palabras\s+claves?\s*:\s*/i, "").replace(/\.$/, "").trim();
        const angleMatches = rawAfterColon.match(/<[^>]+>/g);
        const splitItems = angleMatches
          ? angleMatches
          : rawAfterColon
              .split(/[,;]+/)
              .map((s) => s.trim())
              .filter(Boolean);

        const count = splitItems.length;
        const hasAngleBrackets = Boolean(angleMatches && angleMatches.length === count);
        const isUpperCase = splitItems.every((w) => w === w.toUpperCase());

        const issues = [];
        if (count !== 5) {
          issues.push(`se encontraron ${count} palabras clave (la guía DBRA pág. 22 establece una secuencia de cinco [5] palabras clave)`);
        }
        if (!hasAngleBrackets) {
          issues.push("no están encerradas entre signos angulares <PALABRA CLAVE> como muestra el formato oficial DBRA (págs. 21–22)");
        }
        if (!isUpperCase) {
          issues.push("las palabras clave deben escribirse en MAYÚSCULAS");
        }

        if (issues.length === 0) {
          addCheck({
            code: "D2_PALABRAS_CLAVE",
            categoryId: "resumen_abstract",
            weight: 3.5,
            status: "pass",
            pages: [seg.resumenPage],
            measured: `5 descriptores en formato <MAYÚSCULAS>`,
            hallazgo: "Las Palabras clave cumplen exactamente en cantidad (5) y formato de indización DBRA (<... > en mayúsculas)."
          });
        } else {
          const ratio = Math.max(0.25, 1 - issues.length * 0.32);
          addCheck({
            code: "D2_PALABRAS_CLAVE",
            categoryId: "resumen_abstract",
            weight: 3.5,
            status: "warn",
            scoreRatio: round2(ratio),
            pages: [seg.resumenPage],
            measured: `${count} descriptor(es) detectado(s)`,
            hallazgo: `Observaciones en Palabras clave (pág. ${seg.resumenPage}): ${issues.join("; ")}.`
          });
        }
      }
    }

    // D3. Summary / Abstract en inglés -> 3.5 pt
    {
      if (!seg.abstractPage) {
        addCheck({
          code: "D3_ABSTRACT",
          categoryId: "resumen_abstract",
          weight: 3.5,
          status: "fail",
          pages: seg.resumenPage ? [seg.resumenPage] : [],
          measured: "SUMMARY / ABSTRACT no encontrado",
          hallazgo: "No se encontró la sección obligatoria SUMMARY / ABSTRACT en idioma inglés después del Resumen."
        });
      } else {
        const aPage = doc.pages[seg.abstractPage - 1];
        const hasKeywords = /\bKeywords\s*:/i.test(aPage.fullText);
        if (hasKeywords) {
          addCheck({
            code: "D3_ABSTRACT",
            categoryId: "resumen_abstract",
            weight: 3.5,
            status: "pass",
            pages: [seg.abstractPage],
            measured: `Presente en pág. PDF ${seg.abstractPage} con Keywords`,
            hallazgo: "La sección SUMMARY / ABSTRACT y sus Keywords en inglés están correctamente incluidas."
          });
        } else {
          addCheck({
            code: "D3_ABSTRACT",
            categoryId: "resumen_abstract",
            weight: 3.5,
            status: "warn",
            scoreRatio: 0.65,
            pages: [seg.abstractPage],
            measured: "Presente, pero sin bloque 'Keywords:'",
            hallazgo: `Se encontró la página de SUMMARY / ABSTRACT (pág. ${seg.abstractPage}), pero no se identificó el bloque final 'Keywords:' equivalente a las palabras clave.`
          });
        }
      }
    }

    // =========================================================================
    // CATEGORÍA 5: ESTRUCTURA CAPITULAR Y JERARQUÍA DE TÍTULOS (16 puntos)
    // =========================================================================

    // E1. Estructura oficial del Proyecto de Investigación de Grado -> 9 pt
    {
      const bodyFullNorm = doc.pages
        .slice(Math.max(0, seg.bodyStart - 1), seg.bodyEnd)
        .map((p) => p.fullText)
        .join("\n");
      const normBody = normalizeText(bodyFullNorm);

      const missingSections = [];
      if (!seg.introduccionPage) missingSections.push("INTRODUCCIÓN");

      if (modalidad === "investigacion") {
        if (!seg.capitulos[1] && !/1\.?\s+PROBLEMA\s+DE\s+INVESTIGACION/.test(normBody)) {
          missingSections.push("CAPÍTULO I: 1. PROBLEMA DE INVESTIGACIÓN");
        } else {
          if (!/1\.1\.?\s+PLANTEAMIENTO\s+DEL\s+PROBLEMA/.test(normBody)) {
            missingSections.push("Subsección 1.1 Planteamiento del Problema");
          }
          if (!/1\.2\.?\s+OBJETIVOS/.test(normBody)) {
            missingSections.push("Subsección 1.2 Objetivos (General y específicos)");
          }
          if (!/1\.3\.?\s+JUSTIFICACION/.test(normBody)) {
            missingSections.push("Subsección 1.3 Justificación");
          }
        }

        if (!seg.capitulos[2] && !/2\.?\s+MARCO\s+TEORICO/.test(normBody)) {
          missingSections.push("CAPÍTULO II: 2. MARCO TEÓRICO");
        }
        if (!seg.capitulos[3] && !/3\.?\s+MARCO\s+METODOLOGICO/.test(normBody)) {
          missingSections.push("CAPÍTULO III: 3. MARCO METODOLÓGICO");
        }
        if (
          !seg.capitulos[4] &&
          !/4\.?\s+(?:MARCO\s+DE\s+ANALISIS|ANALISIS\s+E\s+INTERPRETACION|RESULTADOS)/.test(normBody)
        ) {
          missingSections.push("CAPÍTULO IV: 4. MARCO DE ANÁLISIS E INTERPRETACIÓN DE RESULTADOS");
        }
      } else {
        if (Object.keys(seg.capitulos).length === 0) {
          missingSections.push("División capitular del cuerpo del trabajo (CAPÍTULO I, II...)");
        }
      }

      if (!seg.conclusionesPage && !/\bCONCLUSIONES\b/.test(normBody)) {
        missingSections.push("CONCLUSIONES");
      }
      if (!seg.recomendacionesPage && !/\bRECOMENDACIONES\b/.test(normBody)) {
        missingSections.push("RECOMENDACIONES");
      }
      if (!seg.bibliografiaPage) {
        missingSections.push("BIBLIOGRAFÍA");
      }

      if (missingSections.length === 0) {
        addCheck({
          code: "E1_ESTRUCTURA_PROYECTO",
          categoryId: "estructura_titulos",
          weight: 9,
          status: "pass",
          measured: "Todos los capítulos y apartados obligatorios verificados",
          hallazgo:
            "El trabajo contiene la estructura completa establecida por la Dirección de Desarrollo Académico y DBRA ESPOCH (Introducción, Capítulos obligatorios, Conclusiones, Recomendaciones y Bibliografía)."
        });
      } else {
        const ratio = Math.max(0, 1 - missingSections.length * 0.18);
        addCheck({
          code: "E1_ESTRUCTURA_PROYECTO",
          categoryId: "estructura_titulos",
          weight: 9,
          status: ratio >= 0.45 ? "warn" : "fail",
          scoreRatio: round2(ratio),
          pages: [seg.bodyStart],
          measured: `${missingSections.length} apartado(s) faltante(s) o con nombre distinto`,
          hallazgo: `No se identificaron o presentan denominación distinta a la guía oficial los siguientes apartados: ${missingSections.join("; ")}.`
        });
      }
    }

    // E2. División jerárquica de títulos (Niveles 1 al 4) -> 7 pt
    {
      const badHeadingPages = [];
      const examples = [];
      let totalHeadings = 0;
      let okHeadings = 0;

      for (let pNum = seg.bodyStart; pNum <= seg.bodyEnd; pNum++) {
        const p = doc.pages[pNum - 1];
        for (const ln of p.bodyLines) {
          if (isTocLine(ln)) continue;
          // Detectar títulos numerados tipo 1. / 1.1. / 1.1.1. / 1.1.1.1.
          const m = ln.text.match(/^(\d+(?:\.\d+){0,3})(\.?)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ].*)$/);
          if (!m) continue;
          const numPart = m[1];
          const titleText = m[3].trim();
          // Evitar confundir con listas numeradas largas de oraciones que terminan en punto o tienen > 115 caracteres
          if (titleText.length > 115 || /\.\s*$/.test(titleText)) continue;

          const level = numPart.split(".").length;
          const lettersOnly = titleText.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
          if (lettersOnly.length < 3) continue;

          totalHeadings++;
          const isAllCaps = lettersOnly === lettersOnly.toUpperCase();

          let err = null;
          if (level === 1) {
            // Nivel 1: MAYÚSCULAS + NEGRILLA, sin cursiva
            if (!isAllCaps) err = `nivel 1 ('${numPart} ${titleText.slice(0, 28)}...') debe ir en MAYÚSCULAS`;
            else if (!ln.isBold) err = `nivel 1 ('${numPart} ${titleText.slice(0, 28)}...') debe ir en negrilla`;
            else if (ln.isItalic) err = `nivel 1 ('${numPart}...') no lleva cursiva`;
          } else if (level === 2) {
            // Nivel 2: Minúscula (tipo oración) + negrilla, sin cursiva
            if (isAllCaps) err = `nivel 2 ('${numPart} ${titleText.slice(0, 28)}...') no debe ir todo en MAYÚSCULAS`;
            else if (!ln.isBold) err = `nivel 2 ('${numPart} ${titleText.slice(0, 28)}...') debe ir en negrilla`;
            else if (ln.isItalic) err = `nivel 2 ('${numPart} ${titleText.slice(0, 28)}...') no lleva cursiva`;
          } else if (level === 3) {
            // Nivel 3: Minúscula + negrilla + cursiva
            if (isAllCaps) err = `nivel 3 ('${numPart} ${titleText.slice(0, 28)}...') no debe ir en MAYÚSCULAS`;
            else if (!ln.isBold || !ln.isItalic) {
              err = `nivel 3 ('${numPart} ${titleText.slice(0, 28)}...') requiere negrilla y cursiva simultáneamente`;
            }
          } else if (level === 4) {
            // Nivel 4: Minúscula + cursiva (SIN negrilla)
            if (isAllCaps) err = `nivel 4 ('${numPart} ${titleText.slice(0, 28)}...') no debe ir en MAYÚSCULAS`;
            else if (ln.isBold || !ln.isItalic) {
              err = `nivel 4 ('${numPart} ${titleText.slice(0, 28)}...') debe ir solo en cursiva (sin negrilla)`;
            }
          }

          if (err) {
            badHeadingPages.push(pNum);
            if (examples.length < 4) examples.push(`pág. ${pNum}: ${err}`);
          } else {
            okHeadings++;
          }
        }
      }

      if (totalHeadings === 0) {
        addCheck({
          code: "E2_JERARQUIA_TITULOS",
          categoryId: "estructura_titulos",
          weight: 7,
          status: "warn",
          scoreRatio: 0.4,
          pages: [seg.bodyStart],
          measured: "No se identificaron títulos jerárquicos numerados (1., 1.1., 1.1.1.)",
          hallazgo: "No se detectó numeración jerárquica estándar (1., 1.1., 1.1.1.) en los capítulos del cuerpo del trabajo."
        });
      } else if (badHeadingPages.length === 0) {
        addCheck({
          code: "E2_JERARQUIA_TITULOS",
          categoryId: "estructura_titulos",
          weight: 7,
          status: "pass",
          measured: `${okHeadings}/${totalHeadings} títulos cumplen formato de nivel`,
          hallazgo: `Los ${totalHeadings} títulos y subtítulos jerárquicos analizados cumplen estrictamente con mayúsculas/minúsculas, negrilla y cursiva según su nivel.`
        });
      } else {
        const ratio = okHeadings / totalHeadings;
        addCheck({
          code: "E2_JERARQUIA_TITULOS",
          categoryId: "estructura_titulos",
          weight: 7,
          status: ratio >= 0.6 ? "warn" : "fail",
          scoreRatio: round2(ratio),
          pages: badHeadingPages,
          measured: `${okHeadings} de ${totalHeadings} títulos correctos`,
          hallazgo: `Incumplimientos en el formato jerárquico de títulos (${totalHeadings - okHeadings} caso[s]): ${examples.join("; ")}.`
        });
      }
    }

    // =========================================================================
    // CATEGORÍA 6: TABLAS, ILUSTRACIONES Y SOPORTE DIGITAL (12 puntos)
    // =========================================================================

    const tableEntries = [];
    const illusEntries = [];
    const sourceLines = [];

    for (let pNum = seg.bodyStart; pNum <= seg.bodyEnd; pNum++) {
      const p = doc.pages[pNum - 1];
      for (let idx = 0; idx < p.bodyLines.length; idx++) {
        const ln = p.bodyLines[idx];
        if (isTocLine(ln)) continue;

        if (/^(?:Tabla|Cuadro)\s+\d+/i.test(ln.text)) {
          tableEntries.push({ pageNumber: pNum, line: ln, lineIdx: idx, page: p });
        } else if (/^(?:Ilustraci[óo]n|Figura|Gr[áa]fico|Imagen|Mapa)\s+\d+/i.test(ln.text)) {
          illusEntries.push({ pageNumber: pNum, line: ln, lineIdx: idx, page: p });
        } else if (/^(?:Fuente|Realizado\s+por|Elaborado\s+por|Autor[íi]a)\s*:/i.test(ln.text)) {
          sourceLines.push({ pageNumber: pNum, line: ln });
        }
      }
    }

    // F1. Tablas: nomenclatura Tabla X-Y: arriba en 11 pt -> 3 pt
    {
      if (tableEntries.length === 0) {
        addCheck({
          code: "F1_TABLAS_FORMATO",
          categoryId: "tablas_ilustraciones",
          weight: 3,
          status: "na",
          measured: "Sin tablas en el cuerpo",
          hallazgo: "No se detectaron tablas en el cuerpo del documento."
        });
      } else {
        const badPages = [];
        const issues = [];
        for (const t of tableEntries) {
          const txt = t.line.text;
          const validSyntax = /^Tabla\s+\d+\s*-\s*\d+\s*:\s*\S+/i.test(txt);
          const sizeOk = Math.abs(t.line.fontSize - 11) <= 0.7;

          if (!validSyntax) {
            badPages.push(t.pageNumber);
            if (issues.length < 3) {
              issues.push(`pág. ${t.pageNumber}: '${txt.slice(0, 34)}...' no usa formato 'Tabla X-Y: Descripción'`);
            }
          } else if (!sizeOk) {
            badPages.push(t.pageNumber);
            if (issues.length < 3) {
              issues.push(`pág. ${t.pageNumber}: título de tabla en ${t.line.fontSize} pt (debe ser 11 pt)`);
            }
          }
        }

        if (badPages.length === 0) {
          addCheck({
            code: "F1_TABLAS_FORMATO",
            categoryId: "tablas_ilustraciones",
            weight: 3,
            status: "pass",
            measured: `${tableEntries.length} tabla(s) con formato 'Tabla X-Y:' en 11 pt`,
            hallazgo: `Las ${tableEntries.length} tablas identificadas cumplen con la nomenclatura 'Tabla X-Y:' y tamaño de 11 puntos.`
          });
        } else {
          const okCount = tableEntries.length - new Set(badPages).size;
          const ratio = Math.max(0, okCount / tableEntries.length);
          addCheck({
            code: "F1_TABLAS_FORMATO",
            categoryId: "tablas_ilustraciones",
            weight: 3,
            status: ratio >= 0.5 ? "warn" : "fail",
            scoreRatio: round2(ratio),
            pages: badPages,
            measured: `${badPages.length} observación(es) en ${tableEntries.length} tabla(s)`,
            hallazgo: `Novedades en encabezados de tablas: ${issues.join("; ")}.`
          });
        }
      }
    }

    // F2. Ilustraciones: término 'Ilustración X-Y:' ubicado en parte INFERIOR en 11 pt -> 3 pt
    {
      if (illusEntries.length === 0) {
        addCheck({
          code: "F2_ILUSTRACIONES_FORMATO",
          categoryId: "tablas_ilustraciones",
          weight: 3,
          status: "na",
          measured: "Sin ilustraciones en el cuerpo",
          hallazgo: "No se detectaron ilustraciones o figuras en el cuerpo del documento."
        });
      } else {
        const badPages = [];
        const issues = [];

        for (const il of illusEntries) {
          const txt = il.line.text;
          const usesWrongWord = /^(?:Figura|Gr[áa]fico|Imagen|Mapa)\b/i.test(txt);
          const validSyntax = /^Ilustraci[óo]n\s+\d+\s*-\s*\d+\s*:\s*\S+/i.test(txt);
          const sizeOk = Math.abs(il.line.fontSize - 11) <= 0.7;

          // Comprobar si hay imagen debajo del título (error: puso el título arriba de la imagen)
          const imgBelow = il.page.images.find(
            (im) => im.yMin >= il.line.y - 4 && im.yMin - il.line.y < 85 && im.heightCm > 1.8
          );
          const imgAbove = il.page.images.find(
            (im) => il.line.y >= im.yMax - 8 && il.line.y - im.yMax < 85 && im.heightCm > 1.8
          );

          if (usesWrongWord) {
            badPages.push(il.pageNumber);
            if (issues.length < 3) {
              issues.push(`pág. ${il.pageNumber}: usa '${txt.split(/\s+/)[0]}' en lugar del término obligatorio 'Ilustración X-Y:'`);
            }
          } else if (!validSyntax) {
            badPages.push(il.pageNumber);
            if (issues.length < 3) {
              issues.push(`pág. ${il.pageNumber}: '${txt.slice(0, 34)}...' debe usar guion y dos puntos ('Ilustración X-Y:')`);
            }
          } else if (!sizeOk) {
            badPages.push(il.pageNumber);
            if (issues.length < 3) {
              issues.push(`pág. ${il.pageNumber}: descripción de ilustración en ${il.line.fontSize} pt (debe ser 11 pt)`);
            }
          } else if (imgBelow && !imgAbove) {
            badPages.push(il.pageNumber);
            if (issues.length < 3) {
              issues.push(`pág. ${il.pageNumber}: el título '${txt.slice(0, 28)}...' está ubicado ARRIBA de la imagen (en ESPOCH va en la PARTE INFERIOR)`);
            }
          }
        }

        if (badPages.length === 0) {
          addCheck({
            code: "F2_ILUSTRACIONES_FORMATO",
            categoryId: "tablas_ilustraciones",
            weight: 3,
            status: "pass",
            measured: `${illusEntries.length} ilustración(es) verificadas en parte inferior (11 pt)`,
            hallazgo: `Las ${illusEntries.length} ilustraciones emplean correctamente la denominación 'Ilustración X-Y:' en 11 puntos en la parte inferior.`
          });
        } else {
          const okCount = Math.max(0, illusEntries.length - badPages.length);
          const ratio = okCount / illusEntries.length;
          addCheck({
            code: "F2_ILUSTRACIONES_FORMATO",
            categoryId: "tablas_ilustraciones",
            weight: 3,
            status: ratio >= 0.5 ? "warn" : "fail",
            scoreRatio: round2(ratio),
            pages: badPages,
            measured: `${badPages.length} observación(es) en ${illusEntries.length} ilustración(es)`,
            hallazgo: `Novedades en presentación de ilustraciones: ${issues.join("; ")}.`
          });
        }
      }
    }

    // F3. Fuente y Realizado por en 8 puntos (sin 'Elaboración propia') -> 3.5 pt
    {
      const totalVisualItems = tableEntries.length + illusEntries.length;
      if (totalVisualItems === 0 && sourceLines.length === 0) {
        addCheck({
          code: "F3_FUENTE_REALIZADO_POR",
          categoryId: "tablas_ilustraciones",
          weight: 3.5,
          status: "na",
          measured: "Sin tablas ni ilustraciones",
          hallazgo: "No existen tablas ni ilustraciones que requieran leyenda de Fuente o Realizado por."
        });
      } else {
        const badPages = [];
        const issues = [];

        if (totalVisualItems > 0 && sourceLines.length === 0) {
          const allVisPages = [...tableEntries.map((t) => t.pageNumber), ...illusEntries.map((i) => i.pageNumber)];
          addCheck({
            code: "F3_FUENTE_REALIZADO_POR",
            categoryId: "tablas_ilustraciones",
            weight: 3.5,
            status: "fail",
            pages: allVisPages,
            measured: `0 referencias de fuente para ${totalVisualItems} tabla(s)/ilustración(es)`,
            hallazgo: `Se detectaron ${totalVisualItems} tabla(s)/ilustración(es), pero ninguna cuenta con la referencia inferior obligatoria 'Fuente:' o 'Realizado por:' en 8 puntos.`
          });
        } else {
          for (const s of sourceLines) {
            const txt = s.line.text;
            if (/elaboraci[óo]n\s+propia|fuente\s+propia|el\s+autor|la\s+autora|los\s+autores|^elaborado\s+por\s*:/i.test(txt)) {
              badPages.push(s.pageNumber);
              if (issues.length < 3) {
                issues.push(`pág. ${s.pageNumber}: '${txt}' usa fórmula no admitida (debe ser 'Realizado por: Apellido, Inicial., Año.')`);
              }
            } else if (Math.abs(s.line.fontSize - 8) > 0.6) {
              badPages.push(s.pageNumber);
              if (issues.length < 3) {
                issues.push(`pág. ${s.pageNumber}: '${txt.slice(0, 32)}...' tiene tamaño ${s.line.fontSize} pt (la guía exige estrictamente 8 puntos)`);
              }
            }
          }

          if (sourceLines.length < totalVisualItems) {
            issues.push(
              `se contaron ${totalVisualItems} tablas/ilustraciones pero solo ${sourceLines.length} líneas de Fuente/Realizado por`
            );
          }

          if (badPages.length === 0 && sourceLines.length >= totalVisualItems) {
            addCheck({
              code: "F3_FUENTE_REALIZADO_POR",
              categoryId: "tablas_ilustraciones",
              weight: 3.5,
              status: "pass",
              measured: `${sourceLines.length} referencia(s) en 8 puntos con formato correcto`,
              hallazgo: "Todas las referencias 'Fuente:' y 'Realizado por:' están en tamaño de 8 puntos y respetan la estructura de autoría DBRA."
            });
          } else {
            const penalty = badPages.length / Math.max(1, sourceLines.length) + (sourceLines.length < totalVisualItems ? 0.3 : 0);
            const ratio = Math.max(0, 1 - penalty);
            addCheck({
              code: "F3_FUENTE_REALIZADO_POR",
              categoryId: "tablas_ilustraciones",
              weight: 3.5,
              status: ratio >= 0.45 ? "warn" : "fail",
              scoreRatio: round2(ratio),
              pages: badPages.length ? badPages : tableEntries.map((t) => t.pageNumber),
              measured: `${badPages.length} error(es) de formato/puntaje 8 pt`,
              hallazgo: `Incumplimientos en referencias de tablas/ilustraciones: ${issues.join("; ")}.`
            });
          }
        }
      }
    }

    // F4. Tablas editables (no insertadas como imágenes) -> 2.5 pt
    {
      if (tableEntries.length === 0) {
        addCheck({
          code: "F4_TABLAS_NO_IMAGEN",
          categoryId: "tablas_ilustraciones",
          weight: 2.5,
          status: "na",
          measured: "Sin tablas en el documento",
          hallazgo: "No hay tablas que evaluar en este apartado."
        });
      } else {
        const imageTablePages = [];
        for (const t of tableEntries) {
          // Buscar dónde termina la tabla (en la línea siguiente Fuente/Realizado por o fondo de página)
          let endY = t.page.heightPt - 60;
          let textLinesInside = 0;
          for (let j = t.lineIdx + 1; j < t.page.bodyLines.length; j++) {
            const nextLn = t.page.bodyLines[j];
            if (/^(?:Fuente|Realizado\s+por|Elaborado\s+por)\s*:/i.test(nextLn.text)) {
              endY = nextLn.y;
              break;
            }
            if (/^(?:Tabla|Ilustraci[óo]n|Figura)\s+\d+/i.test(nextLn.text)) {
              endY = nextLn.y;
              break;
            }
            textLinesInside++;
          }

          // ¿Existe una imagen grande entre el título de la tabla y la fuente sin texto editable dentro?
          const hasImageInSlot = t.page.images.some(
            (im) => im.yMin >= t.line.y - 6 && im.yMax <= endY + 12 && im.heightCm > 1.5 && im.widthCm > 4.0
          );

          if (hasImageInSlot && textLinesInside === 0) {
            imageTablePages.push(t.pageNumber);
          }
        }

        if (imageTablePages.length === 0) {
          addCheck({
            code: "F4_TABLAS_NO_IMAGEN",
            categoryId: "tablas_ilustraciones",
            weight: 2.5,
            status: "pass",
            measured: `${tableEntries.length}/${tableEntries.length} tablas con texto editable`,
            hallazgo: "Todas las tablas están incorporadas como texto editable y no como capturas de imagen (cumple pág. 51 DBRA)."
          });
        } else {
          const ratio = Math.max(0, (tableEntries.length - imageTablePages.length) / tableEntries.length);
          addCheck({
            code: "F4_TABLAS_NO_IMAGEN",
            categoryId: "tablas_ilustraciones",
            weight: 2.5,
            status: ratio >= 0.6 ? "warn" : "fail",
            scoreRatio: round2(ratio),
            pages: imageTablePages,
            measured: `${imageTablePages.length} tabla(s) insertada(s) como imagen`,
            hallazgo: `Se detectaron ${imageTablePages.length} tabla(s) pegadas como imagen sin texto seleccionable. La Guía DBRA (pág. 51) prohíbe incorporar tablas como imágenes.`
          });
        }
      }
    }

    // =========================================================================
    // CATEGORÍA 7: CITAS, BIBLIOGRAFÍA (APA - FADE) Y PÁGINAS FINALES (12 puntos)
    // =========================================================================

    // Extraer citas en el cuerpo del trabajo
    const bodyTextAll = doc.pages
      .slice(Math.max(0, seg.bodyStart - 1), seg.bodyEnd)
      .map((p) => p.fullText)
      .join("\n");

    const citedSurnames = new Set();
    let totalCitationsFound = 0;
    let citationsWithPage = 0;

    // Patrón parentético: (Apellido, 2021, p. 15) o (Apellido, 2021)
    const parenRegex = /\(([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s,&.]+?),\s*(19\d{2}|20\d{2}[a-z]?)(?:,\s*pp?\.?\s*\d+(?:[-–]\d+)?)?\)/g;
    let cm;
    while ((cm = parenRegex.exec(bodyTextAll)) !== null) {
      const rawAuthor = cm[1].trim();
      if (/^(?:Tabla|Ilustraci|Figura|Anexo|Cap[íi]tulo|ecuaci)/i.test(rawAuthor)) continue;
      totalCitationsFound++;
      if (/pp?\.?\s*\d+/.test(cm[0])) citationsWithPage++;
      const firstWord = rawAuthor.split(/[\s,&]+/)[0].replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
      if (firstWord.length >= 3) citedSurnames.add(normalizeText(firstWord));
    }

    // Patrón narrativo: Apellido (2021, p. 15) o Apellido (2021)
    const narrRegex = /\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,22})(?:\s+(?:y|&|et\s+al\.?)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?\s*\((19\d{2}|20\d{2}[a-z]?)(?:,\s*pp?\.?\s*\d+(?:[-–]\d+)?)?\)/g;
    while ((cm = narrRegex.exec(bodyTextAll)) !== null) {
      const surname = cm[1];
      if (/^(?:Tabla|Figura|Segun|Como|Para|Desde|Entre|Durante|Año|Ley|Plan|Norma)$/i.test(normalizeText(surname))) {
        continue;
      }
      totalCitationsFound++;
      if (/pp?\.?\s*\d+/.test(cm[0])) citationsWithPage++;
      citedSurnames.add(normalizeText(surname));
    }

    // G1. Citas bibliográficas en el texto (autor, año, página) -> 2.5 pt
    {
      if (totalCitationsFound === 0) {
        addCheck({
          code: "G1_CITAS_TEXTO",
          categoryId: "citas_bibliografia",
          weight: 2.5,
          status: "fail",
          pages: [seg.bodyStart],
          measured: "0 citas autor-año identificadas en el cuerpo",
          hallazgo: "No se detectaron citas bibliográficas con estructura (Autor, año, página) dentro del desarrollo de los capítulos."
        });
      } else if (citationsWithPage === 0) {
        addCheck({
          code: "G1_CITAS_TEXTO",
          categoryId: "citas_bibliografia",
          weight: 2.5,
          status: "warn",
          scoreRatio: 0.6,
          pages: [seg.capitulos[2] || seg.bodyStart],
          measured: `${totalCitationsFound} cita(s) autor-año, pero 0 especifican página (p.)`,
          hallazgo: `Se identificaron ${totalCitationsFound} citas autor-año, pero ninguna incluye el número de página. La Guía DBRA (págs. 23–24) indica especificar autor, año y página.`
        });
      } else {
        addCheck({
          code: "G1_CITAS_TEXTO",
          categoryId: "citas_bibliografia",
          weight: 2.5,
          status: "pass",
          measured: `${totalCitationsFound} cita(s) detectadas (${citationsWithPage} con número de página)`,
          hallazgo: "El cuerpo del trabajo emplea adecuadamente citas bibliográficas indicando autor, año y página."
        });
      }
    }

    // Extraer entradas de la sección BIBLIOGRAFÍA
    const bibEntries = [];
    let legendLineObj = null;
    let legendPageNum = null;
    const bibPagesList = [];

    if (seg.bibliografiaPage) {
      const bibEnd =
        seg.anexosPage && seg.anexosPage > seg.bibliografiaPage ? seg.anexosPage - 1 : doc.numPages;
      let currentRef = null;

      for (let pNum = seg.bibliografiaPage; pNum <= bibEnd; pNum++) {
        bibPagesList.push(pNum);
        const p = doc.pages[pNum - 1];

        for (const ln of p.bodyLines) {
          if (/^(?:BIBLIOGRAF[ÍI]A|REFERENCIAS(?:\s+BIBLIOGR[ÁA]FICAS)?)$/i.test(ln.norm)) continue;

          if (/^TOTAL\s*:?\s*\d+\s+REFERENCIAS\s+BIBLIOGRAFICAS/i.test(ln.norm)) {
            if (currentRef) {
              bibEntries.push(currentRef);
              currentRef = null;
            }
            legendLineObj = ln;
            legendPageNum = pNum;
            continue;
          }

          // En sangría francesa, una nueva referencia inicia más a la izquierda (~3.5 cm) que sus líneas hijas (~4.5–4.8 cm)
          const startsAtLeftMargin = ln.xStartCm <= 4.05;
          const looksLikeNewRef =
            /^(?:\[\d+\]\s*|\d+\.\s*)?[A-ZÁÉÍÓÚÑ]{1}[A-Za-zÁÉÍÓÚÑáéíóúñ\s-]+(?:,|\s+\(|\.)/.test(ln.text);

          if (!currentRef) {
            currentRef = { lines: [ln], pageNumber: pNum };
          } else if (startsAtLeftMargin && (currentRef.lines[0].xStartCm + 0.35 < currentRef.lines[currentRef.lines.length - 1]?.xStartCm || looksLikeNewRef)) {
            bibEntries.push(currentRef);
            currentRef = { lines: [ln], pageNumber: pNum };
          } else {
            currentRef.lines.push(ln);
          }
        }
      }
      if (currentRef) bibEntries.push(currentRef);
    }

    // G2. Bibliografía según Norma APA (orden alfabético + sangría francesa) -> 3.5 pt
    {
      if (!seg.bibliografiaPage || bibEntries.length === 0) {
        addCheck({
          code: "G2_BIBLIOGRAFIA_FORMATO",
          categoryId: "citas_bibliografia",
          weight: 3.5,
          status: "fail",
          measured: "Sección BIBLIOGRAFÍA ausente o vacía",
          hallazgo: "No se encontró la sección de BIBLIOGRAFÍA o no contiene referencias listadas."
        });
      } else {
        const issues = [];

        // 1) Orden alfabético (aplica a APA e ISO 690; en Vancouver es orden de aparición)
        if (normaBiblio === "APA" || normaBiblio === "ISO690") {
          let outOfOrder = 0;
          let prevKey = "";
          for (const ref of bibEntries) {
            const key = normalizeText(ref.lines[0].text.replace(/^(?:\[\d+\]|\d+\.)\s*/, "")).slice(0, 18);
            if (prevKey && key < prevKey) {
              outOfOrder++;
            }
            if (key) prevKey = key;
          }
          if (outOfOrder > 0) {
            issues.push(`${outOfOrder} referencia(s) no siguen orden alfabético estricto`);
          }
        }

        // 2) Sangría francesa (obligatoria en Norma APA - FADE, pág. 38–39 DBRA)
        if (normaBiblio === "APA") {
          const multiLineRefs = bibEntries.filter((r) => r.lines.length >= 2);
          let withHangingIndent = 0;
          for (const r of multiLineRefs) {
            // Excluir continuaciones tras salto de página si están en páginas distintas, o comparar en la misma página
            const samePageSecond = r.lines.find((l, i) => i > 0);
            if (samePageSecond && samePageSecond.xStartCm - r.lines[0].xStartCm >= 0.4) {
              withHangingIndent++;
            }
          }
          if (multiLineRefs.length > 0 && withHangingIndent < multiLineRefs.length * 0.7) {
            issues.push(
              `falta sangría francesa en las referencias (${withHangingIndent} de ${multiLineRefs.length} referencias multilínea tienen sangría francesa)`
            );
          }
        }

        if (issues.length === 0) {
          addCheck({
            code: "G2_BIBLIOGRAFIA_FORMATO",
            categoryId: "citas_bibliografia",
            weight: 3.5,
            status: "pass",
            pages: bibPagesList,
            measured: `${bibEntries.length} referencia(s) en orden alfabético y con sangría francesa`,
            hallazgo: `Las ${bibEntries.length} referencias bibliográficas cumplen con el orden alfabético y sangría francesa de la Norma ${normaBiblio} (Facultad de Administración de Empresas).`
          });
        } else {
          const ratio = Math.max(0.2, 1 - issues.length * 0.45);
          addCheck({
            code: "G2_BIBLIOGRAFIA_FORMATO",
            categoryId: "citas_bibliografia",
            weight: 3.5,
            status: ratio >= 0.5 ? "warn" : "fail",
            scoreRatio: round2(ratio),
            pages: bibPagesList,
            measured: `${bibEntries.length} referencia(s) con observaciones`,
            hallazgo: `En la sección BIBLIOGRAFÍA se detectó: ${issues.join("; ")}.`
          });
        }
      }
    }

    // G3. Leyenda final obligatoria en Bibliografía APA ('Total X referencias bibliográficas.', 8 pt, negrita, derecha) -> 3 pt
    {
      if (normaBiblio !== "APA") {
        addCheck({
          code: "G3_LEYENDA_TOTAL_BIBLIO",
          categoryId: "citas_bibliografia",
          weight: 3,
          status: "na",
          measured: `No requerida en norma ${normaBiblio}`,
          hallazgo: "La leyenda de conteo final es específica de la Norma APA en la ESPOCH."
        });
      } else if (!seg.bibliografiaPage) {
        addCheck({
          code: "G3_LEYENDA_TOTAL_BIBLIO",
          categoryId: "citas_bibliografia",
          weight: 3,
          status: "fail",
          measured: "Sin Bibliografía",
          hallazgo: "No existe sección de Bibliografía para verificar el conteo final de referencias."
        });
      } else if (!legendLineObj) {
        addCheck({
          code: "G3_LEYENDA_TOTAL_BIBLIO",
          categoryId: "citas_bibliografia",
          weight: 3,
          status: "fail",
          pages: [bibPagesList[bibPagesList.length - 1]],
          measured: "Leyenda 'Total X referencias bibliográficas.' ausente",
          hallazgo: `Al final de la Bibliografía falta la leyenda obligatoria de la DBRA (pág. 38): 'Total ${bibEntries.length} referencias bibliográficas.' en tamaño 8 puntos, negrita y alineada a la derecha.`
        });
      } else {
        const legendIssues = [];
        const numMatch = legendLineObj.text.match(/\d+/);
        const statedTotal = numMatch ? parseInt(numMatch[0], 10) : null;

        if (Math.abs(legendLineObj.fontSize - 8) > 0.6) {
          legendIssues.push(`tamaño de letra ${legendLineObj.fontSize} pt (debe ser 8 puntos)`);
        }
        if (!legendLineObj.isBold) {
          legendIssues.push("no está en negrita");
        }
        // Alineado a la derecha: xStartCm debe estar claramente desplazado hacia la derecha (> 10 cm en A4)
        if (legendLineObj.xStartCm < 9.5) {
          legendIssues.push("no está alineada a la derecha");
        }
        if (statedTotal !== null && Math.abs(statedTotal - bibEntries.length) > 2) {
          legendIssues.push(
            `declara ${statedTotal} referencias pero se contabilizaron aproximadamente ${bibEntries.length} entradas`
          );
        }

        if (legendIssues.length === 0) {
          addCheck({
            code: "G3_LEYENDA_TOTAL_BIBLIO",
            categoryId: "citas_bibliografia",
            weight: 3,
            status: "pass",
            pages: [legendPageNum],
            measured: `'${legendLineObj.text}' (8 pt, negrita, derecha)`,
            hallazgo: "La leyenda final de conteo de referencias bibliográficas cumple con redacción, puntaje de 8 puntos, negrita y alineación derecha."
          });
        } else {
          const ratio = Math.max(0.35, 1 - legendIssues.length * 0.25);
          addCheck({
            code: "G3_LEYENDA_TOTAL_BIBLIO",
            categoryId: "citas_bibliografia",
            weight: 3,
            status: "warn",
            scoreRatio: round2(ratio),
            pages: [legendPageNum],
            measured: `'${legendLineObj.text}'`,
            hallazgo: `Se encontró la leyenda final en Bibliografía (pág. ${legendPageNum}), pero presenta detalles por corregir: ${legendIssues.join("; ")}.`
          });
        }
      }
    }

    // G4. Correspondencia Citas-Bibliografía, Glosario y Anexos (A, B, C) -> 3 pt
    {
      const issues = [];
      const relPages = [];

      // 1) Cruce de autores citados vs Bibliografía
      if (citedSurnames.size > 0 && bibEntries.length > 0) {
        const bibFullNorm = normalizeText(bibEntries.map((b) => b.lines.map((l) => l.text).join(" ")).join(" \n "));
        const missingAuthors = [];
        for (const surname of citedSurnames) {
          if (surname.length >= 4 && !bibFullNorm.includes(surname)) {
            missingAuthors.push(surname);
          }
        }
        if (missingAuthors.length > 0) {
          issues.push(
            `${missingAuthors.length} autor(es) citados en el texto no figuran en la Bibliografía (${missingAuthors.slice(0, 5).join(", ")})`
          );
          if (seg.bibliografiaPage) relPages.push(seg.bibliografiaPage);
        }
      }

      // 2) Glosario (si existe, opcional: entradas en negrita y orden alfabético, pág. 27 DBRA)
      if (seg.glosarioPage) {
        const gEnd = (seg.bibliografiaPage || seg.anexosPage || doc.numPages + 1) - 1;
        const terms = [];
        let nonBoldTerms = 0;
        for (let p = seg.glosarioPage; p <= gEnd; p++) {
          for (const pr of doc.pages[p - 1].paragraphs) {
            const firstLn = pr.lines[0];
            if (!firstLn || /^GLOSARIO/i.test(firstLn.norm)) continue;
            const colonIdx = firstLn.text.indexOf(":");
            if (colonIdx > 1 && colonIdx < 45) {
              const term = normalizeText(firstLn.text.slice(0, colonIdx));
              terms.push(term);
              if (!firstLn.startsBold) nonBoldTerms++;
            }
          }
        }
        if (nonBoldTerms > 0) {
          issues.push(`en el Glosario hay ${nonBoldTerms} entrada(s) cuyo término inicial no está en negrilla (pág. 27 DBRA)`);
          relPages.push(seg.glosarioPage);
        }
        let glosOutOrder = 0;
        for (let i = 1; i < terms.length; i++) {
          if (terms[i] < terms[i - 1]) glosOutOrder++;
        }
        if (glosOutOrder > 0) {
          issues.push("los términos del Glosario no están ordenados alfabéticamente");
          relPages.push(seg.glosarioPage);
        }
      }

      // 3) Anexos: verificar letras mayúsculas ANEXO A, B, C (no Anexo 1, 2, 3)
      if (seg.anexosPage) {
        let numericAnnex = false;
        for (let p = seg.anexosPage; p <= doc.numPages; p++) {
          for (const ln of doc.pages[p - 1].bodyLines.slice(0, 5)) {
            if (/^ANEXO\s+\d+\b/i.test(ln.norm)) {
              numericAnnex = true;
              relPages.push(p);
            }
          }
        }
        if (numericAnnex) {
          issues.push("los Anexos están numerados ('Anexo 1, 2...') en vez de usar letras mayúsculas ('ANEXO A, ANEXO B, ANEXO C') según págs. 16 y 26 DBRA");
        }
      }

      if (issues.length === 0) {
        addCheck({
          code: "G4_COINCIDENCIA_FINALES",
          categoryId: "citas_bibliografia",
          weight: 3,
          status: "pass",
          pages: [seg.glosarioPage, seg.bibliografiaPage, seg.anexosPage].filter(Boolean),
          measured: "Correspondencia de citas y formato de finales verificados",
          hallazgo: "Los autores citados guardan correspondencia con la Bibliografía y las secciones finales (Glosario / Anexos) respetan la normativa ESPOCH."
        });
      } else {
        const ratio = Math.max(0.2, 1 - issues.length * 0.38);
        addCheck({
          code: "G4_COINCIDENCIA_FINALES",
          categoryId: "citas_bibliografia",
          weight: 3,
          status: ratio >= 0.5 ? "warn" : "fail",
          scoreRatio: round2(ratio),
          pages: relPages,
          measured: `${issues.length} novedad(es) en citas/finales`,
          hallazgo: `Observaciones detectadas: ${issues.join("; ")}.`
        });
      }
    }

    return buildFinalSummary(doc, meta, seg, results, options);
  }

  function buildFinalSummary(doc, meta, seg, results, options) {
    const categoriasConfig = window.ESPOCH_NORMATIVA.categorias;
    let totalApplicableWeight = 0;
    let totalEarnedWeight = 0;

    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;
    let naCount = 0;

    for (const r of results) {
      if (r.status === "na") {
        naCount++;
      } else {
        totalApplicableWeight += r.weight;
        totalEarnedWeight += r.earnedPoints;
        if (r.status === "pass") passCount++;
        else if (r.status === "warn") warnCount++;
        else failCount++;
      }
    }

    const overallPercentage =
      totalApplicableWeight > 0 ? Math.round((totalEarnedWeight / totalApplicableWeight) * 1000) / 10 : 0;

    const categorySummaries = categoriasConfig.map((cat) => {
      const catChecks = results.filter((r) => r.categoryId === cat.id);
      const applicable = catChecks.filter((r) => r.status !== "na");
      const maxW = applicable.reduce((acc, r) => acc + r.weight, 0);
      const earnedW = applicable.reduce((acc, r) => acc + r.earnedPoints, 0);
      const pct = maxW > 0 ? Math.round((earnedW / maxW) * 1000) / 10 : 100;

      return {
        ...cat,
        percentage: pct,
        totalChecks: catChecks.length,
        passChecks: catChecks.filter((r) => r.status === "pass").length,
        warnChecks: catChecks.filter((r) => r.status === "warn").length,
        failChecks: catChecks.filter((r) => r.status === "fail").length
      };
    });

    let dictamen = {
      nivel: "bajo",
      etiqueta: "Cumplimiento Insuficiente — Requiere Corrección Integral",
      mensaje:
        "El Trabajo de Titulación presenta múltiples incumplimientos de forma respecto a la Guía DBRA y estructura institucional ESPOCH. Corrija cada punto señalado antes de presentar el ejemplar a revisión."
    };

    if (overallPercentage >= 90 && failCount === 0) {
      dictamen = {
        nivel: "alto",
        etiqueta: "Cumplimiento Óptimo — Apto para Revisión Final",
        mensaje:
          "¡Excelente trabajo! El documento cumple satisfactoriamente con los parámetros formales de la normativa institucional ESPOCH."
      };
    } else if (overallPercentage >= 80) {
      dictamen = {
        nivel: "bueno",
        etiqueta: "Cumplimiento Alto — Ajustes Menores Requeridos",
        mensaje:
          "El documento presenta una buena adecuación general a la normativa ESPOCH, pero requiere subsanar observaciones puntuales antes de su aprobación formal."
      };
    } else if (overallPercentage >= 60) {
      dictamen = {
        nivel: "medio",
        etiqueta: "Cumplimiento Parcial — Requiere Correcciones de Forma",
        mensaje:
          "El documento cumple parcialmente con la normativa institucional. Revise detalladamente las secciones con incumplimientos y aplique las correcciones indicadas en Microsoft Word."
      };
    }

    return {
      analyzedAt: new Date(),
      fileName: options.fileName || "Trabajo_Titulacion.pdf",
      modalidad: options.modalidad || "investigacion",
      normaBiblio: options.normaBiblio || "APA",
      numPages: doc.numPages,
      totalWordCount: doc.totalWordCount,
      meta,
      segmentation: seg,
      overallPercentage,
      dictamen,
      counts: {
        total: results.length,
        evaluated: results.length - naCount,
        pass: passCount,
        warn: warnCount,
        fail: failCount,
        na: naCount
      },
      categories: categorySummaries,
      checks: results
    };
  }

  return {
    analyze
  };
})();
