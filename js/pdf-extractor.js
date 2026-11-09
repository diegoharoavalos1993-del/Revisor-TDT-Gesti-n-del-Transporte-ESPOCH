/**
 * Motor de Extracción Geométrica y Estructural de PDF para Revisión Normativa ESPOCH
 * Autor del Sistema: Ing. Diego Haro Avalos
 * Docente Trabajo de Titulación - Carrera de Gestión del Transporte (ESPOCH)
 */

window.PDFExtractor = (function () {
  const PT_PER_CM = 72 / 2.54; // 28.3464567 pt por cm

  function ptToCm(pt) {
    return pt / PT_PER_CM;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function normalizeText(str) {
    return (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function resolveFontMeta(page, styles, fontId) {
    let fontObj = null;
    try {
      if (page.commonObjs && page.commonObjs.has(fontId)) {
        fontObj = page.commonObjs.get(fontId);
      } else if (page.objs && page.objs.has(fontId)) {
        fontObj = page.objs.get(fontId);
      }
    } catch (_) {
      fontObj = null;
    }

    const styleEntry = (styles && styles[fontId]) || {};
    const rawName = String(fontObj?.name || fontObj?.fallbackName || styleEntry.fontFamily || fontId || "");
    const cleanName = rawName.replace(/^[A-Z]{6}\+/, "").trim();

    let family = "Desconocida";
    let isSymbolOrMath = false;

    if (/symbol|wingdings|zapfdingbats|marlett|webdings|cambria\s*math|mathematical/i.test(cleanName)) {
      family = "Symbol/Math";
      isSymbolOrMath = true;
    } else if (/times|tinos|liberation\s*serif|nimbusrom/i.test(cleanName)) {
      family = "Times New Roman";
    } else if (/calibri/i.test(cleanName)) {
      family = "Calibri";
    } else if (/arial|helvetica|liberation\s*sans|nimbussan/i.test(cleanName)) {
      family = "Arial / Helvetica";
    } else if (/aptos/i.test(cleanName)) {
      family = "Aptos";
    } else if (/cambria/i.test(cleanName)) {
      family = "Cambria";
    } else if (/georgia/i.test(cleanName)) {
      family = "Georgia";
    } else if (/garamond/i.test(cleanName)) {
      family = "Garamond";
    } else if (/verdana|tahoma|segoe|trebuchet|roboto|open\s*sans|lato|montserrat/i.test(cleanName)) {
      family = cleanName.split(/[-,+]/)[0] || "Sans-Serif";
    } else if (/courier|consolas|menlo|monaco|lucida\s*console/i.test(cleanName)) {
      family = "Courier / Monoespaciada";
    } else if (/^serif$/i.test(styleEntry.fontFamily || "")) {
      // Cuando el PDF solo expone familia genérica serif sin nombre incrustado
      family = "Times New Roman";
    } else if (cleanName && !/^g_d\d+_f\d+$/i.test(cleanName)) {
      family = cleanName.split(/[-,+]/)[0];
    }

    const weightNum = Number(fontObj?.cssFontInfo?.fontWeight || 0);
    const italicAngle = Number(fontObj?.cssFontInfo?.italicAngle || 0);

    const isBold = Boolean(
      (fontObj?.bold && !/regular|roman|psmt$/i.test(cleanName)) ||
      fontObj?.black ||
      weightNum >= 600 ||
      /bold|black|heavy|demi|-bd|ps-bold|,bold/i.test(cleanName)
    );

    const isItalic = Boolean(
      fontObj?.italic ||
      Math.abs(italicAngle) > 2 ||
      /italic|oblique|-it|ps-italic|bolditalic|,italic/i.test(cleanName)
    );

    return {
      rawName: cleanName || rawName,
      family,
      isBold,
      isItalic,
      isSymbolOrMath
    };
  }

  function extractPageImages(opList, viewport) {
    const OPS = pdfjsLib.OPS;
    const images = [];
    if (!opList || !opList.fnArray) return images;

    let ctm = viewport.transform.slice();
    const stack = [];

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (fn === OPS.save) {
        stack.push(ctm.slice());
      } else if (fn === OPS.restore) {
        if (stack.length > 0) ctm = stack.pop();
      } else if (fn === OPS.transform && Array.isArray(args) && args.length === 6) {
        ctm = pdfjsLib.Util.transform(ctm, args);
      } else if (
        fn === OPS.paintImageXObject ||
        fn === OPS.paintInlineImageXObject ||
        fn === OPS.paintImageMaskXObject
      ) {
        const x0 = ctm[4], y0 = ctm[5];
        const x1 = ctm[0] + ctm[4], y1 = ctm[1] + ctm[5];
        const x2 = ctm[2] + ctm[4], y2 = ctm[3] + ctm[5];
        const x3 = ctm[0] + ctm[2] + ctm[4], y3 = ctm[1] + ctm[3] + ctm[5];

        const xMin = Math.min(x0, x1, x2, x3);
        const xMax = Math.max(x0, x1, x2, x3);
        const yMin = Math.min(y0, y1, y2, y3);
        const yMax = Math.max(y0, y1, y2, y3);

        const widthPt = xMax - xMin;
        const heightPt = yMax - yMin;

        // Ignorar artefactos diminutos (< 0.7 cm) o fondos de página completa
        if (
          widthPt > 20 &&
          heightPt > 20 &&
          !(widthPt > viewport.width * 0.95 && heightPt > viewport.height * 0.95)
        ) {
          images.push({
            xMin,
            xMax,
            yMin,
            yMax,
            widthPt,
            heightPt,
            widthCm: round2(ptToCm(widthPt)),
            heightCm: round2(ptToCm(heightPt)),
            centerXCm: round2(ptToCm((xMin + xMax) / 2))
          });
        }
      }
    }
    return images;
  }

  function buildLines(items, styles, page, viewport) {
    const fontCache = new Map();
    const runs = [];

    for (const item of items) {
      if (!item || typeof item.str !== "string") continue;
      if (item.str.length === 0) continue;

      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const x = tx[4];
      const y = tx[5];
      let fontSize = Math.hypot(tx[2], tx[3]);
      if (!fontSize || fontSize < 0.5) {
        fontSize = Math.hypot(tx[0], tx[1]);
      }
      fontSize = Math.round(fontSize * 10) / 10;

      if (x < -15 || x > viewport.width + 15 || y < -15 || y > viewport.height + 15) {
        continue;
      }

      let fMeta = fontCache.get(item.fontName);
      if (!fMeta) {
        fMeta = resolveFontMeta(page, styles, item.fontName);
        fontCache.set(item.fontName, fMeta);
      }

      const width = Math.max(0, Number(item.width) || 0);
      runs.push({
        str: item.str,
        x,
        xEnd: x + width,
        y,
        width,
        fontSize,
        fontFamily: fMeta.family,
        rawFont: fMeta.rawName,
        isBold: fMeta.isBold,
        isItalic: fMeta.isItalic,
        isSymbolOrMath: fMeta.isSymbolOrMath
      });
    }

    // Ordenar de arriba a abajo y luego de izquierda a derecha
    runs.sort((a, b) => {
      if (Math.abs(a.y - b.y) <= 2.6) return a.x - b.x;
      return a.y - b.y;
    });

    const rawLines = [];
    for (const run of runs) {
      let target = null;
      for (let i = rawLines.length - 1; i >= Math.max(0, rawLines.length - 4); i--) {
        const candidate = rawLines[i];
        const tol = Math.max(2.8, candidate.maxFontSize * 0.28);
        if (Math.abs(run.y - candidate.yAvg) <= tol) {
          target = candidate;
          break;
        }
      }

      if (!target) {
        target = {
          runs: [run],
          ySum: run.y,
          yAvg: run.y,
          maxFontSize: run.fontSize
        };
        rawLines.push(target);
      } else {
        target.runs.push(run);
        target.ySum += run.y;
        target.yAvg = target.ySum / target.runs.length;
        if (run.fontSize > target.maxFontSize) target.maxFontSize = run.fontSize;
      }
    }

    rawLines.sort((a, b) => a.yAvg - b.yAvg);

    const lines = [];
    for (const rl of rawLines) {
      rl.runs.sort((a, b) => a.x - b.x);
      let fullText = "";
      let prevEnd = null;
      let prevSize = 11;
      let minX = Infinity;
      let maxX = -Infinity;

      const familyCounts = new Map();
      const sizeCounts = new Map();
      let alphaChars = 0;
      let boldChars = 0;
      let italicChars = 0;
      let firstMeaningfulRun = null;

      for (const r of rl.runs) {
        if (r.str.trim().length > 0) {
          if (r.x < minX) minX = r.x;
          if (r.xEnd > maxX) maxX = r.xEnd;
          if (!firstMeaningfulRun && /[A-Za-zÁÉÍÓÚÑáéíóúñ0-9©]/.test(r.str)) {
            firstMeaningfulRun = r;
          }
        }

        if (prevEnd !== null) {
          const gap = r.x - prevEnd;
          if (gap > Math.max(1.5, prevSize * 0.17) && !fullText.endsWith(" ") && !r.str.startsWith(" ")) {
            fullText += " ";
          }
        }
        fullText += r.str;
        if (r.str.trim().length > 0 || r.width > 0) {
          prevEnd = Math.max(prevEnd ?? 0, r.xEnd);
          prevSize = r.fontSize || prevSize;
        }

        const nonSpaceLen = r.str.replace(/\s+/g, "").length;
        if (nonSpaceLen > 0) {
          if (!r.isSymbolOrMath) {
            familyCounts.set(r.fontFamily, (familyCounts.get(r.fontFamily) || 0) + nonSpaceLen);
          }
          const roundedSize = Math.round(r.fontSize * 2) / 2;
          sizeCounts.set(roundedSize, (sizeCounts.get(roundedSize) || 0) + nonSpaceLen);

          const lettersLen = (r.str.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/g) || []).length;
          alphaChars += lettersLen;
          if (r.isBold) boldChars += lettersLen;
          if (r.isItalic) italicChars += lettersLen;
        }
      }

      const trimmed = fullText.replace(/\s+/g, " ").trim();
      if (!trimmed) continue;
      if (!isFinite(minX)) minX = rl.runs[0].x;
      if (!isFinite(maxX) || maxX < minX) maxX = minX + 10;

      let dominantFamily = "Times New Roman";
      let bestFamCount = -1;
      for (const [fam, cnt] of familyCounts.entries()) {
        if (cnt > bestFamCount) {
          bestFamCount = cnt;
          dominantFamily = fam;
        }
      }
      if (bestFamCount === -1) dominantFamily = "Symbol/Math";

      let dominantSize = rl.maxFontSize || 11;
      let bestSizeCount = -1;
      for (const [sz, cnt] of sizeCounts.entries()) {
        if (cnt > bestSizeCount) {
          bestSizeCount = cnt;
          dominantSize = sz;
        }
      }

      const y = rl.yAvg;
      const yTopPt = Math.max(0, y - dominantSize * 0.85);
      const yBottomPt = Math.min(viewport.height, y + dominantSize * 0.2);
      const yFromBottomPt = viewport.height - y;

      lines.push({
        text: trimmed,
        norm: normalizeText(trimmed),
        xStart: minX,
        xEnd: maxX,
        y,
        yTopPt,
        yBottomPt,
        yFromBottomPt,
        xStartCm: round2(ptToCm(minX)),
        xEndCm: round2(ptToCm(maxX)),
        rightMarginCm: round2(ptToCm(viewport.width - maxX)),
        topMarginCm: round2(ptToCm(yTopPt)),
        bottomDistCm: round2(ptToCm(yFromBottomPt)),
        centerXCm: round2(ptToCm((minX + maxX) / 2)),
        fontFamily: dominantFamily,
        fontSize: dominantSize,
        isBold: alphaChars > 0 ? boldChars / alphaChars >= 0.6 : Boolean(firstMeaningfulRun?.isBold),
        isItalic: alphaChars > 0 ? italicChars / alphaChars >= 0.6 : Boolean(firstMeaningfulRun?.isItalic),
        startsBold: Boolean(firstMeaningfulRun?.isBold),
        runs: rl.runs
      });
    }

    return lines;
  }

  const ROMAN_VALUES = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
    xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20,
    xxi: 21, xxii: 22, xxiii: 23, xxiv: 24, xxv: 25, xxvi: 26, xxvii: 27, xxviii: 28, xxix: 29, xxx: 30
  };

  function classifyPageNumberToken(str) {
    const clean = str.trim();
    if (/^\d{1,3}$/.test(clean)) {
      return { type: "arabic", value: parseInt(clean, 10), raw: clean };
    }
    const lower = clean.toLowerCase();
    if (ROMAN_VALUES[lower] !== undefined) {
      const isLower = clean === lower;
      return {
        type: isLower ? "roman_lower" : "roman_upper",
        value: ROMAN_VALUES[lower],
        raw: clean
      };
    }
    if (/^(?:-\s*\d+\s*-|p[áa]g(?:ina)?\.?\s*\d+(?:\s*de\s*\d+)?|\d+\s*\/\s*\d+)$/i.test(clean)) {
      const m = clean.match(/\d+/);
      return { type: "decorated", value: m ? parseInt(m[0], 10) : null, raw: clean };
    }
    return null;
  }

  function detectPageNumber(lines, viewport) {
    const pageWidthCm = ptToCm(viewport.width);
    // Candidatos en zona inferior (<= 3.8 cm desde abajo)
    for (let i = lines.length - 1; i >= 0; i--) {
      const ln = lines[i];
      if (ln.bottomDistCm <= 3.8 && ln.text.length <= 18) {
        const parsed = classifyPageNumberToken(ln.text);
        if (parsed) {
          // El centro del área de texto con márgenes 3.5 izq y 2.5 der en A4 (21 cm) es 11.0 cm (centro físico hoja = 10.5 cm)
          const idealCenter = pageWidthCm / 2 + 0.5;
          const isCentered = Math.abs(ln.centerXCm - idealCenter) <= 2.0 || Math.abs(ln.centerXCm - pageWidthCm / 2) <= 2.0;
          return {
            ...parsed,
            zone: "bottom",
            bottomDistCm: ln.bottomDistCm,
            centerXCm: ln.centerXCm,
            isCentered,
            fontFamily: ln.fontFamily,
            fontSize: ln.fontSize,
            lineIndex: i
          };
        }
      }
    }

    // Revisar si erróneamente pusieron numeración en el encabezado superior (típico de APA 7)
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const ln = lines[i];
      if (ln.topMarginCm <= 2.2 && ln.text.length <= 15) {
        const parsed = classifyPageNumberToken(ln.text);
        if (parsed) {
          return {
            ...parsed,
            zone: "top",
            bottomDistCm: ln.bottomDistCm,
            centerXCm: ln.centerXCm,
            isCentered: Math.abs(ln.centerXCm - pageWidthCm / 2) <= 2.0,
            fontFamily: ln.fontFamily,
            fontSize: ln.fontSize,
            lineIndex: i
          };
        }
      }
    }

    return null;
  }

  function buildParagraphs(bodyLines) {
    const paragraphs = [];
    if (!bodyLines.length) return paragraphs;

    // Estimar el Δy normal entre líneas consecutivas de la página
    const deltas = [];
    for (let i = 1; i < bodyLines.length; i++) {
      const dy = bodyLines[i].y - bodyLines[i - 1].y;
      if (dy > 9 && dy < 30) deltas.push(dy);
    }
    deltas.sort((a, b) => a - b);
    const baseLineGap = deltas.length > 0 ? deltas[Math.floor(deltas.length * 0.4)] : 19.8;

    let current = { lines: [bodyLines[0]], intraLineGaps: [] };

    for (let i = 1; i < bodyLines.length; i++) {
      const prev = bodyLines[i - 1];
      const curr = bodyLines[i];
      const dy = curr.y - prev.y;

      const isHeadingLike =
        /^(?:CAP[ÍI]TULO\s+[IVXLC]+|\d+(?:\.\d+)*\.?\s+\S+|INTRODUCCI[ÓO]N|CONCLUSIONES|RECOMENDACIONES|RESUMEN|SUMMARY|ABSTRACT|BIBLIOGRAF[ÍI]A|GLOSARIO|ANEXOS?)/i.test(curr.text) ||
        /^(?:Tabla|Ilustraci[óo]n|Figura|Gr[áa]fico)\s+\d+/i.test(curr.text) ||
        /^(?:Fuente|Realizado\s+por|Elaborado\s+por)\s*:/i.test(curr.text);

      const prevWasHeadingLike =
        /^(?:CAP[ÍI]TULO\s+[IVXLC]+|\d+(?:\.\d+)*\.?\s+\S+|INTRODUCCI[ÓO]N|CONCLUSIONES|RECOMENDACIONES|RESUMEN|SUMMARY|ABSTRACT|BIBLIOGRAF[ÍI]A|GLOSARIO|ANEXOS?)/i.test(prev.text) &&
        prev.text.length < 110;

      const prevShortLine = prev.rightMarginCm > 4.8;
      const largeVerticalGap = dy > baseLineGap * 1.32;

      if (isHeadingLike || prevWasHeadingLike || largeVerticalGap || (prevShortLine && dy > baseLineGap * 1.08)) {
        paragraphs.push({
          lines: current.lines,
          text: current.lines.map((l) => l.text).join(" "),
          intraLineGaps: current.intraLineGaps,
          gapAfterPt: dy
        });
        current = { lines: [curr], intraLineGaps: [] };
      } else {
        current.lines.push(curr);
        current.intraLineGaps.push(dy);
      }
    }

    paragraphs.push({
      lines: current.lines,
      text: current.lines.map((l) => l.text).join(" "),
      intraLineGaps: current.intraLineGaps,
      gapAfterPt: null
    });

    return paragraphs;
  }

  async function extractDocument(arrayBuffer, onProgress) {
    const isFileProtocol = window.location.protocol === "file:";
    if (!isFileProtocol && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "libs/pdf.worker.min.js";
    }

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      disableWorker: isFileProtocol
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pages = [];
    let totalWordCount = 0;

    for (let pNum = 1; pNum <= numPages; pNum++) {
      if (typeof onProgress === "function") {
        onProgress(pNum, numPages, `Analizando geometría y estructura de la página ${pNum} de ${numPages}...`);
      }

      const page = await pdf.getPage(pNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const opList = await page.getOperatorList();
      const textContent = await page.getTextContent();

      const widthCm = round2(ptToCm(viewport.width));
      const heightCm = round2(ptToCm(viewport.height));
      const orientation = viewport.width > viewport.height ? "landscape" : "portrait";

      const lines = buildLines(textContent.items, textContent.styles, page, viewport);
      const images = extractPageImages(opList, viewport);
      const pageNumber = detectPageNumber(lines, viewport);

      const bodyLines = lines.filter((_, idx) => idx !== pageNumber?.lineIndex);
      const paragraphs = buildParagraphs(bodyLines);

      const pageText = bodyLines.map((l) => l.text).join("\n");
      const words = pageText.trim() ? pageText.trim().split(/\s+/).length : 0;
      totalWordCount += words;

      pages.push({
        pageNumber: pNum,
        widthPt: viewport.width,
        heightPt: viewport.height,
        widthCm,
        heightCm,
        orientation,
        lines,
        bodyLines,
        paragraphs,
        images,
        pageNumInfo: pageNumber,
        fullText: pageText,
        wordCount: words
      });

      // Ceder brevemente al hilo de interfaz cada 6 páginas para barra de progreso fluida
      if (pNum % 6 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    return {
      numPages,
      totalWordCount,
      pages
    };
  }

  return {
    PT_PER_CM,
    ptToCm,
    round2,
    normalizeText,
    extractDocument
  };
})();
