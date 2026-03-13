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
 * Obtiene los datos clave del último empleado que haya sido ascendido
 * para poblar el gráfico estructurado en el Frontend.
 * 
 * @returns {Promise<Object|null>} Objeto con { nombre, objetivo, promedioGeneral, puntajeSuperior } o null.
 */
export async function obtenerDatosUltimoAscenso() {
    try {
        // 1. Obtener el último empleado con estatus "Ascenso"
        const { data, error } = await supabase
            .from('empleado')
            .select('*')
            .eq('revisado', 'Ascenso')
            .order('id', { ascending: false }) // Asume que 'id' es autoincremental, si es UUIDv4 ajusta por fecha_ingreso
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // 2. No se encontraron resultados (0 ascensos en la BD)
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
            objetivo: 85, // Meta fija del 85% para ascenso recomendado
            promedioGeneral: promedioGeneralPorcentaje,
            puntajeSuperior: puntajeSuperiorPorcentaje
        };

    } catch (error) {
        console.error('Error al obtener los datos del último ascenso:', error);
        return null;
    }
}
