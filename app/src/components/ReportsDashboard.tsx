import { useEffect, useState } from "react";
import {
    obtenerEstadisticasGenerales,
    obtenerGraficoUltimaEvaluacion,
    type StatsData,
    type LatestEvalData,
} from "../supabase";

export default function ReportsDashboard() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [grafico, setGrafico] = useState<LatestEvalData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [resStats, resGrafico] = await Promise.all([
            obtenerEstadisticasGenerales(),
            obtenerGraficoUltimaEvaluacion(),
        ]);

        if (resStats.success && resStats.data) {
            setStats(resStats.data);
        }
        setGrafico(resGrafico);
        setLoading(false);
    };

    useEffect(() => {
        (async () => {
            await fetchData();
        })();
    }, []);

    return (
        <div className="w-full mx-auto p-6 space-y-8 max-w-440">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">
                        Dashboard de Reportes
                    </h2>
                    <p className="text-sm text-slate-400">
                        Estadísticas en tiempo real de RRHH y la última Evaluación 360 procesada.
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="text-sm px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors disabled:opacity-50"
                >
                    {loading ? "Actualizando..." : "↻ Refrescar"}
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl flex flex-col justify-center items-center">
                    <span className="text-4xl font-black text-blue-400 mb-2">
                        {stats ? stats.total_candidatos : 0}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Candidatos Activos
                    </span>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl flex flex-col justify-center items-center">
                    <span className="text-4xl font-black text-green-400 mb-2">
                        {stats ? stats.total_empleados : 0}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Total Empleados
                    </span>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl flex flex-col justify-center items-center">
                    <span className="text-4xl font-black text-yellow-400 mb-2">
                        {stats ? stats.total_ascensos : 0}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Empleados Ascendidos
                    </span>
                </div>
            </div>

            {/* Evaluation Graph */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300 mb-6 pb-2 border-b border-slate-700">
                    Última Evaluación 360° Realizada
                </h3>
                
                {loading ? (
                    <div className="h-32 flex items-center justify-center text-slate-400">
                        Cargando gráfico...
                    </div>
                ) : !grafico ? (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-500">
                        <p>No hay evaluaciones 360 registradas en el sistema.</p>
                        <p className="text-xs mt-1 text-slate-600">Al finalizar una evaluación, la gráfica aparecerá aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-2xl font-bold text-slate-100 block">
                                    {grafico.nombre}
                                </span>
                                <span className="text-xs font-semibold px-2 py-1 mt-2 inline-block rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                                    Estatus Actual: {grafico.estatus}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 uppercase tracking-wider">
                                    Meta de la Empresa
                                </span>
                                <span className="block text-xl font-mono text-blue-300">
                                    {grafico.objetivo}%
                                </span>
                            </div>
                        </div>

                        {/* Bar: Promedio General */}
                        <div>
                            <div className="flex justify-between text-xs text-slate-300 mb-1">
                                <span>Puntuación Global (Promedio de Evaluadores)</span>
                                <span className="font-mono font-bold text-slate-100">{grafico.promedioGeneral}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-sm h-4 overflow-hidden relative border border-slate-600">
                                <div
                                    className={`h-full rounded-sm transition-all duration-700 ${grafico.promedioGeneral >= grafico.objetivo ? "bg-green-500" : "bg-yellow-500"}`}
                                    style={{ width: `${grafico.promedioGeneral}%` }}
                                />
                                {/* Marker for company goal */}
                                <div 
                                    className="absolute top-0 bottom-0 border-l-2 border-white/60 z-10"
                                    title={`Meta: ${grafico.objetivo}%`}
                                    style={{ left: `${grafico.objetivo}%` }}
                                />
                            </div>
                        </div>

                        {/* Bar: Puntaje del Superior */}
                        <div>
                            <div className="flex justify-between text-xs text-slate-300 mb-1">
                                <span>Calificación del Jefe Directo (Impacto Superior)</span>
                                <span className="font-mono font-bold text-slate-100">{grafico.puntajeSuperior}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-sm h-4 overflow-hidden relative border border-slate-600">
                                <div
                                    className={`h-full rounded-sm transition-all duration-700 ${grafico.puntajeSuperior >= grafico.objetivo ? "bg-blue-500" : "bg-red-500"}`}
                                    style={{ width: `${grafico.puntajeSuperior}%` }}
                                />
                                {/* Marker for company goal */}
                                <div 
                                    className="absolute top-0 bottom-0 border-l-2 border-white/60 z-10"
                                    title={`Meta: ${grafico.objetivo}%`}
                                    style={{ left: `${grafico.objetivo}%` }}
                                />
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 text-right italic pt-2 border-t border-slate-700/50 mt-4">
                            * La línea vertical blanca representa la meta técnica ({grafico.objetivo}%). Valores por debajo advierten áreas de mejora técnica o blanda.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
