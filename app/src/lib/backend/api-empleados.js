import { supabase } from './supabase.js';

/**
 * Obtiene la lista completa de empleados desde Supabase,
 * ordenados alfabéticamente por nombre, y formatea la fecha de ingreso.
 * @returns {Promise<Array>} Array con los datos de los empleados o [] si hay error.
 */
export async function obtenerListaEmpleados() {
    try {
        const { data, error } = await supabase
            .from('empleado')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            throw error;
        }

        if (!data) return [];

        // Formatear la fecha_ingreso a Día/Mes/Año (DD/MM/YYYY)
        const empleadosFormateados = data.map(empleado => {
            if (empleado.fecha_ingreso) {
                const fecha = new Date(empleado.fecha_ingreso);
                // getDate() retorna el día del mes (1-31)
                const dia = String(fecha.getDate()).padStart(2, '0');
                // getMonth() retorna (0-11), así que sumamos 1
                const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                const año = fecha.getFullYear();
                
                // Sobrescribimos o creamos una nueva propiedad para el frontend
                empleado.fecha_ingreso = `${dia}/${mes}/${año}`;
            }
            return empleado;
        });

        return empleadosFormateados;
    } catch (error) {
        console.error('Error obteniendo lista de empleados:', error);
        // Si falla, el requerimiento indica retornar un array vacío en vez de null
        return [];
    }
}

import { bancoPreguntas360, opciones360 } from './bancoPreguntas360.js';

export function obtenerCuestionario360() {
    return { bancoPreguntas360, opciones360 };
}

/**
 * Procesa el puntaje de la evaluación 360 en base a las respuestas de un evaluador.
 * Teniendo un máximo de 18 preguntas a 5 puntos c/u, el total máximo es 90.
 * @param {Object} respuestasCrudas - Las respuestas recogidas en el Frontend.
 * @param {string} evaluador - Tipo de evaluador, ej. "Colega", "Superior", "Autoevaluación".
 * @returns {Object} Un objeto con el desglose, el puntaje total, porcentaje y estado sugerido.
 */
export function procesarEvaluacion360(respuestasCrudas, evaluador) {
    let scoreTotal = 0;
    const desglosePorCategoria = {};

    // 1. Inicializar el desglose
    bancoPreguntas360.forEach(categoriaObj => {
        desglosePorCategoria[categoriaObj.categoria] = { obtenido: 0, maximo: 0 };
        
        categoriaObj.preguntas.forEach(pregunta => {
            // El máximo valor posible en las opciones 360 es 5
            const maxValor = Math.max(...opciones360.map(op => op.valor));
            desglosePorCategoria[categoriaObj.categoria].maximo += maxValor;

            const respuestaDadaTexto = respuestasCrudas[pregunta.id];
            if (respuestaDadaTexto) {
                // Buscamos cuánto vale la opción de texto elegida
                const opcionEncontrada = opciones360.find(op => op.texto === respuestaDadaTexto);
                if (opcionEncontrada) {
                    scoreTotal += opcionEncontrada.valor;
                    desglosePorCategoria[categoriaObj.categoria].obtenido += opcionEncontrada.valor;
                }
            }
        });
    });

    const maximoTeorico = 90; // 18 preguntas * 5
    const puntajePonderadoDecimal = scoreTotal / maximoTeorico; 
    const porcentajeGlobal = puntajePonderadoDecimal * 100;

    let statusSugerido = "Despido / Plan de Mejora";

    if (porcentajeGlobal >= 85) {
        statusSugerido = "Ascenso Recomendado";

        // Validar el Red Flag del caso Premium Consultores
        const puntajeTrabajoEquipo = desglosePorCategoria["Trabajo en Equipo"]?.obtenido || 0;
        const maxTrabajoEquipo = desglosePorCategoria["Trabajo en Equipo"]?.maximo || 1; // Para evitar división por cero
        
        // Si saca menos del 50% en trabajo en equipo, se bloquea el ascenso automático
        if ((puntajeTrabajoEquipo / maxTrabajoEquipo) < 0.5) {
            statusSugerido = "Mantener Posición (Alerta de Actitud)";
        }
    } else if (porcentajeGlobal >= 65) {
        statusSugerido = "Mantener Posición";
    }

    return {
        evaluador: evaluador || "No especificado",
        puntaje_total: scoreTotal,
        puntaje_ponderado: Number(puntajePonderadoDecimal.toFixed(2)),
        status: statusSugerido,
        desglose: desglosePorCategoria,
        respuestas_crudas: respuestasCrudas
    };
}

