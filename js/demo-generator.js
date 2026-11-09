/**
 * Generador de Documentos PDF de Demostración para Pruebas en Vivo en Aula
 * Autor del Sistema: Ing. Diego Haro Avalos
 * Docente Trabajo de Titulación - Carrera de Gestión del Transporte (ESPOCH)
 */

window.ESPOCHDemoGenerator = (function () {
  function makeCanvasImageDataUrl(type) {
    const canvas = document.createElement("canvas");
    if (type === "logo") {
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 160, 160);
      ctx.strokeStyle = "#1B5E20";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(80, 80, 70, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#9E1B1E";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(80, 80, 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#0F2942";
      ctx.font = "bold 20px serif";
      ctx.textAlign = "center";
      ctx.fillText("ESPOCH", 80, 86);
    } else {
      canvas.width = 360;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, 360, 180);
      ctx.strokeStyle = "#CBD5E1";
      ctx.strokeRect(2, 2, 356, 176);
      const bars = [65, 110, 90, 135];
      const colors = ["#9E1B1E", "#1B5E20", "#0F2942", "#D97706"];
      bars.forEach((h, i) => {
        ctx.fillStyle = colors[i];
        ctx.fillRect(50 + i * 72, 155 - h, 42, h);
      });
    }
    return canvas.toDataURL("image/png");
  }

  function toRomanLower(num) {
    const map = [
      [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]
    ];
    let res = "";
    let n = num;
    for (const [v, s] of map) {
      while (n >= v) {
        res += s;
        n -= v;
      }
    }
    return res;
  }

  function createCompliantDemoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const logoUrl = makeCanvasImageDataUrl("logo");
    const chartUrl = makeCanvasImageDataUrl("chart");

    const leftM = 35; // 3.5 cm
    const rightM = 25; // 2.5 cm
    const textW = 210 - leftM - rightM; // 150 mm
    const centerTextX = leftM + textW / 2; // 110 mm
    const lh = 6.7; // Interlineado 1.5 para 11 pt

    const putFooter = (str) => {
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(str, centerTextX, 297 - 20, { align: "center" }); // A 2.0 cm del borde inferior
    };

    const writeJustifiedParagraph = (text, startY) => {
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(text, textW);
      let y = startY;
      lines.forEach((ln) => {
        doc.text(ln, leftM, y);
        y += lh;
      });
      return y + lh * 0.65;
    };

    // PÁGINA 1: PORTADA (Sin numeración)
    doc.addImage(logoUrl, "PNG", centerTextX - 20, 26, 40, 40); // 4x4 cm
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO", centerTextX, 80, { align: "center" });
    doc.setFontSize(14);
    doc.text("FACULTAD DE ADMINISTRACIÓN DE EMPRESAS", centerTextX, 91, { align: "center" });
    doc.setFontSize(12);
    doc.text("CARRERA GESTIÓN DEL TRANSPORTE", centerTextX, 101, { align: "center" });

    doc.setFontSize(14);
    doc.text("OPTIMIZACIÓN OPERATIVA DE LAS RUTAS DE TRANSPORTE", centerTextX, 122, { align: "center" });
    doc.text("PÚBLICO URBANO EN EL CANTÓN RIOBAMBA, AÑO 2026", centerTextX, 130, { align: "center" });

    doc.setFontSize(12);
    doc.text("Trabajo de Integración Curricular", centerTextX, 152, { align: "center" });
    doc.setFont("times", "normal");
    doc.text("Tipo: Proyecto de Investigación", centerTextX, 161, { align: "center" });

    doc.text("Presentado para optar al grado académico de:", centerTextX, 182, { align: "center" });
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("LICENCIADO EN GESTIÓN DEL TRANSPORTE", centerTextX, 192, { align: "center" });

    doc.text("AUTOR: CARLOS ANDRÉS VALLEJO MORALES", centerTextX, 218, { align: "center" });
    doc.setFontSize(12);
    doc.text("DIRECTOR: ING. DIEGO HARO AVALOS", centerTextX, 229, { align: "center" });

    doc.setFont("times", "normal");
    doc.text("Riobamba - Ecuador", centerTextX, 256, { align: "center" });
    doc.text("2026", centerTextX, 265, { align: "center" });

    // PÁGINA 2 (ii): DERECHO DE AUTOR
    doc.addPage();
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("© 2026, Carlos Andrés Vallejo Morales", leftM, 38);
    writeJustifiedParagraph(
      "Se autoriza la reproducción total o parcial, con fines académicos, por cualquier medio o procedimiento, incluyendo la cita bibliográfica del documento, siempre y cuando se reconozca el Derecho de Autor.",
      50
    );
    putFooter(toRomanLower(2));

    // PÁGINA 3 (iii): DECLARACIÓN DE AUTENTICIDAD
    doc.addPage();
    let y3 = writeJustifiedParagraph(
      "Yo, Carlos Andrés Vallejo Morales, declaro que el presente Trabajo de Integración Curricular es de mi autoría y los resultados del mismo son auténticos. Los textos en el documento que provienen de otras fuentes están debidamente citados y referenciados.",
      38
    );
    y3 = writeJustifiedParagraph(
      "Como autor asumo la responsabilidad legal y académica de los contenidos de este Trabajo de Integración Curricular; el patrimonio intelectual pertenece a la Escuela Superior Politécnica de Chimborazo.",
      y3 + 4
    );
    doc.text("Riobamba, 15 de octubre de 2026", leftM, y3 + 12);
    doc.setFont("times", "bold");
    doc.text("Carlos Andrés Vallejo Morales", leftM, y3 + 35);
    doc.text("Cédula de Identidad: 060451289-7", leftM, y3 + 42);
    putFooter(toRomanLower(3));

    // PÁGINA 4 (iv): CERTIFICACIÓN DE DIRECCIÓN
    doc.addPage();
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("FACULTAD DE ADMINISTRACIÓN DE EMPRESAS", centerTextX, 34, { align: "center" });
    doc.text("CARRERA GESTIÓN DEL TRANSPORTE", centerTextX, 42, { align: "center" });
    writeJustifiedParagraph(
      "El Tribunal del Trabajo de Integración Curricular certifica que: El Trabajo de Integración Curricular; Tipo: Proyecto de Investigación, OPTIMIZACIÓN OPERATIVA DE LAS RUTAS DE TRANSPORTE PÚBLICO URBANO EN EL CANTÓN RIOBAMBA, AÑO 2026, realizado por el señor: CARLOS ANDRÉS VALLEJO MORALES, ha sido minuciosamente revisado por los Miembros del Tribunal del Trabajo de Integración Curricular, el mismo que cumple con los requisitos científicos, técnicos y legales, en tal virtud el Tribunal autoriza su presentación.",
      56
    );
    doc.setFont("times", "bold");
    doc.text("PRESIDENTE DEL TRIBUNAL", leftM, 138);
    doc.text("DIRECTOR DEL TRABAJO DE INTEGRACIÓN CURRICULAR: Ing. Diego Haro Avalos", leftM, 165);
    putFooter(toRomanLower(4));

    // PÁGINA 5 (v): ÍNDICE DE CONTENIDO
    doc.addPage();
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("ÍNDICE DE CONTENIDO", leftM, 34);
    const tocItems = [
      "ÍNDICE DE TABLAS......................................................................................................vi",
      "ÍNDICE DE ILUSTRACIONES....................................................................................vii",
      "ÍNDICE DE ANEXOS...................................................................................................viii",
      "RESUMEN......................................................................................................................ix",
      "ABSTRACT.....................................................................................................................x",
      "INTRODUCCIÓN...........................................................................................................1",
      "CAPÍTULO I",
      "1. PROBLEMA DE INVESTIGACIÓN.........................................................................2",
      "1.1. Planteamiento del problema....................................................................................2",
      "CAPÍTULO II",
      "2. MARCO TEÓRICO....................................................................................................3",
      "CAPÍTULO III",
      "3. MARCO METODOLÓGICO....................................................................................4",
      "CAPÍTULO IV",
      "4. MARCO DE ANÁLISIS E INTERPRETACIÓN DE RESULTADOS...................5",
      "CONCLUSIONES...........................................................................................................6",
      "RECOMENDACIONES................................................................................................6",
      "BIBLIOGRAFÍA",
      "ANEXOS"
    ];
    doc.setFont("times", "normal");
    let yToc = 48;
    tocItems.forEach((line) => {
      doc.text(line, leftM, yToc);
      yToc += lh;
    });
    putFooter(toRomanLower(5));

    // PÁGINA 6 (vi): ÍNDICE DE TABLAS
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("ÍNDICE DE TABLAS", leftM, 34);
    doc.setFont("times", "normal");
    doc.text("Tabla 4-1: Indicadores operacionales de frecuencias e intervalos.................................5", leftM, 48);
    putFooter(toRomanLower(6));

    // PÁGINA 7 (vii): ÍNDICE DE ILUSTRACIONES
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("ÍNDICE DE ILUSTRACIONES", leftM, 34);
    doc.setFont("times", "normal");
    doc.text("Ilustración 4-1: Demanda horaria de pasajeros por corredor vial.................................5", leftM, 48);
    putFooter(toRomanLower(7));

    // PÁGINA 8 (viii): ÍNDICE DE ANEXOS (sin números de página)
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("ÍNDICE DE ANEXOS", leftM, 34);
    doc.setFont("times", "normal");
    doc.text("ANEXO A: FICHA TÉCNICA DE AFORO VEHICULAR Y PASAJEROS", leftM, 48);
    putFooter(toRomanLower(8));

    // PÁGINA 9 (ix): RESUMEN (232 palabras, un solo párrafo, POMRC + 5 palabras clave entre < >)
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("RESUMEN", leftM, 34);
    const resumenTexto =
      "El sistema de transporte público urbano del cantón Riobamba presentó superposición de recorridos, tiempos de espera elevados e irregularidad en el cumplimiento de frecuencias en los corredores principales hacia el centro histórico y zonas periféricas durante los periodos de máxima demanda. Por consiguiente, el objetivo general de la presente investigación fue diseñar una propuesta de optimización operativa de las rutas y frecuencias de transporte público urbano en el cantón Riobamba para mejorar el nivel de servicio ofertado a los usuarios. La metodología empleada tuvo un enfoque mixto con alcance descriptivo y diseño no experimental transversal; se aplicaron técnicas de aforo vehicular en puntos estratégicos, estudios de ascenso y descenso de pasajeros a bordo de las unidades operativas, así como encuestas estructuradas de movilidad a una muestra representativa de usuarios habituales del sistema. Los resultados obtenidos evidenciaron un índice de rotación desigual entre las líneas troncales, una velocidad comercial promedio reducida en intersecciones críticas y una insatisfacción significativa respecto a los intervalos de paso en horas valle. Se concluyó que la reprogramación técnica de intervalos de despacho, junto con la redistribución equilibrada de la flota vehicular según la demanda horaria real, permite disminuir sustancialmente los tiempos de viaje de la ciudadanía y elevar la eficiencia operacional de las operadoras de transporte intracantonal.";
    let yRes = writeJustifiedParagraph(resumenTexto, 48);
    doc.setFont("times", "bold");
    doc.text(
      doc.splitTextToSize(
        "Palabras clave: <GESTIÓN DEL TRANSPORTE>, <MOVILIDAD URBANA>, <TRANSPORTE PÚBLICO>, <OPTIMIZACIÓN DE RUTAS>, <RIOBAMBA (CANTÓN)>.",
        textW
      ),
      leftM,
      yRes + 4
    );
    putFooter(toRomanLower(9));

    // PÁGINA 10 (x): ABSTRACT
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("ABSTRACT", leftM, 34);
    let yAbs = writeJustifiedParagraph(
      "The urban public transport system of Riobamba canton exhibited route overlapping, high waiting times, and irregular frequency compliance along main corridors during peak demand periods. Therefore, the main objective of this research was to design an operational optimization proposal for urban public transit routes and frequencies in Riobamba canton. A mixed-methods approach with descriptive scope and non-experimental cross-sectional design was applied, using boarding and alighting surveys, traffic counts, and user mobility questionnaires. Results showed uneven passenger turnover and low commercial speeds at critical intersections. It was concluded that technical headway rescheduling and fleet redistribution significantly improve operational efficiency and service quality.",
      48
    );
    doc.setFont("times", "bold");
    doc.text(
      doc.splitTextToSize(
        "Keywords: <TRANSPORT MANAGEMENT>, <URBAN MOBILITY>, <PUBLIC TRANSIT>, <ROUTE OPTIMIZATION>, <RIOBAMBA (CANTON)>.",
        textW
      ),
      leftM,
      yAbs + 4
    );
    putFooter(toRomanLower(10));

    // PÁGINA 11 (1): INTRODUCCIÓN
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("INTRODUCCIÓN", leftM, 34);
    let yInt = writeJustifiedParagraph(
      "La movilidad urbana sostenible constituye un eje estratégico para el desarrollo socioeconómico de las ciudades intermedias del Ecuador, permitiendo articular las actividades productivas, educativas y comerciales mediante sistemas de transporte colectivo seguros, accesibles y eficientes.",
      48
    );
    writeJustifiedParagraph(
      "En el cantón Riobamba, el crecimiento demográfico y la expansión del parque automotor privado han generado presiones operativas sobre la red vial urbana, demandando una planificación técnica rigurosa basada en indicadores de ingeniería y gestión del transporte.",
      yInt
    );
    putFooter("1");

    // PÁGINA 12 (2): CAPÍTULO I - PROBLEMA DE INVESTIGACIÓN
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("CAPÍTULO I", leftM, 34);
    doc.text("1. PROBLEMA DE INVESTIGACIÓN", leftM, 44);
    doc.text("1.1. Planteamiento del problema", leftM, 55);
    let yC1 = writeJustifiedParagraph(
      "El servicio de transporte intracantonal en Riobamba enfrenta desafíos asociados con la convergencia excesiva de líneas sobre ejes viales saturados, lo que reduce la velocidad comercial y eleva los costos de operación vehicular (Molinero, 2022, p. 48).",
      64
    );
    doc.setFont("times", "bold");
    doc.text("1.2. Objetivos", leftM, yC1);
    yC1 = writeJustifiedParagraph(
      "Determinar los parámetros operacionales actuales de oferta y demanda del transporte urbano para estructurar un esquema técnico de optimización de intervalos y cobertura espacial en el cantón Riobamba.",
      yC1 + 9
    );
    doc.setFont("times", "bold");
    doc.text("1.3. Justificación", leftM, yC1);
    yC1 = writeJustifiedParagraph(
      "La investigación aporta criterios técnicos verificables que benefician directamente a los usuarios del transporte público y a las operadoras locales mediante el uso racional de la flota autorizada.",
      yC1 + 9
    );
    doc.setFont("times", "bold");
    doc.text("1.4. Hipótesis o pregunta de investigación", leftM, yC1);
    writeJustifiedParagraph(
      "La reprogramación técnica de frecuencias basada en perfiles horarios de carga mejora significativamente los indicadores de regularidad y nivel de servicio del transporte urbano en Riobamba.",
      yC1 + 9
    );
    putFooter("2");

    // PÁGINA 13 (3): CAPÍTULO II - MARCO TEÓRICO (con niveles 2 y 3)
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("CAPÍTULO II", leftM, 34);
    doc.text("2. MARCO TEÓRICO", leftM, 44);
    doc.text("2.1. Referencias teóricas sobre gestión del transporte público", leftM, 55);
    let yC2 = writeJustifiedParagraph(
      "De acuerdo con Molinero (2022, p. 64), la planeación operativa del transporte urbano comprende la determinación del intervalo óptimo, tamaño vehicular y programación de despachos conforme al volumen en la sección de máxima carga.",
      64
    );
    doc.setFont("times", "bolditalic");
    doc.text("2.1.1. Indicadores de calidad y regularidad del servicio", leftM, yC2);
    writeJustifiedParagraph(
      "Asimismo, Rodríguez (2023, p. 112) sostiene que la confiabilidad del intervalo de paso y el tiempo total de viaje percibido por el pasajero son determinantes esenciales en la partición modal urbana, coincidiendo con criterios técnicos reportados por Vuchic (2021, p. 89).",
      yC2 + 9
    );
    putFooter("3");

    // PÁGINA 14 (4): CAPÍTULO III - MARCO METODOLÓGICO
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("CAPÍTULO III", leftM, 34);
    doc.text("3. MARCO METODOLÓGICO", leftM, 44);
    doc.text("3.1. Enfoque, alcance, diseño, técnicas e instrumentos de investigación", leftM, 55);
    let yC3 = writeJustifiedParagraph(
      "Se desarrolló una investigación con enfoque cuantitativo y cualitativo, de alcance descriptivo y diseño no experimental transversal durante el periodo académico 2026, recolectando datos primarios de campo en las paradas de mayor afluencia.",
      64
    );
    writeJustifiedParagraph(
      "Los instrumentos empleados consistieron en formularios técnicos de frecuencia y ocupación visual, registros de ascenso y descenso a bordo y cuestionarios validados para evaluar la percepción de los pasajeros.",
      yC3
    );
    putFooter("4");

    // PÁGINA 15 (5): CAPÍTULO IV - RESULTADOS CON TABLA E ILUSTRACIÓN NORMATIVAS
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("CAPÍTULO IV", leftM, 34);
    doc.text("4. MARCO DE ANÁLISIS E INTERPRETACIÓN DE RESULTADOS", leftM, 44);
    doc.text("4.1. Procesamiento, análisis e interpretación de resultados", leftM, 54);

    // Tabla editable con descripción arriba en 11 pt y Realizado por abajo en 8 pt
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Tabla 4-1: Indicadores operacionales de frecuencias e intervalos", leftM, 65);
    doc.autoTable({
      startY: 68,
      margin: { left: leftM, right: rightM },
      head: [["Corredor Vial", "Intervalo Actual (min)", "Ocupación (%)", "Intervalo Óptimo (min)"]],
      body: [
        ["Corredor Norte - Centro", "6,5", "88,4%", "5,0"],
        ["Corredor Sur - Terminal", "9,0", "76,2%", "7,5"]
      ],
      styles: { font: "times", fontSize: 10, cellPadding: 2 }
    });
    let afterTblY = doc.lastAutoTable.finalY + 4.5;
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.text("Realizado por: Vallejo, C., 2026.", leftM, afterTblY);

    // Ilustración con imagen ARRIBA y título (11 pt) + Realizado por (8 pt) en PARTE INFERIOR
    const imgTopY = afterTblY + 8;
    doc.addImage(chartUrl, "PNG", centerTextX - 42, imgTopY, 84, 42);
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text("Ilustración 4-1: Demanda horaria de pasajeros por corredor vial", leftM, imgTopY + 48);
    doc.setFontSize(8);
    doc.text("Realizado por: Vallejo, C., 2026.", leftM, imgTopY + 53);

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("4.2. Discusión", leftM, imgTopY + 63);
    writeJustifiedParagraph(
      "Los hallazgos concuerdan con lo expuesto por Rodríguez (2023, p. 115), evidenciando que el ajuste técnico de despachos disminuye la saturación en hora pico sin incrementar kilómetros improductivos.",
      imgTopY + 71
    );
    putFooter("5");

    // PÁGINA 16 (6): CONCLUSIONES Y RECOMENDACIONES
    doc.addPage();
    doc.setFont("times", "bold");
    doc.text("CONCLUSIONES", leftM, 34);
    let yCon = writeJustifiedParagraph(
      "Se determinó que la optimización de intervalos de despacho en los corredores principales de Riobamba reduce el tiempo promedio de espera en parada en un 21,4% y equilibra el factor de ocupación vehicular.",
      45
    );
    doc.setFont("times", "bold");
    doc.text("RECOMENDACIONES", leftM, yCon + 6);
    writeJustifiedParagraph(
      "Se recomienda a la Dirección de Gestión de Movilidad, Tránsito y Transporte implementar planes operativos dinámicos diferenciados para periodos punta y valle con monitoreo periódico de regularidad.",
      yCon + 16
    );
    putFooter("6");

    // PÁGINA 17 (SIN NUMERACIÓN): BIBLIOGRAFÍA APA (orden alfabético + sangría francesa + Total en 8 pt negrita derecha)
    doc.addPage();
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("BIBLIOGRAFÍA", leftM, 34);
    doc.setFont("times", "normal");
    const refs = [
      [
        "Molinero, Á., & Sánchez, I. (2022). Transporte público: planeación, diseño, operación y",
        "administración (3.a ed.). Ciudad de México: Limusa."
      ],
      [
        "Rodríguez, J. P. (2023). Geografía y gestión de los sistemas de transporte urbano en América",
        "Latina. Bogotá: Editorial Universitaria."
      ],
      [
        "Vuchic, V. R. (2021). Urban transit operations, planning and economics (2nd ed.). Hoboken:",
        "John Wiley & Sons."
      ]
    ];
    let yBib = 48;
    refs.forEach((rLines) => {
      doc.text(rLines[0], leftM, yBib);
      doc.text(rLines[1], leftM + 12.5, yBib + lh); // Sangría francesa 1.25 cm
      yBib += lh * 2 + 4;
    });

    doc.setFont("times", "bold");
    doc.setFontSize(8);
    doc.text("Total 3 referencias bibliográficas.", 210 - rightM, yBib + 4, { align: "right" });

    // PÁGINA 18 (SIN NUMERACIÓN): ANEXO A
    doc.addPage();
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("ANEXO A: FICHA TÉCNICA DE AFORO VEHICULAR Y PASAJEROS", leftM, 34);
    writeJustifiedParagraph(
      "Formato empleado en campo para el registro sistemático de placa vehicular, operadora, hora de paso, ascenso, descenso y carga remanente por parada de control.",
      46
    );

    return {
      fileName: "Ejemplo_Cumplimiento_Optimo_ESPOCH.pdf",
      buffer: doc.output("arraybuffer")
    };
  }

  function createFlawedDemoPDF() {
    const { jsPDF } = window.jspdf;
    // Errores deliberados: margen izq 2.5 cm en vez de 3.5 cm, fuente Helvetica 12 pt, sangría primera línea, etc.
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const chartUrl = makeCanvasImageDataUrl("chart");

    const wrongLeft = 25; // Error: 2.5 cm en vez de 3.5 cm
    const rightM = 25;
    const textW = 160;

    // PÁG 1: Portada incompleta (sin isologo, sin Director, con número de página 1 en portada)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO", 105, 50, { align: "center" });
    doc.setFontSize(12);
    doc.text("FACULTAD DE ADMINISTRACIÓN DE EMPRESAS", 105, 62, { align: "center" });
    doc.text("ESTUDIO DE RUTAS DE BUSES EN RIOBAMBA", 105, 95, { align: "center" });
    doc.text("AUTOR: JUAN PÉREZ", 105, 145, { align: "center" });
    doc.text("Riobamba - Ecuador", 105, 190, { align: "center" });
    doc.text("1", 180, 280); // Error: Portada numerada y a la derecha

    // PÁG 2: Dedicatoria con 2 párrafos y diminutivo ("mamita"), paginada con arábigo "2" en vez de romano
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DEDICATORIA", wrongLeft, 35);
    doc.setFont("helvetica", "normal");
    doc.text("Dedico con mucho cariño este trabajo a mi querida mamita y a mis hermanitos.", wrongLeft, 50);
    doc.text("También se lo dedico a todos mis amiguitos de la universidad que me apoyaron siempre.", wrongLeft, 68);
    doc.text("2", 180, 280);

    // PÁG 3: Resumen muy corto (< 200 palabras), primera persona, 3 palabras clave sin < >
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN", wrongLeft, 35);
    doc.setFont("helvetica", "normal");
    const shortRes = doc.splitTextToSize(
      "En este trabajo nosotros realizamos un estudio rápido sobre los buses de Riobamba porque vimos que hay mucho tráfico en el centro. Hicimos algunas encuestas a varias personas y concluimos que hace falta mejorar las paradas de buses en toda la ciudad.",
      textW
    );
    doc.text(shortRes, wrongLeft, 48);
    doc.text("Palabras clave: transporte, buses, tráfico.", wrongLeft, 82);
    doc.text("3", 180, 280);

    // PÁG 4: Capítulo I con sangría de primera línea, subtítulo 1.1 en MAYÚSCULAS y Tabla/Figura mal rotuladas
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("CAPÍTULO I", wrongLeft, 35);
    doc.text("1. PROBLEMA DE INVESTIGACIÓN", wrongLeft, 45);
    doc.text("1.1 PLANTEAMIENTO DEL PROBLEMA", wrongLeft, 56); // Error: Nivel 2 todo en MAYÚSCULAS

    doc.setFont("helvetica", "normal");
    // Párrafo con sangría de primera línea (prohibida en ESPOCH) e interlineado sencillo
    doc.text("En la actualidad el transporte urbano presenta demoras importantes en las principales", wrongLeft + 13, 66);
    doc.text("avenidas de la ciudad de Riobamba según observamos diariamente en las calles céntricas", wrongLeft, 71);
    doc.text("generando congestión vehicular constante durante las mañanas y tardes.", wrongLeft, 76);

    // Error: 'Figura 1' colocada ARRIBA de la imagen y 'Fuente: Elaboración propia' en 11 pt
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Figura 1. Gráfico de pasajeros encuestados", wrongLeft, 92);
    doc.addImage(chartUrl, "PNG", 65, 96, 80, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Fuente: Elaboración propia", wrongLeft, 144);
    doc.text("4", 180, 280);

    // PÁG 5: Bibliografía numerada con página (prohibido), desordenada (Z antes que A), sin sangría francesa y sin leyenda Total
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("BIBLIOGRAFÍA", wrongLeft, 35);
    doc.setFont("helvetica", "normal");
    doc.text(
      doc.splitTextToSize(
        "Zambrano, L. (2021). Manual básico de tránsito terrestre urbano en ciudades andinas. Quito: Editorial Andina.",
        textW
      ),
      wrongLeft,
      48
    );
    doc.text(
      doc.splitTextToSize(
        "Álvarez, M. (2020). Logística y movilidad sostenible en el transporte público colectivo. Bogotá: Ecoe Ediciones.",
        textW
      ),
      wrongLeft,
      66
    );
    doc.text("5", 180, 280); // Error: Página final numerada

    return {
      fileName: "Borrador_Estudiante_Con_Errores.pdf",
      buffer: doc.output("arraybuffer")
    };
  }

  return {
    createCompliantDemoPDF,
    createFlawedDemoPDF
  };
})();
