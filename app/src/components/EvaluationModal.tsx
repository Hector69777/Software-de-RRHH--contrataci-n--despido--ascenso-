import { useState } from "react";
import { bancoPreguntas } from "../lib/bank-questions";
import { actualizarEvaluacionCandidato, type CandidateData } from "../supabase";

interface EvaluacionModalProps {
    candidato: CandidateData;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EvaluationModal({
    candidato,
    onClose,
    onSuccess,
}: EvaluacionModalProps) {
    const [respuestas, setRespuestas] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categorias = [...new Set(bancoPreguntas.map((p) => p.categoria))];
    const totalPreguntas = bancoPreguntas.length;
    const respondidas = Object.keys(respuestas).length;

    const handleSubmit = async () => {
        if (respondidas < totalPreguntas) {
            setError(
                "Por favor responda todas las preguntas antes de continuar.",
            );
            return;
        }
        setSubmitting(true);
        const result = await actualizarEvaluacionCandidato(
            candidato.cedula,
            respuestas,
        );
        setSubmitting(false);
        if (result.success) {
            onSuccess();
            onClose();
        } else setError("Error al guardar la evaluación. Intente nuevamente.");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div>
                        <h2 className="text-lg font-bold text-slate-100">
                            Evaluación de Candidato
                        </h2>
                        <p className="text-sm text-slate-400">
                            {candidato.nombre} · {candidato.cedula}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 pt-4 pb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progreso</span>
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
                    {categorias.map((categoria) => (
                        <div key={categoria}>
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
                                {categoria}
                            </h3>
                            <div className="space-y-6">
                                {bancoPreguntas
                                    .filter((p) => p.categoria === categoria)
                                    .map((pregunta) => (
                                        <div key={pregunta.id}>
                                            <p className="text-sm text-slate-200 mb-3">
                                                {pregunta.pregunta}
                                            </p>

                                            {pregunta.tipo === "abierta" ? (
                                                <textarea
                                                    rows={3}
                                                    placeholder="Escriba su respuesta..."
                                                    value={
                                                        respuestas[
                                                            pregunta.id
                                                        ] ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        setRespuestas(
                                                            (prev) => ({
                                                                ...prev,
                                                                [pregunta.id]:
                                                                    e.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                />
                                            ) : (
                                                <div className="space-y-2">
                                                    {pregunta.opciones.map(
                                                        (opcion) => {
                                                            const selected =
                                                                respuestas[
                                                                    pregunta.id
                                                                ] ===
                                                                opcion.texto;
                                                            return (
                                                                <label
                                                                    key={
                                                                        opcion.texto
                                                                    }
                                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm
                                                                    ${
                                                                        selected
                                                                            ? "border-blue-500 bg-blue-500/10 text-slate-100"
                                                                            : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={
                                                                            pregunta.id
                                                                        }
                                                                        value={
                                                                            opcion.texto
                                                                        }
                                                                        checked={
                                                                            selected
                                                                        }
                                                                        onChange={() =>
                                                                            setRespuestas(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [pregunta.id]:
                                                                                        opcion.texto,
                                                                                }),
                                                                            )
                                                                        }
                                                                        className="accent-blue-500"
                                                                    />
                                                                    {
                                                                        opcion.texto
                                                                    }
                                                                </label>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-4 border-t border-slate-700 space-y-3">
                    {error && (
                        <p className="text-red-400 text-xs text-center">
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
                            {submitting ? "Guardando..." : "Guardar Evaluación"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
