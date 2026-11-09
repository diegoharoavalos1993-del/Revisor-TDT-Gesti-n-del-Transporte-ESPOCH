/**
 * Generador de Reporte PDF Descargable de Cumplimiento Normativo ESPOCH
 * Autor del Sistema: Ing. Diego Haro Avalos
 * Docente Trabajo de Titulación - Carrera de Gestión del Transporte (ESPOCH)
 */

window.ESPOCHReportGenerator = (function () {
  function sanitizePdfText(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/[—–]/g, "-")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/…/g, "...")
      .replace(/•/g, "-")
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
  }

  function statusColors(pct) {
    if (pct >= 85) return { rgb: [22, 101, 52], bg: [236, 253, 245] }; // Verde institucional
    if (pct >= 65) return { rgb: [180, 83, 9], bg: [255, 251, 235] }; // Ámbar
    return { rgb: [185, 28, 28], bg: [254, 242, 242] }; // Rojo institucional
  }

  function generatePDF(analysis) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageW = doc.internal.pageSize.getWidth(); // 210 mm
    const pageH = doc.internal.pageSize.getHeight(); // 297 mm
    const marginX = 15;
    const contentW = pageW - marginX * 2;

    // -------------------------------------------------------------------------
    // ENCABEZADO INSTITUCIONAL ESPOCH CON LOGOS OFICIALES
    // -------------------------------------------------------------------------
    let y = 36;
    if (window.ESPOCH_LOGOS && window.ESPOCH_LOGOS.bannerDataUrl) {
      // Colocar logos oficiales (ESPOCH + Carrera Gestión del Transporte + ISO 9001:2015 + ACBSP) al ras superior
      const imgW = 104;
      const imgH = (imgW * window.ESPOCH_LOGOS.bannerHeight) / window.ESPOCH_LOGOS.bannerWidth; // ~27.5 mm
      doc.addImage(window.ESPOCH_LOGOS.bannerDataUrl, "PNG", marginX, 0, imgW, imgH);

      doc.setTextColor(185, 28, 28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.8);
      doc.text(
        sanitizePdfText("ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO"),
        pageW - marginX,
        15.5,
        { align: "right" }
      );
      doc.setTextColor(15, 41, 66);
      doc.setFontSize(8.2);
      doc.text(
        sanitizePdfText("Facultad de Administración de Empresas"),
        pageW - marginX,
        20,
        { align: "right" }
      );
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.text(
        sanitizePdfText("Normativa DBRA ESPOCH y Guía de Titulación"),
        pageW - marginX,
        24.2,
        { align: "right" }
      );

      // Franja de título y autoría del sistema
      const bandY = 29;
      doc.setFillColor(15, 41, 66);
      doc.roundedRect(marginX, bandY, contentW, 13.5, 1.8, 1.8, "F");
      doc.setFillColor(220, 38, 38);
      doc.rect(marginX, bandY, 3, 13.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.6);
      doc.text(
        sanitizePdfText("REPORTE DE CUMPLIMIENTO DE FORMA Y NORMATIVA DE TRABAJO DE TITULACIÓN"),
        pageW / 2,
        bandY + 5.6,
        { align: "center" }
      );
      doc.setFont("helvetica", "italic");
      doc.setTextColor(253, 230, 138);
      doc.setFontSize(7.9);
      doc.text(
        sanitizePdfText(
          "Autor del Programa: Ing. Diego Haro Avalos - Docente Trabajo de Titulación, Carrera de Gestión del Transporte"
        ),
        pageW / 2,
        bandY + 10.6,
        { align: "center" }
      );

      y = bandY + 17.5;
    } else {
      doc.setFillColor(150, 24, 28);
      doc.rect(0, 0, pageW, 29, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(
        sanitizePdfText("ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO (ESPOCH)"),
        pageW / 2,
        10,
        { align: "center" }
      );
      doc.setFontSize(10);
      doc.text(
        sanitizePdfText("REPORTE DE CUMPLIMIENTO DE FORMA Y NORMATIVA DE TRABAJO DE TITULACIÓN"),
        pageW / 2,
        18,
        { align: "center" }
      );
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.2);
      doc.text(
        sanitizePdfText(
          "Autor del Programa: Ing. Diego Haro Avalos - Docente Trabajo de Titulación, Carrera de Gestión del Transporte"
        ),
        pageW / 2,
        25,
        { align: "center" }
      );
      y = 35;
    }

    // -------------------------------------------------------------------------
    // TARJETA DE DATOS DEL DOCUMENTO + PUNTAJE GLOBAL
    // -------------------------------------------------------------------------
    const leftBoxW = 114;
    const rightBoxW = contentW - leftBoxW - 4;
    const boxH = 42;

    // Caja izquierda: Ficha del documento
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, y, leftBoxW, boxH, 2, 2, "FD");

    doc.setTextColor(15, 41, 66);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(sanitizePdfText("DATOS DEL ARCHIVO ANALIZADO"), marginX + 4, y + 6);

    doc.setFontSize(8);
    const fechaStr = analysis.analyzedAt.toLocaleString("es-EC", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const metaRows = [
      ["Archivo PDF:", analysis.fileName],
      ["Autor(es) en portada:", analysis.meta.autor],
      ["Director(a):", analysis.meta.director],
      ["Extensión:", `${analysis.numPages} páginas (${analysis.totalWordCount.toLocaleString("es-EC")} palabras)`],
      ["Norma evaluada:", `Guía DBRA ESPOCH + Proyecto Inv. (Biblio: ${analysis.normaBiblio})`],
      ["Fecha de revisión:", fechaStr]
    ];

    let rowY = y + 11.5;
    for (const [lbl, val] of metaRows) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text(sanitizePdfText(lbl), marginX + 4, rowY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const maxValW = leftBoxW - 38;
      const truncated = doc.splitTextToSize(sanitizePdfText(val), maxValW)[0] || "";
      doc.text(truncated, marginX + 35, rowY);
      rowY += 5;
    }

    // Caja derecha: Porcentaje de cumplimiento
    const rightX = marginX + leftBoxW + 4;
    const sc = statusColors(analysis.overallPercentage);
    doc.setFillColor(sc.bg[0], sc.bg[1], sc.bg[2]);
    doc.setDrawColor(sc.rgb[0], sc.rgb[1], sc.rgb[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(rightX, y, rightBoxW, boxH, 2, 2, "FD");

    doc.setTextColor(sc.rgb[0], sc.rgb[1], sc.rgb[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.text(sanitizePdfText("CUMPLIMIENTO GLOBAL"), rightX + rightBoxW / 2, y + 6.5, { align: "center" });

    doc.setFontSize(22);
    doc.text(`${analysis.overallPercentage.toFixed(1)}%`, rightX + rightBoxW / 2, y + 17.5, { align: "center" });

    // Barra visual de progreso dentro de la tarjeta
    const barX = rightX + 6;
    const barW = rightBoxW - 12;
    const barY = y + 20.5;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, barY, barW, 3.2, 1.2, 1.2, "F");
    const fillW = Math.max(2, (barW * Math.min(100, analysis.overallPercentage)) / 100);
    doc.setFillColor(sc.rgb[0], sc.rgb[1], sc.rgb[2]);
    doc.roundedRect(barX, barY, fillW, 3.2, 1.2, 1.2, "F");

    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const dictLines = doc.splitTextToSize(sanitizePdfText(analysis.dictamen.etiqueta), rightBoxW - 8);
    doc.text(dictLines, rightX + rightBoxW / 2, y + 28, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.text(
      sanitizePdfText(
        `Cumple: ${analysis.counts.pass} | Parcial: ${analysis.counts.warn} | No cumple: ${analysis.counts.fail}`
      ),
      rightX + rightBoxW / 2,
      y + 38.5,
      { align: "center" }
    );

    y += boxH + 4;

    // Título detectado en portada
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    const titleWrapped = doc.splitTextToSize(
      sanitizePdfText(`Título identificado: ${analysis.meta.titulo}`),
      contentW - 8
    );
    const titleBoxH = Math.max(9, titleWrapped.length * 4.2 + 4);
    doc.roundedRect(marginX, y, contentW, titleBoxH, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(titleWrapped, marginX + 4, y + 5.2);

    y += titleBoxH + 6;

    // -------------------------------------------------------------------------
    // TABLA RESUMEN POR DIMENSIONES NORMATIVAS
    // -------------------------------------------------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 41, 66);
    doc.text(sanitizePdfText("1. RESUMEN DE CUMPLIMIENTO POR DIMENSIÓN NORMATIVA"), marginX, y);
    y += 2.5;

    const catRows = analysis.categories.map((c) => [
      sanitizePdfText(c.nombre),
      `${c.peso}%`,
      `${c.passChecks}`,
      `${c.warnChecks}`,
      `${c.failChecks}`,
      `${c.percentage.toFixed(1)}%`
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: marginX, right: marginX, bottom: 18 },
      head: [
        [
          sanitizePdfText("Dimensión Normativa ESPOCH"),
          "Peso",
          "Cumple",
          "Parcial",
          "Incumple",
          "% Logrado"
        ]
      ],
      body: catRows,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.2,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [15, 41, 66],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center"
      },
      columnStyles: {
        0: { halign: "left", cellWidth: 92 },
        1: { halign: "center", cellWidth: 16 },
        2: { halign: "center", cellWidth: 17 },
        3: { halign: "center", cellWidth: 17 },
        4: { halign: "center", cellWidth: 18 },
        5: { halign: "center", cellWidth: 20, fontStyle: "bold" }
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 5) {
          const val = parseFloat(data.cell.raw);
          if (val >= 85) data.cell.styles.textColor = [22, 101, 52];
          else if (val >= 65) data.cell.styles.textColor = [180, 83, 9];
          else data.cell.styles.textColor = [185, 28, 28];
        }
      }
    });

    y = doc.lastAutoTable.finalY + 8;

    // -------------------------------------------------------------------------
    // SECCIÓN 2: DETALLE Y EXPLICACIÓN DE PARTES QUE NO CUMPLEN LA NORMATIVA
    // -------------------------------------------------------------------------
    const nonCompliant = [
      ...analysis.checks.filter((c) => c.status === "fail"),
      ...analysis.checks.filter((c) => c.status === "warn")
    ];

    if (y > pageH - 40) {
      doc.addPage();
      y = 18;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(150, 24, 28);
    doc.text(
      sanitizePdfText(
        `2. DETALLE EXPLICATIVO DE INCUMPLIMIENTOS Y OBSERVACIONES (${nonCompliant.length})`
      ),
      marginX,
      y
    );
    y += 3;

    if (nonCompliant.length === 0) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(22, 101, 52);
      doc.roundedRect(marginX, y + 1, contentW, 16, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52);
      doc.text(
        sanitizePdfText(
          "¡Felicitaciones! No se detectaron incumplimientos ni observaciones formales en los parámetros evaluados."
        ),
        marginX + 5,
        y + 10
      );
      y += 24;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      doc.setTextColor(71, 85, 105);
      doc.text(
        sanitizePdfText(
          "A continuación se detallan las secciones de su trabajo que no cumplen total o parcialmente con la normativa ESPOCH y cómo corregirlas:"
        ),
        marginX,
        y + 3
      );
      y += 6;

      nonCompliant.forEach((item, idx) => {
        const isFail = item.status === "fail";
        const badgeText = isFail ? "INCUMPLIMIENTO" : "OBSERVACIÓN PARCIAL";
        const headerFill = isFail ? [185, 28, 28] : [180, 83, 9];
        const bodyBg = isFail ? [255, 250, 250] : [255, 253, 245];

        const detailRows = [
          [
            sanitizePdfText("¿Qué se detectó en su PDF?"),
            sanitizePdfText(
              `${item.hallazgo}${item.measured ? " [Medición: " + item.measured + "]" : ""}`
            )
          ],
          [
            sanitizePdfText("Páginas donde ocurre:"),
            sanitizePdfText(item.pagesLabel || "Documento general")
          ],
          [
            sanitizePdfText("Normativa ESPOCH exigida:"),
            sanitizePdfText(`${item.explicacionNorma} (${item.fuenteNormativa}).`)
          ],
          [
            sanitizePdfText("¿Cómo corregirlo en Word?"),
            sanitizePdfText(item.comoCorregir)
          ]
        ];

        doc.autoTable({
          startY: y,
          margin: { left: marginX, right: marginX, bottom: 18 },
          pageBreak: "avoid",
          head: [
            [
              {
                content: sanitizePdfText(`${idx + 1}. [${badgeText}] ${item.titulo}`),
                colSpan: 2
              }
            ]
          ],
          body: detailRows,
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 2.3,
            fillColor: bodyBg,
            textColor: [30, 41, 59],
            lineColor: [203, 213, 225],
            lineWidth: 0.2
          },
          headStyles: {
            fillColor: headerFill,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8.4,
            halign: "left"
          },
          columnStyles: {
            0: { cellWidth: 44, fontStyle: "bold", textColor: [15, 41, 66] },
            1: { cellWidth: contentW - 44 }
          }
        });

        y = doc.lastAutoTable.finalY + 4.5;
      });
    }

    // -------------------------------------------------------------------------
    // SECCIÓN 3: MATRIZ COMPLETA DE VERIFICACIÓN (TODOS LOS PARÁMETROS)
    // -------------------------------------------------------------------------
    if (y > pageH - 45) {
      doc.addPage();
      y = 18;
    } else {
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 41, 66);
    doc.text(
      sanitizePdfText("3. MATRIZ INTEGRAL DE PARÁMETROS VERIFICADOS (28 CRITERIOS ESPOCH)"),
      marginX,
      y
    );
    y += 2.5;

    const statusLabelMap = {
      pass: "CUMPLE",
      warn: "PARCIAL",
      fail: "NO CUMPLE",
      na: "OPCIONAL (N/A)"
    };

    const allMatrixRows = analysis.checks.map((c, idx) => [
      `${idx + 1}`,
      sanitizePdfText(c.titulo),
      sanitizePdfText(statusLabelMap[c.status] || c.status),
      sanitizePdfText(c.measured || "-"),
      sanitizePdfText(c.pagesLabel || "-")
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: marginX, right: marginX, bottom: 18 },
      rowPageBreak: "avoid",
      head: [["#", "Parámetro Normativo Evaluado", "Estado", "Resultado Medido", "Páginas"]],
      body: allMatrixRows,
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: 7.4,
        cellPadding: 1.9,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [15, 41, 66],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 74 },
        2: { cellWidth: 24, halign: "center", fontStyle: "bold" },
        3: { cellWidth: 48 },
        4: { cellWidth: 26, halign: "center" }
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 2) {
          const txt = data.cell.raw;
          if (txt === "CUMPLE") data.cell.styles.textColor = [22, 101, 52];
          else if (txt === "PARCIAL") data.cell.styles.textColor = [180, 83, 9];
          else if (txt === "NO CUMPLE") data.cell.styles.textColor = [185, 28, 28];
          else data.cell.styles.textColor = [100, 116, 139];
        }
      }
    });

    // -------------------------------------------------------------------------
    // PIE DE PÁGINA EN TODAS LAS PÁGINAS CON CRÉDITOS DEL AUTOR
    // -------------------------------------------------------------------------
    const totalReportPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalReportPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.3);
      doc.setTextColor(71, 85, 105);
      doc.text(
        sanitizePdfText(
          "Autor del Programa: Ing. Diego Haro Avalos - Docente Trabajo de Titulación, Carrera de Gestión del Transporte (ESPOCH)"
        ),
        marginX,
        pageH - 7.8
      );
      doc.text(
        sanitizePdfText(`Página ${i} de ${totalReportPages}`),
        pageW - marginX,
        pageH - 7.8,
        { align: "right" }
      );
    }

    const cleanBase = analysis.fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "_");
    const outName = `Reporte_ESPOCH_TDT_${cleanBase || "Estudiante"}.pdf`;
    doc.save(outName);
    return outName;
  }

  return {
    generatePDF
  };
})();
