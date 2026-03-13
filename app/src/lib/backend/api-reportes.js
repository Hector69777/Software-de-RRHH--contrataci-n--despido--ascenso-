import { supabase } from './supabase.js';

/**
 * Obtiene las estadísticas generales del sistema realizando consultas optimizadas
 * que solo devuelven el conteo total (sin descargar los registros).
 * 
 * @returns {Promise<Object>} Un objeto con: total_candidatos, total_empleados, total_ascensos
 */
export async function obtenerEstadistica() {
    try {
        // 1. Total de candidatos en la tabla 'candidatos'
        const { count: countCandidatos, error: errCandidatos } = await supabase
            .from('candidatos')
            .select('*', { count: 'exact', head: true });

        if (errCandidatos) throw errCandidatos;

        // 2. Total de empleados (excluyendo a los despedidos)
        const { count: countEmpleados, error: errEmpleados } = await supabase
            .from('empleado')
            .select('*', { count: 'exact', head: true })
            .neq('revisado', 'Despedido'); // Excluimos los que fueron despedidos

        if (errEmpleados) throw errEmpleados;

        // 3. Total de ascensos (empleados promovidos, es decir revisado: 'Ascenso')
        const { count: countAscensos, error: errAscensos } = await supabase
            .from('empleado')
            .select('*', { count: 'exact', head: true })
            .eq('revisado', 'Ascenso');

        if (errAscensos) throw errAscensos;

        // Retornamos el consolidado
        return {
            success: true,
            data: {
                total_candidatos: countCandidatos || 0,
                total_empleados: countEmpleados || 0,
                total_ascensos: countAscensos || 0
            }
        };

    } catch (error) {
        console.error('Error obteniendo estadísticas generales:', error);
        return { 
            success: false, 
            error: error.message || error,
            data: {
                total_candidatos: 0,
                total_empleados: 0,
                total_ascensos: 0
            }
        };
    }
}

/**
 * Obtiene los datos clave del último empleado que haya sido evaluado
 * para poblar el gráfico estructurado en el Frontend.
 * 
 * @returns {Promise<Object|null>} Objeto con { nombre, estatus, promedioGeneral, puntajeSuperior } o null.
 */
export async function obtenerDatosUltimoEvaluado() {
    try {
        // 1. Obtener el último empleado que ya tenga una puntuacion general (evaluado)
        const { data, error } = await supabase
            .from('empleado')
            .select('*')
            .not('puntuacion_general', 'is', null)
            .order('fecha_ultima_evaluacion', { ascending: false }) 
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
                return null; // No hay evaluaciones aún
            }
            throw error;
        }

        const empleado = data;

        // 3. Extraer el promedio global (convertido a porcentaje entero)
        const puntuacionGeneral = empleado.puntuacion_general || 0;
        const promedioGeneralPorcentaje = Number((puntuacionGeneral * 100).toFixed(0));

        // 4. Buscar la evaluación específica del Jefe / Superior
        let puntajeSuperiorPonderado = 0;
        
        if (empleado.respuestas_evaluacion360 && Array.isArray(empleado.respuestas_evaluacion360)) {
            const evaSuperior = empleado.respuestas_evaluacion360.find(
                evaluacion => evaluacion.evaluador === 'Superior'
            );
            if (evaSuperior) {
                puntajeSuperiorPonderado = evaSuperior.puntaje_ponderado || 0;
            }
        }
        
        const puntajeSuperiorPorcentaje = Number((puntajeSuperiorPonderado * 100).toFixed(0));

        // 5. Retornar el objeto estructurado
        return {
            nombre: empleado.nombre,
            estatus: empleado.revisado, // ej: "Ascendido", "Despedido", "Revisado"
            objetivo: 85, // Meta ideal
            promedioGeneral: promedioGeneralPorcentaje,
            puntajeSuperior: puntajeSuperiorPorcentaje
        };

    } catch (error) {
        console.error('Error al obtener los datos de la última evaluación:', error);
        return null;
    }
}
