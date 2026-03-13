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
  // 4. GESTIÓN DE CONFLICTOS
  {
    categoria: "Gestión de Conflictos",
    preguntas: [
      { id: "con_1", texto: "¿Maneja las conversaciones difíciles o conflictivas de manera constructiva?" },
      { id: "con_2", texto: "¿Mantiene la calma y la objetividad en situaciones de alta presión?" },
      { id: "con_3", texto: "¿Actúa como mediador(a) imparcial para resolver desacuerdos internos?" }
    ]
  },
  // 5. ADAPTABILIDAD
  {
    categoria: "Adaptabilidad",
    preguntas: [
      { id: "ada_1", texto: "¿Muestra flexibilidad ante cambios repentinos en las directrices de los clientes?" },
      { id: "ada_2", texto: "¿Acepta y utiliza la retroalimentación (feedback) para mejorar su desempeño?" },
      { id: "ada_3", texto: "¿Propone ajustes creativos cuando los procesos actuales fallan?" }
    ]
  },
  // 6. INTEGRIDAD Y COMPROMISO
  {
    categoria: "Integridad y Compromiso",
    preguntas: [
      { id: "int_1", texto: "¿Actúa consistentemente bajo los valores éticos de Premium Consultores?" },
      { id: "int_2", texto: "¿Asume la responsabilidad total por sus acciones y los resultados de su unidad?" },
      { id: "int_3", texto: "¿Demuestra lealtad hacia la firma y protege la confidencialidad de la información?" }
    ]
  }
];