/**
 * 3. Actualizar la Evaluación del Empleado y guardarlo en la Base de Datos.
 * En caso de no tener evaluaciones previas se crea el Array. 
 * Si ya tiene, se hace un .push con la nueva evaluación.
 * @param {string} empleadoId - UUID del empleado
 * @param {Object} respuestasCrudas - Respuestas del formulario
 * @param {string} evaluador - Tipo de evaluador
 */
export async function guardarEvaluacion360(empleadoId, respuestasCrudas, evaluador) {
    if (!empleadoId || !respuestasCrudas) return { success: false, error: 'Requisitos faltantes' };

    try {
        // 1. Procesar la nueva evaluación
        const nuevaEvaluacion = procesarEvaluacion360(respuestasCrudas, evaluador);

        // 2. Traer el historial previo de evaluaciones del empleado
        const { data: empleadoData, error: fetchError } = await supabase
            .from('empleado')
            .select('respuestas_evaluacion360')
            .eq('id', empleadoId)
            .single();

        if (fetchError) throw fetchError;

        let historial = empleadoData.respuestas_evaluacion360;
        
        // 3. Evaluar si es null/undefined o si no es un array, crear uno nuevo
        if (!historial || !Array.isArray(historial)) {
            historial = [];
        }

        // 4. Agregar la nueva evaluación al historial
        historial.push(nuevaEvaluacion);

        // 5. Calcular el nuevo promedio general (puntuacion_general) usando .reduce()
        const sumaPonderados = historial.reduce((acc, evalItem) => acc + evalItem.puntaje_ponderado, 0);
        const nuevoPromedio = sumaPonderados / historial.length;

        // 5.1. Determinar el estado 'revisado' basado en el statusSugerido de la evaluación final del array
        // (Usamos el status global basado en el nuevo promedio)
        const porcentajeGlobal = nuevoPromedio * 100; // nuevoPromedio ya es un decimal (ej. 0.94)
        let estadoRevisado = "Despedido";

        if (porcentajeGlobal >= 85) {
            estadoRevisado = "Ascendido";
            // Validar Red Flag general sobre del historico (opcional: o solo de la nuevaEval)
            // Por simplicidad usaremos el estatus sugerido de la *nueva evaluación* para dictaminar el nuevo estado
            if (nuevaEvaluacion.status === "Mantener Posición (Alerta de Actitud)") {
                 estadoRevisado = "Revisado";
            }
        } else if (porcentajeGlobal >= 65) {
            estadoRevisado = "Revisado";
        }

        // 6. Inyectar de vuelta en la BD (Update)
        // Intentamos primero CON fecha_ultima_evaluacion; si la columna no existe, reintentamos sin ella
        let registroActualizado = null;
        const payload = { 
            respuestas_evaluacion360: historial,
            puntuacion_general: Number(nuevoPromedio.toFixed(2)),
            revisado: estadoRevisado,
            fecha_ultima_evaluacion: new Date().toISOString()
        };

        const { data: data1, error: err1 } = await supabase
            .from('empleado')
            .update(payload)
            .eq('id', empleadoId)
            .select();

        if (err1) {
            console.warn('Update con fecha_ultima_evaluacion falló, reintentando sin ella:', err1.message);
            // Fallback: sin la columna nueva
            const { respuestas_evaluacion360, puntuacion_general, revisado } = payload;
            const { data: data2, error: err2 } = await supabase
                .from('empleado')
                .update({ respuestas_evaluacion360, puntuacion_general, revisado })
                .eq('id', empleadoId)
                .select();

            if (err2) {
                console.error('Error real de Supabase al actualizar empleado:', err2);
                return { success: false, error: err2.message || 'Fallo al inyectar evaluación en empleado' };
            }
            registroActualizado = data2;
        } else {
            registroActualizado = data1;
        }

        return { success: true, data: registroActualizado && registroActualizado.length > 0 ? registroActualizado[0] : null };
    } catch (error) {
        console.error('Error procesando la evaluación 360:', error);
        return { success: false, error };
    }
}

