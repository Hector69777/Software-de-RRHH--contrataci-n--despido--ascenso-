import { useEffect, useState } from "react";
import {
    obtenerListaCandidatos,
    eliminarCandidatoPorCedula,
    type CandidateData,
} from "../supabase";
import EvaluationModal from "./EvaluationModal";

const STATUS_COLORS: Record<string, string> = {
    Pendiente: "bg-slate-600 text-slate-200",
    Evaluado: "bg-blue-700  text-blue-100",
    Contratado: "bg-green-700 text-green-100",
};

export default function CandidatesTable() {
    const [candidates, setCandidates] = useState<CandidateData[]>([]);
    const [loading, setLoading] = useState(false);
    const [evaluando, setEvaluando] = useState<CandidateData | null>(null);

    const fetchCandidates = async () => {
        setLoading(true);
        const data = await obtenerListaCandidatos();
        setCandidates(data ?? []);
        setLoading(false);
    };

    useEffect(() => {
        (async () => {
            await fetchCandidates();
        })();
    }, []);

    const handleHireCandidate = (candidate: CandidateData) => {
        // TODO
        console.log("Contratar: ", candidate);
    };
    const handleDeleteCandidate = async (candidate: CandidateData) => {
        if (!confirm("¿Eliminar este candidato?")) return;
        await eliminarCandidatoPorCedula(candidate.cedula);
        fetchCandidates();
    };

    return (
        <div className="w-full mx-auto p-6 space-y-4 max-w-440">
            <div className="flex items-center justify-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">Candidatos</h2>
                <button
                    onClick={fetchCandidates}
                    disabled={loading}
                    className="text-sm px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors disabled:opacity-50"
                >
                    {loading ? "Cargando..." : "↻ Refrescar"}
                </button>
            </div>

            <div className="rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-slate-300">
                    <thead className="bg-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                        <tr>
                            {[
                                "Cédula",
                                "Nombre",
                                "Teléfono",
                                "Departamento",
                                "Experiencia",
                                "Formación",
                                "Estado",
                                "CV",
                                "Acciones",
                            ].map((h) => (
                                <th key={h} className="px-4 py-3 text-left">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.length === 0 && !loading ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="text-center py-10 text-slate-500 bg-slate-800"
                                >
                                    No hay candidatos registrados.
                                </td>
                            </tr>
                        ) : (
                            candidates.map((candidate, i) => {
                                return (
                                    <tr
                                        key={candidate.cedula}
                                        className={`border-t border-slate-700 ${i % 2 === 0 ? "bg-slate-800" : "bg-slate-800/60"} hover:bg-slate-700/50 transition-colors`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {candidate.cedula}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-100">
                                            {candidate.nombre}
                                        </td>
                                        <td className="px-4 py-3">
                                            {candidate.telefono}
                                        </td>
                                        <td className="px-4 py-3">
                                            {candidate.departamento_deseado}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {candidate.anos_experiencia}{" "}
                                            {candidate.anos_experiencia == 1
                                                ? "año"
                                                : "años"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {candidate.formacion}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[candidate.estado] ?? STATUS_COLORS.Pendiente}`}
                                            >
                                                {candidate.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {candidate.cv_url ? (
                                                <a
                                                    href={candidate.cv_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-400 hover:underline"
                                                >
                                                    Ver CV
                                                </a>
                                            ) : (
                                                <span className="text-slate-500">
                                                    N/A
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        setEvaluando(candidate)
                                                    }
                                                    className="px-2 py-1 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors"
                                                >
                                                    Evaluar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleHireCandidate(
                                                            candidate,
                                                        )
                                                    }
                                                    className="px-2 py-1 text-xs rounded bg-green-700 hover:bg-green-600 text-white transition-colors"
                                                >
                                                    Contratar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteCandidate(
                                                            candidate,
                                                        )
                                                    }
                                                    className="px-2 py-1 text-xs rounded bg-red-800 hover:bg-red-700 text-white transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {evaluando && (
                <EvaluationModal
                    candidato={evaluando}
                    onClose={() => setEvaluando(null)}
                    onSuccess={fetchCandidates}
                />
            )}
        </div>
    );
}
