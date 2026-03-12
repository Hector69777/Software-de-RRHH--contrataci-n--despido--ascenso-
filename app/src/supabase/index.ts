import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";
import { bancoPreguntas } from "../lib/bank-questions";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface CandidateData {
    cedula: string;
    nombre: string;
    telefono: string;
    cv_url: string | null;
    departamento_deseado: string;
    anos_experiencia: number;
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

export async function insertarCandidato(
    candidatoData: CandidateData,
): Promise<OperationResult> {
    try {
        const { data, error } = await supabase
            .from("candidatos")
            .insert([candidatoData])
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error insertando candidato:", error);
        return { success: false, error };
    }
}

export async function subirCV(
    file: File,
    cedula: string,
): Promise<string | null> {
    if (!file || file.size === 0) return null;

    try {
        const fileExt = file.name.split(".").pop();
        const filePath = `imagenes_cv/${cedula}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("cvs")
            .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("cvs").getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error("Error subiendo CV:", error);
        return null;
    }
}

export async function registrarCandidato(
    formData: Omit<CandidateData, "cv_url"> & { cv: FileList },
): Promise<OperationResult> {
    try {
        const cvFile = formData.cv?.[0] ?? null;
        const cv_url = cvFile ? await subirCV(cvFile, formData.cedula) : null;

        if (cvFile && !cv_url)
            return { success: false, error: "No se pudo subir el CV." };

        return await insertarCandidato({ ...formData, cv_url });
    } catch (error) {
        console.error("Error registrando candidato:", error);
        return { success: false, error };
    }
}

export async function obtenerListaCandidatos(): Promise<
    CandidateData[] | null
> {
    try {
        const { data, error } = await supabase
            .from("candidatos")
            .select(
                `id, cedula, nombre, telefono, cv_url, departamento_deseado, anos_experiencia, formacion, fecha_registro, estado, respuestas_evaluacion`,
            )
            .order("fecha_registro", { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error obteniendo lista de candidatos:", error);
        return null;
    }
}

export function calcularScoreIngreso(
    respuestasCandidato: Record<string, string>,
): ScoreResult {
    let scoreTotal = 0;
    let scoreMaximoPosible = 0;
    const desglosePorCategoria: Record<string, CategoryScore> = {};

    bancoPreguntas.forEach((pregunta) => {
        if (!desglosePorCategoria[pregunta.categoria]) {
            desglosePorCategoria[pregunta.categoria] = {
                obtenido: 0,
                maximo: 0,
            };
        }
    });

    bancoPreguntas.forEach((pregunta) => {
        if (pregunta.tipo === "abierta") return;

        const valorMaximoPregunta = Math.max(
            ...pregunta.opciones.map((op) => op.valor),
        );
        scoreMaximoPosible += valorMaximoPregunta;
        desglosePorCategoria[pregunta.categoria].maximo += valorMaximoPregunta;

        const respuestaDada = respuestasCandidato[pregunta.id];
        if (respuestaDada) {
            const opcionDada = pregunta.opciones.find(
                (op) => op.texto === respuestaDada,
            );
            if (opcionDada) {
                scoreTotal += opcionDada.valor;
                desglosePorCategoria[pregunta.categoria].obtenido +=
                    opcionDada.valor;
            }
        }
    });

    const porcentaje =
        scoreMaximoPosible > 0
            ? parseFloat(((scoreTotal / scoreMaximoPosible) * 100).toFixed(2))
            : 0;

    const status: ScoreResult["status"] =
        porcentaje >= 85
            ? "Recomendado"
            : porcentaje >= 65
              ? "Observación"
              : "No Recomendado";

    return {
        puntaje_total: scoreTotal,
        puntaje_maximo: scoreMaximoPosible,
        porcentaje_compatibilidad: porcentaje,
        status,
        desglose: desglosePorCategoria,
    };
}

export async function guardarEvaluacionCandidato(
    cedula: string,
    resultados: ScoreResult,
): Promise<CandidateData | null> {
    try {
        const { data, error } = await supabase
            .from("candidatos")
            .update({ respuestas_evaluacion: resultados, estado: "Evaluado" })
            .eq("cedula", cedula)
            .select();

        if (error) throw error;
        return data?.length > 0 ? data[0] : null;
    } catch (error) {
        console.error("Error guardando respuestas de evaluación:", error);
        return null;
    }
}

export async function actualizarEvaluacionCandidato(
    cedula: string,
    respuestasCrudas: Record<string, string>,
) {
    try {
        const resultadosCalculados = calcularScoreIngreso(respuestasCrudas);
        resultadosCalculados.respuestas_crudas = respuestasCrudas;

        const registroActualizado = await guardarEvaluacionCandidato(
            cedula,
            resultadosCalculados,
        );

        if (registroActualizado) {
            return { success: true, data: registroActualizado };
        } else {
            console.error("No se pudo guardar la evaluación en Supabase.");
            return {
                success: false,
                error: "Fallo al actualizar el registro en BD",
            };
        }
    } catch (error) {
        console.error("Error al actualizar evaluación del candidato:", error);
        return { success: false, error };
    }
}

export async function buscarCandidatoPorCedula(
    cedula: string,
): Promise<CandidateData | null> {
    try {
        const { data, error } = await supabase
            .from("candidatos")
            .select(
                `id, cedula, nombre, telefono, cv_url, departamento_deseado, anos_experiencia, formacion, fecha_registro, estado, respuestas_evaluacion`,
            )
            .eq("cedula", cedula)
            .single();

        if (error) {
            if (error.code !== "PGRST116") throw error;
            return null;
        }

        return data;
    } catch (error) {
        console.error("Error buscando candidato por cédula:", error);
        return null;
    }
}

export async function eliminarCandidatoPorCedula(
    cedula: string,
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("candidatos")
            .delete()
            .eq("cedula", cedula);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error eliminando candidato:", error);
        return false;
    }
}
