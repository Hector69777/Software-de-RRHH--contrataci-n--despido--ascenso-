import { supabase } from './supabase.js';

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
 * Obtiene la lista completa de candidatos, ordenada por fecha de registro descendente.
 * @returns {Promise<Array|null>} Array con los datos de los candidatos o null si hay error.
 */
export async function obtenerListaCandidatos() {
    try {
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
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
