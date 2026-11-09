/**
 * Catálogo Normativo Institucional ESPOCH - DBRA y Carrera de Gestión del Transporte
 * Autor del Sistema: Ing. Diego Haro Avalos
 * Docente Trabajo de Titulación - Carrera de Gestión del Transporte (FADE - ESPOCH)
 */

window.ESPOCH_NORMATIVA = {
  institucion: "Escuela Superior Politécnica de Chimborazo (ESPOCH)",
  facultad: "Facultad de Administración de Empresas (FADE)",
  carrera: "Carrera de Gestión del Transporte",
  autorPrograma: {
    nombre: "Ing. Diego Haro Avalos",
    cargo: "Docente Trabajo de Titulación",
    unidad: "Carrera de Gestión del Transporte — ESPOCH"
  },

  categorias: [
    {
      id: "formato_general",
      nombre: "1. Formato General, Papel y Márgenes",
      peso: 18,
      icono: "ruler",
      descripcion: "Tamaño de hoja A4, márgenes verticales/horizontales, tipografía Times New Roman 11 pt, interlineado 1,5 y cero sangría en el cuerpo."
    },
    {
      id: "paginacion",
      nombre: "2. Paginación por Secciones",
      peso: 13,
      icono: "hash",
      descripcion: "Portada sin numerar, preliminares en números romanos minúsculas (ii, iii...), cuerpo en arábigos (1, 2...) y páginas finales sin numeración, centrada a 2 cm del borde inferior."
    },
    {
      id: "preliminares",
      nombre: "3. Portada y Páginas Preliminares",
      peso: 17,
      icono: "file-check",
      descripcion: "Estructura y tamaños de fuente en Portada, páginas legales obligatorias, Dedicatoria/Agradecimiento e Índices de Contenido, Tablas, Ilustraciones y Anexos."
    },
    {
      id: "resumen_abstract",
      nombre: "4. Resumen, Palabras Clave y Abstract",
      peso: 12,
      icono: "align-left",
      descripcion: "Resumen informativo (esquema POMRC) de 200 a 300 palabras en un solo párrafo, 5 palabras clave entre signos < > y Summary/Abstract en inglés."
    },
    {
      id: "estructura_titulos",
      nombre: "5. Estructura Capitular y Jerarquía de Títulos",
      peso: 16,
      icono: "list-tree",
      descripcion: "Capítulos del Proyecto de Investigación de Grado (Introducción, Cap. I-IV, Cap. V opcional, Conclusiones/Recomendaciones) y formato de títulos de 1.º a 4.º nivel."
    },
    {
      id: "tablas_ilustraciones",
      nombre: "6. Tablas, Ilustraciones y Soporte Digital",
      peso: 12,
      icono: "table",
      descripcion: "Nomenclatura Tabla X-Y: (arriba, 11 pt) e Ilustración X-Y: (abajo, 11 pt), Fuente/Realizado por en 8 pt sin usar 'Elaboración propia', y tablas editables no pegadas como imagen."
    },
    {
      id: "citas_bibliografia",
      nombre: "7. Citas, Bibliografía (APA) y Páginas Finales",
      peso: 12,
      icono: "book-open",
      descripcion: "Citas (autor, año, página), Bibliografía APA ordenada alfabéticamente con sangría francesa, leyenda final en 8 pt negrita derecha ('Total X referencias bibliográficas.'), Glosario y Anexos."
    }
  ],

  reglasReferencia: {
    A1_TAMANO_PAPEL: {
      titulo: "Tamaño de papel A4 (21,0 cm × 29,7 cm)",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 49",
      explicacionNorma: "Todo el Trabajo de Titulación debe configurarse en tamaño de papel A4 (21 cm × 29,7 cm).",
      comoCorregir: "En Microsoft Word: vaya a la pestaña 'Disposición' (o 'Formato') > 'Tamaño' > seleccione 'A4 (21 cm x 29,7 cm)' y asegúrese de aplicarlo a 'Todo el documento' antes de exportar a PDF."
    },
    A2_MARGENES: {
      titulo: "Márgenes reglamentarios (Izq. 3,5 cm; Sup./Der./Inf. 2,5 cm)",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 4",
      explicacionNorma: "En hojas verticales: margen izquierdo 3,5 cm y márgenes superior, derecho e inferior de 2,5 cm. En hojas horizontales: margen superior 3,5 cm y márgenes izquierdo, derecho e inferior de 2,5 cm.",
      comoCorregir: "En Word: vaya a 'Disposición' > 'Márgenes' > 'Márgenes personalizados'. Configure Superior: 2,5 cm, Inferior: 2,5 cm, Izquierdo: 3,5 cm, Derecho: 2,5 cm. Si tiene páginas horizontales, use saltos de sección y ponga Superior: 3,5 cm y el resto 2,5 cm."
    },
    A3_TIPOGRAFIA: {
      titulo: "Tipografía institucional Times New Roman",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 3",
      explicacionNorma: "Se debe utilizar la fuente Times New Roman de manera uniforme en todo el documento (texto, títulos, preliminares, índices, tablas, ilustraciones y paginación).",
      comoCorregir: "Modifique el estilo 'Normal' y los estilos de 'Título 1..4', encabezados/pies de página y leyendas en Word para usar exclusivamente 'Times New Roman'. Revise que no queden fragmentos en Calibri, Arial o Aptos."
    },
    A4_TAMANO_TEXTO: {
      titulo: "Tamaño de fuente general de 11 puntos",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 3",
      explicacionNorma: "El tamaño de letra para todo el cuerpo del texto y títulos de capítulos/subtítulos es de 11 puntos (reservando 8 puntos para Fuente/Realizado por y leyenda final de bibliografía, 9 puntos para citas largas en bloque, y 12-16 puntos únicamente en Portada).",
      comoCorregir: "En Word, configure el estilo 'Normal' y los títulos capitulares en Times New Roman tamaño 11 pt (no 12 pt como suele usarse en APA estándar)."
    },
    A5_INTERLINEADO: {
      titulo: "Espacio interlineado de 1,5 y separación entre párrafos",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 5",
      explicacionNorma: "Todo el texto se escribe con espacio interlineado de 1,5; el espaciado anterior y posterior es cero (0 pt). Entre niveles de títulos y entre párrafos se da un espacio interlineado (ENTER) desde la introducción hasta anexos.",
      comoCorregir: "Seleccione el texto en Word > 'Párrafo' > Interlineado: '1,5 líneas', Espaciado Anterior: '0 pto' y Posterior: '0 pto'. Separe los párrafos y títulos con un salto de línea (ENTER) en interlineado 1,5."
    },
    A6_SIN_SANGRIA: {
      titulo: "Ausencia de sangría en párrafos, títulos y viñetas",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 3",
      explicacionNorma: "En todo el texto, tanto en párrafos como en la división jerárquica de contenido científico y ubicación de viñetas, NO se aplica ningún tipo de sangría (la única excepción es la sangría francesa en Bibliografía APA).",
      comoCorregir: "En Word, seleccione los párrafos del cuerpo y viñetas > 'Párrafo' > 'Sangría' > Izquierda: 0 cm, Derecha: 0 cm, Especial: '(ninguna)'. Elimine las sangrías de primera línea heredadas de APA."
    },
    B1_PORTADA_SIN_PAG: {
      titulo: "Portada sin numeración visible",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 5 y 7",
      explicacionNorma: "A cada página le corresponde un número excepto la Portada (se contabiliza internamente como 'i', pero no se muestra).",
      comoCorregir: "En Word, haga doble clic en el pie de página de la Portada y active la casilla 'Primera página diferente' en la pestaña 'Encabezado y pie de página'."
    },
    B2_PAG_PRELIMINARES: {
      titulo: "Paginación de Páginas Preliminares en romanos minúsculas (ii, iii...)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 6, 7 y 9",
      explicacionNorma: "Las páginas preliminares llevan numeración en números romanos en minúsculas (ii, iii, iv...), iniciando en 'ii' desde el Derecho de Autor hasta el Summary/Abstract.",
      comoCorregir: "Inserte un salto de sección al final del Summary/Abstract. En la sección preliminar vaya a 'Número de página' > 'Formato del número de página' > Formato: 'i, ii, iii...' > Iniciar en 'i' (con Primera página diferente activada para que Derecho de Autor muestre 'ii')."
    },
    B3_PAG_CUERPO: {
      titulo: "Paginación del Texto en números arábigos (1, 2, 3...)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 6, 13 y 23",
      explicacionNorma: "Desde la INTRODUCCIÓN hasta CONCLUSIONES Y RECOMENDACIONES la paginación va en números arábigos (1, 2, 3...) iniciando en 1.",
      comoCorregir: "Al inicio de INTRODUCCIÓN (nueva sección en Word), desvincule el pie de página de la sección anterior ('Vincular a la anterior' desactivado), elija formato '1, 2, 3...' y marque 'Iniciar en: 1'."
    },
    B4_PAG_FINALES: {
      titulo: "Páginas Finales (Glosario, Bibliografía y Anexos) sin paginación",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 6, 16 y 26",
      explicacionNorma: "Las páginas finales (GLOSARIO, BIBLIOGRAFÍA y ANEXOS) NO se enumeran en ningún caso.",
      comoCorregir: "Inserte un 'Salto de sección (Página siguiente)' antes de Glosario/Bibliografía, entre al pie de página de esta sección final, desactive 'Vincular a la anterior' y borre el número de página."
    },
    B5_POSICION_PAG: {
      titulo: "Ubicación del número de página (centrado y a 2 cm del borde inferior)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 5 y 9",
      explicacionNorma: "El número de página debe colocarse a 2 centímetros del borde inferior de la hoja y alineado horizontalmente al centro.",
      comoCorregir: "En las opciones de 'Encabezado y pie de página' de Word, ajuste 'Pie de página desde abajo: 2 cm' y centre el número de página (no lo ubique en la esquina superior derecha ni alineado a la derecha)."
    },
    C1_PORTADA: {
      titulo: "Elementos y tamaños tipográficos de la Portada Matriz",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 8",
      explicacionNorma: "La Portada debe incluir Isologo institucional (4×4 cm), ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO (16 pt), FACULTAD DE ADMINISTRACIÓN DE EMPRESAS (14 pt), CARRERA GESTIÓN DEL TRANSPORTE (12 pt), Título (14 pt), Modalidad y Tipo (12 pt), Grado académico (12 pt / 14 pt), AUTOR/A(ES) (14 pt), DIRECTOR/A (12 pt) y Riobamba - Ecuador + Año (12 pt).",
      comoCorregir: "Revise línea por línea su Portada con la plantilla oficial de la ESPOCH, verificando que aparezca 'DIRECTOR/A:' (a diferencia de la pasta externa) y que cada bloque tenga exactamente el puntaje 16, 14 o 12 pt indicado en la pág. 8 de la guía DBRA."
    },
    C2_PAGINAS_LEGALES: {
      titulo: "Páginas preliminares legales (Derecho de Autor, Autenticidad y Certificación)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 7, 9 y 10",
      explicacionNorma: "Después de la Portada deben constar en orden estricto: 1) Derecho de Autor (© Año, Nombres y Apellidos), 2) Declaración de Autenticidad y Cesión de Derechos de Autor (con Cédula y patrimonio ESPOCH), y 3) Certificación de Dirección / Tribunal del Trabajo.",
      comoCorregir: "Incorpore las tres páginas legales usando la plantilla oficial de la DBRA en el orden exacto: Derecho de Autor (pág. ii), Declaración de Autenticidad (pág. iii) y Certificación del Tribunal (pág. iv), completando nombres, fechas de defensa y cédula."
    },
    C3_DEDICATORIA_AGRADECIMIENTO: {
      titulo: "Formato de Dedicatoria y Agradecimiento (opcionales)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 11 y 12",
      explicacionNorma: "Son opcionales. De incluirse, deben mantener 2 interlineados después del título; la Dedicatoria debe ser breve, moderada en adjetivos, en UN SOLO PÁRRAFO y evitando diminutivos; el Agradecimiento debe redactarse de manera formal y no anecdótica.",
      comoCorregir: "Si incluyó Dedicatoria, unifique el texto en un solo párrafo breve, elimine diminutivos (como 'mamita', 'papito', 'hermanitos', 'abuelita') y deje dos saltos de interlineado debajo del título DEDICATORIA y AGRADECIMIENTO."
    },
    C4_INDICES: {
      titulo: "Índices de Contenido, Tablas, Ilustraciones y Anexos",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 13, 14, 15 y 16",
      explicacionNorma: "Mantener dos saltos de línea después del título principal. En el Índice de Contenido: registrar solo secciones posteriores a dicho índice, NO poner número de página a 'CAPÍTULO I, II...' ni a páginas finales (Glosario, Bibliografía, Anexos). En el Índice de Anexos: tampoco se especifican números de página.",
      comoCorregir: "Actualice sus índices cuidando dejar 2 saltos tras el título, retire de la tabla de contenido páginas previas, quite el número de página en las líneas 'CAPÍTULO I...' y en Glosario/Bibliografía/Anexos, y elimine números de página del Índice de Anexos."
    },
    D1_RESUMEN: {
      titulo: "Resumen informativo (200 a 300 palabras, un solo párrafo, esquema POMRC)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 19 y 21",
      explicacionNorma: "El RESUMEN debe ser informativo bajo el esquema POMRC (Problema 20%, Objetivo 10%, Metodología 30%, Resultados 20%, Conclusión 20%), tener entre 200 y 300 palabras, estructurarse en UN SOLO PÁRRAFO y redactarse en pasado y tercera persona.",
      comoCorregir: "Unifique su Resumen en un único párrafo sin puntos aparte, ajuste su extensión para que tenga estrictamente entre 200 y 300 palabras (sin contar el título ni las palabras clave) y redáctelo en tercera persona en pasado ('se analizó', 'se determinó', 'se concluyó')."
    },
    D2_PALABRAS_CLAVE: {
      titulo: "Palabras clave (secuencia de 5 descriptores con formato DBRA)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 21 y 22",
      explicacionNorma: "Se ubican al final del Resumen y deben ser una secuencia de cinco (5) palabras clave destinadas a la indización, en mayúsculas y encerradas entre signos angulares <PALABRA CLAVE>.",
      comoCorregir: "Al final del Resumen coloque exactamente 5 descriptores siguiendo el formato institucional DBRA, por ejemplo: Palabras clave: <GESTIÓN DEL TRANSPORTE>, <MOVILIDAD URBANA>, <LOGÍSTICA VIAL>, <SEGURIDAD VIAL>, <RIOBAMBA (CANTÓN)>."
    },
    D3_ABSTRACT: {
      titulo: "Summary / Abstract en idioma inglés",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 7",
      explicacionNorma: "Después del Resumen debe incluirse obligatoriamente la página de SUMMARY o ABSTRACT con su traducción fiel en un solo párrafo y sus respectivos Keywords.",
      comoCorregir: "Agregue la sección 'ABSTRACT' (o 'SUMMARY') inmediatamente después del Resumen, en un solo párrafo en inglés académico y con la línea 'Keywords:' al final."
    },
    E1_ESTRUCTURA_PROYECTO: {
      titulo: "Estructura oficial del Proyecto de Investigación de Grado",
      fuenteNormativa: "Guía Dirección de Desarrollo Académico ESPOCH, pág. 1; Guía DBRA, pág. 23",
      explicacionNorma: "El cuerpo comprende: INTRODUCCIÓN; CAPÍTULO I: 1. PROBLEMA DE INVESTIGACIÓN (1.1 Planteamiento, 1.2 Objetivos, 1.3 Justificación, 1.4 Hipótesis/Pregunta); CAPÍTULO II: 2. MARCO TEÓRICO (2.1 Referencias Teóricas); CAPÍTULO III: 3. MARCO METODOLÓGICO; CAPÍTULO IV: 4. MARCO DE ANÁLISIS E INTERPRETACIÓN DE RESULTADOS (4.1 Procesamiento, 4.2 Discusión, 4.3 Comprobación de hipótesis si aplica); CAPÍTULO V: MARCO PROPOSITIVO (opcional); CONCLUSIONES Y RECOMENDACIONES; GLOSARIO (opcional); BIBLIOGRAFÍA; ANEXOS.",
      comoCorregir: "Verifique que estén presentes todos los capítulos y subcapítulos obligatorios con la denominación institucional exacta de la Guía de Proyecto de Investigación de Grado de la ESPOCH."
    },
    E2_JERARQUIA_TITULOS: {
      titulo: "División jerárquica de títulos (Niveles 1 al 4)",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 3",
      explicacionNorma: "1. TÍTULO DE PRIMER NIVEL: MAYÚSCULAS y negrilla. 1.1. Título de segundo nivel: minúscula (tipo oración) y negrilla. 1.1.1. Título de tercer nivel: minúscula, negrilla y cursiva. 1.1.1.1. Título de cuarto nivel: minúscula y cursiva (sin negrilla).",
      comoCorregir: "Ajuste los estilos de título en Word: Nivel 1 (1.) en MAYÚSCULAS + Negrita; Nivel 2 (1.1.) tipo oración + Negrita (sin mayúsculas sostenidas); Nivel 3 (1.1.1.) tipo oración + Negrita + Cursiva; Nivel 4 (1.1.1.1.) tipo oración + solo Cursiva."
    },
    F1_TABLAS_FORMATO: {
      titulo: "Presentación y nomenclatura de Tablas (Tabla X-Y: arriba en 11 pt)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 14, 17 y 18",
      explicacionNorma: "Cada tabla debe centrarse en la página y llevar en la parte superior su descripción con guion y dos puntos ('Tabla 1-1: Descripción...') en tamaño 11 puntos.",
      comoCorregir: "Cambie formatos como 'Tabla 1.' o 'Tabla 1.1' o 'Cuadro 1' por 'Tabla X-Y: Título de la tabla' ubicado en la parte SUPERIOR de la tabla en Times New Roman 11 pt."
    },
    F2_ILUSTRACIONES_FORMATO: {
      titulo: "Presentación y ubicación inferior de Ilustraciones (Ilustración X-Y: abajo en 11 pt)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 15, 17 y 20",
      explicacionNorma: "Toda figura, gráfico, mapa, diagrama o fotografía se denomina 'Ilustración X-Y:'. Tanto su descripción (11 pt) como su referencia de fuente (8 pt) se ubican en la PARTE INFERIOR de la ilustración.",
      comoCorregir: "Reemplace palabras como 'Figura', 'Gráfico' o 'Imagen' por 'Ilustración X-Y: Descripción', y asegúrese de colocar dicho título DEBAJO de la imagen (en 11 pt), seguido debajo por Fuente/Realizado por (en 8 pt)."
    },
    F3_FUENTE_REALIZADO_POR: {
      titulo: "Referencia 'Fuente:' y 'Realizado por:' en 8 puntos (sin 'Elaboración propia')",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 3, 17, 18 y 20",
      explicacionNorma: "Al pie de cada tabla e ilustración la referencia va en 8 puntos. Si NO es de autoría propia: 'Fuente: Apellido Autor, año, página.' Si ES de autoría propia: 'Realizado por: Apellido, Inicial., año.' (no se admite 'Elaboración propia' ni 'El autor').",
      comoCorregir: "Configure todas las líneas de 'Fuente:' y 'Realizado por:' exactamente en Times New Roman 8 puntos, y sustituya cualquier 'Elaboración propia' o 'El autor' por 'Realizado por: Apellido, Inicial., Año' (ej. Realizado por: Pérez, J., 2026)."
    },
    F4_TABLAS_NO_IMAGEN: {
      titulo: "Tablas editables importadas (no insertadas como imágenes)",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 51",
      explicacionNorma: "Se debe importar tablas y gráficos hechos en Excel al texto del Trabajo de Titulación, y NO incorporarlos como capturas o imágenes.",
      comoCorregir: "Elimine las tablas pegadas como imagen o captura de pantalla y péguelas directamente desde Excel/Word como tablas editables con texto seleccionable."
    },
    G1_CITAS_TEXTO: {
      titulo: "Citas bibliográficas en el texto (autor, año, página)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 23 y 24",
      explicacionNorma: "La referencia de la cita en el texto debe especificarse indicando autor, año y página (ej. Apellido, 2023, p. 45) para identificar con precisión las fuentes utilizadas.",
      comoCorregir: "Revise las citas dentro de los capítulos (especialmente Marco Teórico y Discusión) asegurando incluir apellido del autor, año de publicación y número de página cuando corresponda según guía DBRA."
    },
    G2_BIBLIOGRAFIA_FORMATO: {
      titulo: "Bibliografía según Norma APA (orden alfabético y sangría francesa)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 28, 38 y 39",
      explicacionNorma: "Para la Facultad de Administración de Empresas (Carrera de Gestión del Transporte) rige la Norma APA: las referencias se ordenan alfabéticamente por el primer elemento y deben llevar sangría francesa.",
      comoCorregir: "Ordene de la A a la Z todas las entradas en BIBLIOGRAFÍA y aplique 'Sangría especial: Francesa (1,25 cm)' en las opciones de Párrafo de Word únicamente a las referencias bibliográficas."
    },
    G3_LEYENDA_TOTAL_BIBLIO: {
      titulo: "Leyenda final obligatoria de conteo de referencias bibliográficas",
      fuenteNormativa: "Guía DBRA ESPOCH, pág. 38",
      explicacionNorma: "En Norma APA ESPOCH, al final de la bibliografía (con espaciado de un ENTER de la última referencia, alineado a la derecha, negrita y tamaño de letra 8 pt) se debe colocar: 'Total X referencias bibliográficas.'",
      comoCorregir: "Cuente el número exacto de referencias de su Bibliografía, deje un ENTER después de la última referencia y escriba alineado a la derecha, en Times New Roman 8 puntos y negrita: 'Total XX referencias bibliográficas.'"
    },
    G4_COINCIDENCIA_FINALES: {
      titulo: "Correspondencia Citas-Bibliografía, Glosario y Anexos (A, B, C)",
      fuenteNormativa: "Guía DBRA ESPOCH, págs. 16, 26, 27 y 38",
      explicacionNorma: "Todos los autores citados en el texto deben constar en la Bibliografía. Si hay Glosario, sus términos van en negrilla y en orden alfabético. Los Anexos se identifican con letras mayúsculas (ANEXO A, ANEXO B, ANEXO C).",
      comoCorregir: "Verifique que ningún autor citado en el texto falte en la Bibliografía; si incluyó Glosario ordénelo alfabéticamente con entradas en negrita; y rotule los anexos con letras ('ANEXO A: ...') en lugar de números."
    }
  }
};