/**
 * 4. Busca un único empleado en la BD mediante su cédula para la barra de búsqueda.
 */
export async function buscarEmpleadosPorCedula(cedula) {
    if (!cedula) return null;

    try {
        const cedulaNumerica = Number(String(cedula).replace(/\D/g, ''));
        const { data, error } = await supabase
            .from('empleado')
            .select('*')
            .eq('cedula', cedulaNumerica)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') throw error; // PGRST116 = 0 rows
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error buscando empleado por cédula:', error);
        return null;
    }
}

/**
 * 5. Elimina un empleado de la Base de datos (Despido).
 * Requiere que el campo 'revisado' del empleado sea "Despedido" basado en su última evaluación 360.
 */
export async function eliminarEmpleado(empleadoId) {
    if (!empleadoId) return { success: false, error: "ID no provisto" };

    try {
        // 1. Validar pre-requisito
        const { data: emp, error: fetchErr } = await supabase
            .from('empleado')
            .select('revisado')
            .eq('id', empleadoId)
            .single();

        if (fetchErr) throw fetchErr;

        if (emp.revisado !== 'Despedido') {
            return { success: false, error: 'Acción bloqueada: El empleado no cumple con el estado "Despedido".' };
        }

        // 2. Ejecutar borrado
        const { error } = await supabase
            .from('empleado')
            .delete()
            .eq('id', empleadoId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error eliminando al empleado:', error);
        return { success: false, error };
    }
}

/**
 * 6. Promover a un empleado, asignando un nuevo cargo, nuevo salario y cambiando
 *    su estatus de revisión a 'Ascenso'.
 * Requiere que el campo 'revisado' del empleado sea "Ascendido"
 * @param {string} empleadoId - UUID del empleado
 * @param {string} nuevoCargo - Nuevo cargo asignado (ej. "Director General")
 * @param {number|string} nuevoSalario - Nuevo salario asignado (ej. 2500)
 */
export async function promoverEmpleado(empleadoId, nuevoCargo = "Director General", nuevoSalario = 2500) {
    if (!empleadoId || !nuevoCargo || nuevoSalario === undefined) {
        return { success: false, error: 'Faltan parámetros requeridos para la promoción.' };
    }

    const salarioFinal = Number(nuevoSalario);
    if (isNaN(salarioFinal)) {
        return { success: false, error: 'El salario debe ser de tipo numérico.' };
    }

    try {
        // 1. Obtener y validar el pre-requisito
        const { data: emp, error: fetchErr } = await supabase
            .from('empleado')
            .select('revisado')
            .eq('id', empleadoId)
            .single();

        if (fetchErr) throw fetchErr;
        
        if (emp.revisado !== 'Ascendido') {
            return { success: false, error: 'Acción bloqueada: El empleado no cumple con el estado "Ascendido".' };
        }

        // 2. Proceder con el update de Promoción
        const { data, error } = await supabase
            .from('empleado')
            .update({
                cargo: nuevoCargo,
                salario: salarioFinal,
                revisado: 'Pendiente'  // Reinicia el ciclo de evaluación tras la promoción
            })
            .eq('id', empleadoId)
            .select();

        if (error) throw error;

        return { success: true, data: data && data.length > 0 ? data[0] : null };
    } catch (error) {
        console.error('Error promoviendo al empleado:', error);
        return { success: false, error };
    }
}
