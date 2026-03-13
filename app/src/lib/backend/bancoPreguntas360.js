// Opciones de respuesta tentativas para el mapeo en los radio buttons
export const opciones360 = [
  { texto: "Necesita mejorar", valor: 1 },
  { texto: "Aceptable", valor: 3 },
  { texto: "Sobresaliente", valor: 5 }
];

export const bancoPreguntas360 = [
  // 1. LIDERAZGO
  {
    categoria: "Liderazgo",
    preguntas: [
      { id: "lid_1", texto: "¿Toma decisiones oportunas considerando el impacto en el equipo y la organización?" },
      { id: "lid_2", texto: "¿Inspira y motiva a los miembros del equipo para alcanzar los objetivos de la firma?" },
      { id: "lid_3", texto: "¿Delega tareas de manera efectiva, empoderando a sus colaboradores?" }
    ]
  },
  // 2. COMUNICACIÓN
  {
    categoria: "Comunicación",
    preguntas: [
      { id: "com_1", texto: "¿Se comunica de forma clara, concisa y efectiva (oral y escrita)?" },
      { id: "com_2", texto: "¿Escucha activamente y busca comprender las perspectivas de los demás?" },
      { id: "com_3", texto: "¿Es asertivo(a) al expresar sus opiniones sin llegar a la agresividad?" }
    ]
  },
  // 3. TRABAJO EN EQUIPO
  {
    categoria: "Trabajo en Equipo",
    preguntas: [
      { id: "eqp_1", texto: "¿Colabora eficazmente con otros departamentos para lograr objetivos comunes?" },
      { id: "eqp_2", texto: "¿Muestra respeto y consideración por el tiempo y trabajo de sus colegas?" },
      { id: "eqp_3", texto: "¿Contribuye activamente a mantener un clima de cooperación en la oficina?" }
    ]
  },
  // 4. COMPETENCIA TÉCNICA
  {
    categoria: "Competencia Técnica",
    preguntas: [
      { id: "tec_1", texto: "¿Demuestra un nivel de conocimientos técnicos superior para las exigencias de su cargo?" },
      { id: "tec_2", texto: "¿La calidad técnica de sus entregables es consistentemente impecable y sin errores?" },
      { id: "tec_3", texto: "¿Domina rápidamente nuevas herramientas o metodologías requeridas para el trabajo?" }
    ]
  },
  // 5. RESOLUCIÓN DE PROBLEMAS
  {
    categoria: "Resolución de Problemas",
    preguntas: [
      { id: "res_1", texto: "¿Es capaz de solventar problemas técnicos complejos de forma autónoma?" },
      { id: "res_2", texto: "¿Encuentra soluciones eficientes bajo presión o con márgenes de tiempo ajustados?" },
      { id: "res_3", texto: "¿Sus soluciones técnicas previenen la recurrencia de las fallas?" }
    ]
  },
  // 6. INTEGRIDAD Y COMPROMISO
  {
    categoria: "Integridad y Compromiso",
    preguntas: [
      { id: "int_1", texto: "¿Actúa consistentemente bajo los valores éticos de Premium Consultores?" },
      { id: "int_2", texto: "¿Asume la responsabilidad total por sus acciones y los resultados de su unidad?" },
      { id: "int_3", texto: "¿Demuestra lealtad hacia la firma y cumple cabalmente con las metas trazadas?" }
    ]
  }
];
