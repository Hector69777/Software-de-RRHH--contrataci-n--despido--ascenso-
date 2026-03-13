import { useState } from "react";
// @ts-ignore
import { bancoPreguntas360, opciones360 } from "../lib/backend/bancoPreguntas360.js";
import { evaluarEmpleado360, type EmpleadoData } from "../supabase";

interface Evaluation360ModalProps {
    empleado: EmpleadoData;
    onClose: () => void;
    onSuccess: () => void;
}

const EVALUADORES = ["Superior", "Colega", "Subordinado", "Autoevaluación", "Cliente"];

export default function Evaluation360Modal({
    empleado,
    onClose,
    onSuccess,
}: Evaluation360ModalProps) {
    const [respuestas, setRespuestas] = useState<Record<string, string>>({});
    const [evaluador, setEvaluador] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalPreguntas = bancoPreguntas360.reduce((acc: number, cat: any) => acc + cat.preguntas.length, 0);
    const respondidas = Object.keys(respuestas).length;

    const handleSubmit = async () => {
        if (!evaluador) {
            setError("Por favor seleccione su rol como evaluador.");
            return;
        }

        if (respondidas < totalPreguntas) {
            setError("Por favor responda todas las preguntas antes de continuar.");
            return;
        }

        setSubmitting(true);
        const result = await evaluarEmpleado360(
            empleado.id,
            respuestas,
            evaluador
        );
        setSubmitting(false);

        if (result.success) {
            onSuccess();
            onClose();
        } else {
            console.error("Error evaluacion 360:", result);
            setError(result.message || String(result.error) || "Error al guardar la evaluación 360.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div>
                        <h2 className="text-lg font-bold text-slate-100">
                            Evaluación 360°
                        </h2>
                        <p className="text-sm text-slate-400">
                            {empleado.nombre} · {empleado.cargo || "Sin Cargo"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 pt-4 pb-4 space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-blue-400 block mb-2">
                            Rol del Evaluador
                        </label>
                        <select 
                            value={evaluador}
                            onChange={(e) => setEvaluador(e.target.value)}
                            className="w-full border border-slate-600 rounded-md px-3 py-2 text-sm bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled className="bg-slate-700">Seleccione su rol...</option>
                            {EVALUADORES.map((ev) => (
                                <option key={ev} value={ev} className="bg-slate-700">{ev}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progreso del Cuestionario</span>
                        <span>
                            {respondidas} / {totalPreguntas}
                        </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{
                                width: `${(respondidas / totalPreguntas) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-y-auto px-6 py-4 space-y-8 flex-1">
                    {bancoPreguntas360.map((categoriaObj: any) => (
                        <div key={categoriaObj.categoria}>
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-4 border-b border-slate-700 pb-2">
                                {categoriaObj.categoria}
                            </h3>
                            <div className="space-y-6">
                                {categoriaObj.preguntas.map((pregunta: any) => (
                                    <div key={pregunta.id}>
                                        <p className="text-sm text-slate-200 mb-3">
                                            {pregunta.texto}
                                        </p>

                                        <div className="space-y-2">
                                            {opciones360.map((opcion: any) => {
                                                const selected = respuestas[pregunta.id] === opcion.texto;
                                                return (
                                                    <label
                                                        key={opcion.texto}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm
                                                        ${
                                                            selected
                                                                ? "border-blue-500 bg-blue-500/10 text-slate-100"
                                                                : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={pregunta.id}
                                                            value={opcion.texto}
                                                            checked={selected}
                                                            onChange={() =>
                                                                setRespuestas((prev) => ({
                                                                    ...prev,
                                                                    [pregunta.id]: opcion.texto,
                                                                }))
                                                            }
                                                            className="accent-blue-500"
                                                        />
                                                        {opcion.texto}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-4 border-t border-slate-700 space-y-3">
                    {error && (
                        <p className="text-red-400 text-xs text-center border border-red-900/50 bg-red-900/20 py-2 rounded">
                            {error}
                        </p>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                        >
                            {submitting ? "Guardando..." : "Guardar Evaluación 360°"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
