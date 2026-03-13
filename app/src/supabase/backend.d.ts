// Declaraciones específicas para nuestros archivos de backend
declare module "../lib/backend/supabase.js" {
  export const supabase: any;
}

declare module "../lib/backend/api-candidatos.js" {
  export function insertarCandidato(candidatoData: any): Promise<any>;
  export function obtenerListaCandidatos(): Promise<any>;
  export function subirCV(file: any, cedula: any): Promise<any>;
  export function procesarFormularioCandidato(formData: any, cvFile: any): Promise<any>;
  export function eliminarCandidato(identificador: any): Promise<any>;
  export function actualizarEvaluacionCandidato(cedula: any, respuestasCrudas: any): Promise<any>;
  export function contratarCandidato(candidatoData: any, cargoAsignado: any, salarioAsignado: any): Promise<any>;
}

declare module "../lib/backend/api-empleados.js" {
  export function obtenerListaEmpleados(): Promise<any>;
  export function procesarEvaluacion360(respuestasCrudas: any, evaluador: any): any;
  export function guardarEvaluacion360(empleadoId: any, respuestasCrudas: any, evaluador: any): Promise<any>;
  export function buscarEmpleadosPorCedula(cedula: any): Promise<any>;
  export function eliminarEmpleado(empleadoId: any): Promise<any>;
  export function promoverEmpleado(empleadoId: any, nuevoCargo?: string, nuevoSalario?: number): Promise<any>;
}

declare module "../lib/backend/api-reportes.js" {
  export function obtenerEstadistica(): Promise<any>;
  export function obtenerDatosUltimoAscenso(): Promise<any>;
}
