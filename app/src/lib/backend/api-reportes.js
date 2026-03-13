import { supabase } from './supabase.js';

/**
 * Perfil meta de competencias para el cargo de Director General.
 * Cada valor representa el porcentaje mínimo esperado en esa competencia.
 */
const perfilMetaDirectorGeneral = {
    "Liderazgo": 95,
    "Comunicación": 90,
    "Trabajo en Equipo": 85,
    "Competencia Técnica": 80,
    "Resolución de Problemas": 85,
    "Integridad y Compromiso": 95
};

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
        
        // 5. Calcular el desglose promedio por categoría (promediando todas las evaluaciones del historial)
        const categoriasAgregadas = {};

        if (empleado.respuestas_evaluacion360 && Array.isArray(empleado.respuestas_evaluacion360)) {
            const evaSuperior = empleado.respuestas_evaluacion360.find(
                evaluacion => evaluacion.evaluador === 'Superior'
            );
            if (evaSuperior) {
                puntajeSuperiorPonderado = evaSuperior.puntaje_ponderado || 0;
            }

            // Recorrer cada evaluación y acumular los desgloses
            empleado.respuestas_evaluacion360.forEach(evaluacion => {
                if (evaluacion.desglose && typeof evaluacion.desglose === 'object') {
                    Object.entries(evaluacion.desglose).forEach(([categoria, valores]) => {
                        if (!categoriasAgregadas[categoria]) {
                            categoriasAgregadas[categoria] = { sumaObtenido: 0, sumaMaximo: 0, count: 0 };
                        }
                        categoriasAgregadas[categoria].sumaObtenido += (valores.obtenido || 0);
                        categoriasAgregadas[categoria].sumaMaximo += (valores.maximo || 1);
                        categoriasAgregadas[categoria].count += 1;
                    });
                }
            });
        }
        
        const puntajeSuperiorPorcentaje = Number((puntajeSuperiorPonderado * 100).toFixed(0));

        // Convertir a un array de objetos con porcentaje final por categoría + meta del perfil
        const desgloseCategorias = Object.entries(categoriasAgregadas).map(([categoria, datos]) => ({
            categoria,
            porcentaje: datos.sumaMaximo > 0 
                ? Number(((datos.sumaObtenido / datos.sumaMaximo) * 100).toFixed(0)) 
                : 0,
            meta: perfilMetaDirectorGeneral[categoria] || 85
        }));

        // 6. Retornar el objeto estructurado
        return {
            nombre: empleado.nombre,
            estatus: empleado.revisado,
            objetivo: 85,
            promedioGeneral: promedioGeneralPorcentaje,
            puntajeSuperior: puntajeSuperiorPorcentaje,
            desgloseCategorias // Nuevo: array con { categoria, porcentaje }
        };

    } catch (error) {
        console.error('Error al obtener los datos de la última evaluación:', error);
        return null;
    }
}

/**
 * Marca a un empleado como prioridad para el reporte,
 * actualizando su fecha_ultima_evaluacion a NOW.
 * Esto hace que aparezca como el empleado activo en el Dashboard de Reportes.
 * 
 * @param {string} empleadoId - UUID del empleado
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export async function marcarParaReporte(empleadoId) {
    if (!empleadoId) return { success: false, error: 'ID de empleado requerido' };
    
    try {
        const { error } = await supabase
            .from('empleado')
            .update({ fecha_ultima_evaluacion: new Date().toISOString() })
            .eq('id', empleadoId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error marcando empleado para reporte:', error);
        return { success: false, error: error.message || 'Error desconocido' };
    }
}
