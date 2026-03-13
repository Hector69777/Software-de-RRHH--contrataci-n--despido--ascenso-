// @ts-ignore
import { supabase } from "../lib/backend/supabase.js";
// @ts-ignore
import { insertarCandidato as bgInsertarCandidato, obtenerListaCandidatos as bgObtenerListaCandidatos, subirCV as bgSubirCV, procesarFormularioCandidato as bgRegistrarCandidato, eliminarCandidato as bgEliminarCandidato, actualizarEvaluacionCandidato as bgActualizarEvaluacionCandidato, contratarCandidato as bgContratarCandidato } from "../lib/backend/api-candidatos.js";

// Export the base client just in case UI needs pure auth or storage directly
export { supabase };

// ---------------------------------------------------------
// TypeScript Interfaces (Kept intact to satisfy UI types)
// ---------------------------------------------------------
export interface CandidateData {
    cedula: string;
    nombre: string;
    telefono: string;
    cv_url: string | null;
    departamento_deseado: string;
    anos_experiencia: number; // Mapped dynamically in JS if needed
    formacion: string;
    respuestas_evaluacion: ScoreResult | null;
    estado: "Pendiente" | "Evaluado" | "Contratado";
}

export interface OperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: unknown;
    message?: string;
}

export interface CategoryScore {
    obtenido: number;
    maximo: number;
}

export interface ScoreResult {
    puntaje_total: number;
    puntaje_maximo: number;
    porcentaje_compatibilidad: number;
    status: "Recomendado" | "Observación" | "No Recomendado";
    desglose: Record<string, CategoryScore>;
    respuestas_crudas?: Record<string, string>;
}

// ---------------------------------------------------------
// Wrappers acting as an API bridge to our pure JS Backend
// ---------------------------------------------------------

export async function insertarCandidato(candidatoData: CandidateData): Promise<OperationResult> {
    const res = await bgInsertarCandidato(candidatoData);
    if (!res) return { success: false, error: 'Network Error' };
    return { success: true, data: res };
}

export async function subirCV(file: File, cedula: string): Promise<string | null> {
    return await bgSubirCV(file, cedula);
}

export async function registrarCandidato(formData: Omit<CandidateData, "cv_url"> & { cv: FileList }): Promise<OperationResult> {
    const cvFile = formData.cv?.[0] ?? null;
    let cv_url: string | null = null;
    
    // 1. Upload CV if it exists using the native Backend function
    if (cvFile && cvFile.size > 0) {
        cv_url = await bgSubirCV(cvFile, formData.cedula);
        if (!cv_url) {
             console.error("DEBUG: Failed to upload CV via bgSubirCV");
             return { success: false, error: "No se pudo subir el CV." };
        }
    }

    // 2. Prepare Payload for Insertion
    const candidatoData = {
        cedula: formData.cedula,
        nombre: formData.nombre,
        telefono: formData.telefono,
        cv_url: cv_url,
        departamento_deseado: formData.departamento_deseado,
        años_experiencia: Number(formData.anos_experiencia), // Important: map anos_experiencia to años_experiencia as expected by DB
        formacion: formData.formacion
    };
    
    console.log("DEBUG Payload Sent to insert:", candidatoData);

    // 3. Delegate to Backend Insert API
    const result = await bgInsertarCandidato(candidatoData);
    
    if (!result || !result.success) {
        console.error("DEBUG DB Insert Failed. Result object:", result);
        return { success: false, error: result?.error || "Error al insertar candidato", message: result?.error?.message || "Unknown db error" };
    }
    
    return { success: true, data: result.data };
}

export async function obtenerListaCandidatos(): Promise<CandidateData[] | null> {
    return await bgObtenerListaCandidatos();
}

/**
 * Wrapper to update evaluation using the JS calculations
 */
export async function actualizarEvaluacionCandidato(cedula: string, respuestasCrudas: Record<string, string>) {
    return await bgActualizarEvaluacionCandidato(cedula, respuestasCrudas);
}

/**
 * Wrapper to delete candidates
 */
export async function eliminarCandidatoPorCedula(cedula: string): Promise<boolean> {
    // The previous frontend expected a boolean return true/false
    const result = await bgEliminarCandidato({ cedula }); // Wrap it to extract id in the backend if needed or adjust later
    return !!result;
}

/**
 * Wrapper to Hire/Contratar candidate
 */
export async function contratarCandidato(candidatoData: CandidateData, cargoAsignado: string, salarioAsignado: number) {
    return await bgContratarCandidato(candidatoData, cargoAsignado, salarioAsignado);
}

