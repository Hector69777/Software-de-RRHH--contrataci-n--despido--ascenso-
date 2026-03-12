type OptionType = "opcion_multiple" | "abierta";

interface Option {
    texto: string;
    valor: number;
}

interface BaseQuestion {
    id: string;
    categoria: string;
    pregunta: string;
    tipo?: OptionType;
}

interface MultipleQuestion extends BaseQuestion {
    tipo?: "opcion_multiple";
    opciones: Option[];
}

interface OpenQuestion extends BaseQuestion {
    tipo: "abierta";
    opciones?: never;
}

type Pregunta = MultipleQuestion | OpenQuestion;

export const bancoPreguntas: Pregunta[] = [
    {
        id: "fin_01",
        categoria: "Contaduría y Finanzas",
        pregunta:
            "¿Cuál es su nivel de experiencia en la reestructuración de deuda y reflotamiento de empresas en crisis?",
        opciones: [
            { texto: "Nula experiencia en el área", valor: 1 },
            { texto: "Conocimiento teórico básico", valor: 2 },
            { texto: "He participado en auditorías menores", valor: 3 },
            { texto: "Experiencia operativa en casos reales", valor: 4 },
            {
                texto: "Experto en liderar procesos de reestructuración complejos",
                valor: 5,
            },
        ],
    },
    {
        id: "fin_02",
        categoria: "Contaduría y Finanzas",
        pregunta:
            "Ante un cliente con problemas de liquidez, ¿qué prioridad le asigna al análisis de estados financieros mensuales?",
        opciones: [
            { texto: "Baja prioridad", valor: 1 },
            { texto: "Solo si el cliente lo solicita", valor: 2 },
            { texto: "Es una herramienta de consulta ocasional", valor: 3 },
            { texto: "Es fundamental para la toma de decisiones", valor: 4 },
            {
                texto: "Es el pilar absoluto de la estrategia de asesoría",
                valor: 5,
            },
        ],
    },
    {
        id: "fin_03",
        categoria: "Contaduría y Finanzas",
        pregunta:
            "¿Cómo calificaría su dominio sobre los marcos fiscales y tributarios venezolanos vigentes?",
        opciones: [
            { texto: "Básico / Desactualizado", valor: 1 },
            { texto: "Intermedio", valor: 2 },
            { texto: "Competente para asesoría general", valor: 3 },
            {
                texto: "Avanzado con capacidad de planificación fiscal",
                valor: 4,
            },
            {
                texto: "Experto consultor con enfoque en optimización de impactos",
                valor: 5,
            },
        ],
    },
    {
        id: "neg_01",
        categoria: "Agilidad y Negociación",
        pregunta:
            "¿Cómo reacciona ante un requerimiento de mercado inesperado que exige una respuesta en menos de 24 horas?",
        opciones: [
            { texto: "Suelo delegar o postergar por presión", valor: 1 },
            { texto: "Me genera dificultades de organización", valor: 2 },
            { texto: "Respondo con lo básico para cumplir", valor: 3 },
            { texto: "Me adapto y busco soluciones rápidas", valor: 4 },
            {
                texto: "Lidero la respuesta con velocidad y destreza analítica",
                valor: 5,
            },
        ],
    },
    {
        id: "neg_02",
        categoria: "Agilidad y Negociación",
        pregunta:
            "En una negociación con un cliente de alto nivel, ¿cuál es su enfoque principal para lograr el cierre?",
        opciones: [
            { texto: "Imponer mi criterio basado en mi experiencia", valor: 1 },
            { texto: "Ceder ante las peticiones del cliente", valor: 2 },
            { texto: "Buscar un punto medio convencional", valor: 3 },
            {
                texto: "Utilizar la persuasión basada en datos técnicos",
                valor: 4,
            },
            {
                texto: "Inspirar confianza absoluta mediante soluciones creativas y éticas",
                valor: 5,
            },
        ],
    },
    {
        id: "neg_03",
        categoria: "Agilidad y Negociación",
        pregunta:
            "¿Qué tan eficiente es identificando nuevas oportunidades de negocio mientras atiende una cartera actual?",
        opciones: [
            { texto: "Me enfoco solo en mis tareas asignadas", valor: 1 },
            { texto: "Rara vez identifico oportunidades nuevas", valor: 2 },
            { texto: "Las identifico pero no sé cómo proponerlas", valor: 3 },
            { texto: "Soy proactivo en sugerir mejoras", valor: 4 },
            {
                texto: "Tengo visión comercial constante para crear negocios interrelacionados",
                valor: 5,
            },
        ],
    },
    {
        id: "cul_01",
        categoria: "Cultura Organizacional",
        pregunta:
            "¿Qué importancia tiene para usted el respeto y la dignidad en el trato diario con colegas de menor rango?",
        opciones: [
            {
                texto: "Lo secundario, lo que importa son los resultados",
                valor: 1,
            },
            {
                texto: "Es deseable pero no siempre posible bajo presión",
                valor: 2,
            },
            { texto: "Es una norma que trato de seguir", valor: 3 },
            { texto: "Es fundamental para un buen ambiente", valor: 4 },
            {
                texto: "Es un valor innegociable y pilar de mi ética profesional",
                valor: 5,
            },
        ],
    },
    {
        id: "cul_02",
        categoria: "Cultura Organizacional",
        pregunta:
            "Ante un conflicto de equipo por una decisión inconsulta, ¿cuál es su postura?",
        opciones: [
            {
                texto: "Mantengo mi decisión si los resultados son buenos",
                valor: 1,
            },
            { texto: "Ignoro las quejas para evitar distracciones", valor: 2 },
            { texto: "Escucho las quejas pero no cambio mi método", valor: 3 },
            {
                texto: "Busco explicar mi punto de vista a posteriori",
                valor: 4,
            },
            {
                texto: "Fomento la comunicación abierta y el consenso desde el inicio",
                valor: 5,
            },
        ],
    },
    {
        id: "cul_03",
        categoria: "Cultura Organizacional",
        pregunta:
            "¿Cómo integra el concepto de 'calidad de servicio' en sus funciones internas de oficina?",
        opciones: [
            {
                texto: "Solo aplico calidad cuando trato con el cliente externo",
                valor: 1,
            },
            { texto: "Cumplo con lo mínimo requerido", valor: 2 },
            { texto: "Trato de ser ordenado", valor: 3 },
            { texto: "Aplico estándares de calidad en mis informes", valor: 4 },
            {
                texto: "Considero que cada colaborador es un cliente interno que merece excelencia",
                valor: 5,
            },
        ],
    },
    {
        id: "val_01",
        categoria: "Aporte de Valor",
        pregunta:
            "¿Qué habilidades o métodos actualizados considera que puede aportar para que Premium Consultores alcance el liderazgo nacional?",
        tipo: "abierta",
    },
];
