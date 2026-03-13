import { supabase } from './supabase.js';
import { bancoPreguntas } from './bancoPreguntas.js';

/**
 * Inserta un nuevo candidato en la base de datos de Supabase.
 * @param {Object} candidatoData 
 * @returns {Promise<Object>} El resultado de la operación
 */
export async function insertarCandidato(candidatoData) {
    try {
        const { data, error } = await supabase
            .from('candidatos')
            .insert([{
                cedula: candidatoData.cedula,
                nombre: candidatoData.nombre,
                telefono: candidatoData.telefono,
                cv_url: candidatoData.cv_url,
                departamento_deseado: candidatoData.departamento_deseado,
                años_experiencia: candidatoData.años_experiencia,
                formacion: candidatoData.formacion
            }])
            .select();

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error insertando candidato:', error);
        return { success: false, error };
    }
}

/**
 * Sube el archivo CV (imagen o PDF) al bucket 'cvs' de Supabase Storage.
 * @param {File} file - El archivo a subir
 * @param {string} cedula - La cédula del candidato para nombrar el archivo
 * @returns {Promise<string|null>} - La URL pública del archivo, o null si falla
 */
export async function subirCV(file, cedula) {
    if (!file || file.size === 0) return null;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${cedula}_${Date.now()}.${fileExt}`;
        const filePath = `imagenes_cv/${fileName}`;

        // Subir al bucket (asegúrate de que exista en Supabase un bucket llamado 'cvs' que sea público)
        const { error: uploadError } = await supabase.storage
            .from('cvs')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obtener la URL pública
        const { data } = supabase.storage
            .from('cvs')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error subiendo CV:', error);
        return null;
    }
}

/**
 * Recibe un formulario HTML, extrae sus datos, sube el CV si existe, convierte años_experiencia y llama a insertarCandidato()
 * @param {HTMLFormElement} formElement 
 * @returns {Promise<boolean>} true si fue exitoso, false si falló
 */
export async function procesarFormularioCandidato(formElement) {
    try {
        const formData = new FormData(formElement);

        const cedula = formData.get('cedula');
        const cvFile = formData.get('cv'); // Asegúrate que el input de archivo tenga name="cv"

        // 1 y 2) Subir el archivo mediante subirCV() y esperar la URL pública
        let url_publica_cv = null;
        if (cvFile && cvFile.size > 0) {
            url_publica_cv = await subirCV(cvFile, cedula);

            if (!url_publica_cv) {
                console.error('Error: No se pudo obtener la URL pública del CV al intentar subirlo.');
                return false; // Fallar tempranamente si no se pudo subir el archivo
            }
        } else {
            url_publica_cv = formData.get('cv_url'); // Fallback si pasan la URL directamente como texto
        }

        // 3) Solo cuando tengamos la URL, construir el objeto candidatoData incluyéndola
        const candidatoData = {
            cedula: cedula,
            nombre: formData.get('nombre'),
            telefono: formData.get('telefono'),
            cv_url: url_publica_cv,
            departamento_deseado: formData.get('departamento_deseado'),
            años_experiencia: parseInt(formData.get('años_experiencia'), 10),
            formacion: formData.get('formacion')
        };

        // 4) Llamar a insertarCandidato()
        const resultado = await insertarCandidato(candidatoData);

        return resultado.success;
    } catch (error) {
        console.error('Error procesando formulario:', error);
        return false;
    }
}

/**
 * Obtiene la lista parcial de candidatos (excluyendo la evaluación de ingreso y campos pesados como respuestas_evaluacion),
 * ordenada por fecha de registro descendente.
 * @returns {Promise<Array|null>} Array con los datos de los candidatos o null si hay error.
 */
export async function obtenerListaCandidatos() {
    try {
        const { data, error } = await supabase
            .from('candidatos')
            .select(`
                id,
                cedula,
                nombre,
                telefono,
                cv_url,
                departamento_deseado,
                años_experiencia,
                formacion,
                fecha_registro,
                estado
            `)
            .order('fecha_registro', { ascending: false });

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error obteniendo lista de candidatos:', error);
        return null;
    }
}

/**
 * Motor de Calificación Automática: Evalúa las respuestas proporcionadas por el candidato
 * frente al banco de preguntas y calcula un "Puntaje de Compatibilidad" global y desglosado.
 * @param {Object} respuestasCandidato - Objeto donde las claves son los IDs de pregunta (ej. 'fin_01') 
 * y los valores son los textos seleccionados de las opciones de respuesta.
 * @returns {Object} Un objeto con el desglose de puntajes por categoría, puntaje total, puntaje máximo posible y porcentaje.
 */
export function calcularScoreIngreso(respuestasCandidato) {
    let scoreTotal = 0;
    let scoreMaximoPosible = 0;
    const desglosePorCategoria = {};

    // Inicializar desglose
    bancoPreguntas.forEach(pregunta => {
        if (!desglosePorCategoria[pregunta.categoria]) {
            desglosePorCategoria[pregunta.categoria] = { obtenido: 0, maximo: 0 };
        }
    });

    bancoPreguntas.forEach(pregunta => {
        // Obviamos preguntas abiertas del cálculo matemático puro
        if (pregunta.tipo === 'abierta') return;
        
        // Sumamos el máximo posible de esta pregunta al total
        // Asumiendo que las opciones siempre están ordenadas o buscamos el valor máximo
        const valorMaximoPregunta = Math.max(...pregunta.opciones.map(op => op.valor));
        scoreMaximoPosible += valorMaximoPregunta;
        desglosePorCategoria[pregunta.categoria].maximo += valorMaximoPregunta;

        // Buscar qué respondió el candidato
        const respuestaDada = respuestasCandidato[pregunta.id];
        
        if (respuestaDada) {
            // Encontrar el valor asociado a esa respuesta en el banco
            const opcionDada = pregunta.opciones.find(op => op.texto === respuestaDada);
            if (opcionDada) {
                const valorObtenido = opcionDada.valor;
                scoreTotal += valorObtenido;
                desglosePorCategoria[pregunta.categoria].obtenido += valorObtenido;
            }
        }
    });

    const porcentajeGlobal = scoreMaximoPosible > 0 
        ? ((scoreTotal / scoreMaximoPosible) * 100).toFixed(2) 
        : 0;

    const compatibilidadNumerica = parseFloat(porcentajeGlobal);
    let statusFormula = "No Recomendado";

    if (compatibilidadNumerica >= 85) {
        statusFormula = "Recomendado";
    } else if (compatibilidadNumerica >= 65) {
        statusFormula = "Observación";
    }

    return {
        puntaje_total: scoreTotal,
        puntajeMaximo: scoreMaximoPosible,
        porcentaje_compatibilidad: compatibilidadNumerica,
        status: statusFormula,
        desglose: desglosePorCategoria // Permite ver puntajes individuales por categoría  
    };
}

/**
 * Guarda los resultados de la evaluación del motor automático en el perfil del candidato.
 * Actualiza la columna respuestas_evaluacion (tipo JSONB) con el objeto generado.
 * @param {string} candidatoCedula - Cédula del candidato como identificador.
 * @param {Object} resultados - El objeto generado por calcularScoreIngreso().
 * @returns {Promise<boolean>} Retorna true si la actualización fue exitosa, false en caso contrario.
 */
export async function guardarEvaluacionCandidato(candidatoCedula, resultados) {
    if (!candidatoCedula || !resultados) return null;

    try {
        const { data, error } = await supabase
            .from('candidatos')
            .update({ 
                respuestas_evaluacion: resultados,
                estado: 'Evaluado'
            })
            .eq('cedula', String(candidatoCedula))
            .select();

        if (error) {
            throw error;
        }

        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error guardando respuestas de evaluación:', error);
        return null;
    }
}

/**
 * Obtiene el cuestionario de evaluación (banco de preguntas).
 * Ideal para ser llamado desde el Frontend al hacer clic en "Evaluar".
 * @returns {Array} El banco de preguntas en formato JSON.
 */
export function obtenerCuestionario() {
    return bancoPreguntas;
}

/**
 * Procesa las respuestas del formulario de evaluación, calcula el score
 * y guarda los resultados oficiales en la base de datos para el candidato indicado.
 * @param {string} candidatoId - El ID (UUID) del candidato que se está evaluando.
 * @param {Object} respuestasCrudas - Objeto con las respuestas de la prueba.
 * @returns {Promise<Object|null>} El objeto final de resultados o null si hubo error.
 */
export async function actualizarEvaluacionCandidato(candidatoId, respuestasCrudas) {
    if (!candidatoId || !respuestasCrudas) return { success: false, error: 'Requisitos faltantes' };

    try {
        // 1. Procesar respuestas y obtener el objeto completo con status y porcentajes
        const resultadosCalculados = calcularScoreIngreso(respuestasCrudas);

        // Además, podemos inyectar las respuestas puras para tener el registro completo
        resultadosCalculados.respuestas_crudas = respuestasCrudas;

        // 2. Inyectar en la base de datos usando la función de update
        const registroActualizado = await guardarEvaluacionCandidato(candidatoId, resultadosCalculados);

        if (registroActualizado) {
            return { success: true, data: registroActualizado };
        } else {
            console.error('No se pudo guardar la evaluación en Supabase.');
            return { success: false, error: 'Fallo al actualizar el registro en BD' };
        }
    } catch (error) {
        console.error('Error al actualizar evaluación del candidato:', error);
        return { success: false, error };
    }
}

/**
 * Función para contratar a un candidato evaluado.
 * Traslada los datos del candidato a la tabla empleado y actualiza el estado del candidato a "Contratado".
 * @param {Object} candidatoData - Objeto de datos del candidato que debe contener sus atributos y estado.
 * @param {string|null} cargoAsignado - Cargo que se le va a asignar en la tabla empleado (proveído por el usuario).
 * @param {number|string} salarioAsignado - Salario asigando (proveído por el usuario, default 0).
 * @returns {Promise<Object>} Resultado de la operación, indicando éxito o fracaso.
 */
export async function contratarCandidato(candidatoData, cargoAsignado, salarioAsignado = 0) {
    try {
        // 1. Validar que tengamos datos, el ID y que el estado sea el indicado
        if (!candidatoData || !candidatoData.id) {
            return { success: false, error: 'Faltan datos del candidato o su ID selector.' };
        }

        if (candidatoData.estado !== 'Evaluado') {
            return { success: false, error: 'El candidato seleccionado no se encuentra en estado Evaluado para ser contratado.' };
        }

        // 2. Crear mapeo para la tabla empleado
        // Ya que la BD exige NUMERIC para cedula y tlf, sanitizamos las cadenas eliminando caracteres no numéricos (ej. 'V-', guiones)
        const cedulaLimpia = candidatoData.cedula ? Number(String(candidatoData.cedula).replace(/\\D/g, '')) : null;
        const telefonoLimpio = candidatoData.telefono ? Number(String(candidatoData.telefono).replace(/\\D/g, '')) : null;
        
        const cargoFinal = cargoAsignado && cargoAsignado.trim() !== '' ? cargoAsignado.trim() : null;
        const salarioFinal = isNaN(Number(salarioAsignado)) ? 0 : Number(salarioAsignado);

        const nuevoEmpleado = {
            cedula: cedulaLimpia,
            nombre: candidatoData.nombre,
            cargo: cargoFinal,
            contratado: true,
            tlf: telefonoLimpio,
            departamento: candidatoData.departamento_deseado || candidatoData.departamento, // Por si cambian el nombre del key
            revisado: 'Pendiente',
            respuestas_evaluacion360: null,
            puntuacion_general: 0,
            salario: salarioFinal
        };

        // 3. Ejecutar Insert en tabla empleado primero
        const { error: insertError } = await supabase
            .from('empleado')
            .insert([nuevoEmpleado]);

        if (insertError) {
            throw insertError;
        }

        // Al finalizar exitosamente el Insert, ELIMINAMOS el registro de la tabla candidatos (traslado completo)
        const { error: updateError } = await supabase
            .from('candidatos')
            .delete()
            .eq('id', candidatoData.id);

        if (updateError) {
            console.warn('Alerta: Empleado creado, pero falló la eliminación/traslado en candidatos.', updateError);
            throw updateError; 
        }

        return { success: true, message: 'Candidato formalmente contratado e insertado como empleado exitosamente.' };

    } catch (error) {
        console.error('Error durante la contratación del candidato:', error);
        return { success: false, error };
    }
}

/**
 * Busca un único candidato en la base de datos utilizando su número de cédula.
 * @param {string} cedula - El número de cédula a buscar.
 * @returns {Promise<Object|null>} El objeto del candidato si existe, o null si no se encuentra o hay error.
 */
export async function buscarCandidatoPorCedula(cedula) {
    if (!cedula) return null;

    try {
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .eq('cedula', cedula)
            .single();

        if (error) {
            // Error con code 'PGRST116' significa que no encontró ninguna fila (es un Single result).
            // Lo manejamos retornando null sin ensuciar la consola con el error, a menos que sea un error diferente.
            if (error.code !== 'PGRST116') {
                throw error;
            }
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error buscando candidato por cédula:', error);
        return null;
    }
}

/**
 * Elimina a un candidato específico de la base de datos basándose en su ID.
 * Nota para MVP: Esta función elimina la fila en la tabla PostgreSQL 'candidatos', 
 * pero el archivo físico del CV en el bucket de Storage permanecerá allí y no será borrado.
 * @param {string} candidatoId - El UUID del candidato a eliminar.
 * @returns {Promise<boolean>} true si la eliminación fue exitosa, false en caso contrario.
 */
export async function eliminarCandidato(candidatoId) {
    if (!candidatoId) return false;

    try {
        const { error } = await supabase
            .from('candidatos')
            .delete()
            .eq('id', candidatoId);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Error eliminando candidato:', error);
        return false;
    }
}

/**
 * Búsqueda inteligente de candidatos usando la función RPC de PostgreSQL.
 * Busca coincidencias parciales (case-insensitive) en: cédula, nombre, departamento, formación, teléfono.
 * 
 * @param {string} termino - Texto a buscar
 * @returns {Promise<Array|null>} Lista de candidatos que coinciden
 */
export async function buscarCandidatos(termino) {
    if (!termino || termino.trim() === '') return null; // null = sin filtro, usar lista completa

    try {
        const { data, error } = await supabase
            .rpc('buscar_candidatos', { termino: termino.trim() });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error en búsqueda de candidatos:', error);
        return null;
    }
}
