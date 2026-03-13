import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
    obtenerListaEmpleados,
    eliminarEmpleadoDefinitivo,
    promoverEmpleadoAscenso,
    marcarEmpleadoParaReporte,
    buscarEmpleadosPorTermino,
    type EmpleadoData,
} from "../supabase";
import Evaluation360Modal from "./Evaluation360Modal";

const REVISADO_COLORS: Record<string, string> = {
    "No evaluado": "bg-slate-600 text-slate-200",
    Revisado: "bg-yellow-700 text-yellow-100",
    Ascendido: "bg-green-700 text-green-100",
    Despedido: "bg-red-800 text-red-100",
};

export default function EmployeesTable() {
    const [empleados, setEmpleados] = useState<EmpleadoData[]>([]);
    const [loading, setLoading] = useState(false);
    const [evaluando, setEvaluando] = useState<EmpleadoData | null>(null);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchEmpleados = async () => {
        setLoading(true);
        const data = await obtenerListaEmpleados();
        setEmpleados(data ?? []);
        setLoading(false);
    };

    useEffect(() => {
        (async () => {
            await fetchEmpleados();
        })();
    }, []);

    // Búsqueda con debounce de 400ms
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            if (searchTerm.trim() === "") {
                await fetchEmpleados();
            } else {
                setLoading(true);
                const results = await buscarEmpleadosPorTermino(searchTerm);
                if (results !== null) setEmpleados(results);
                setLoading(false);
            }
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchTerm]);

    const handlePromote = async (empleado: EmpleadoData) => {
        if (empleado.revisado !== 'Ascendido') {
            alert("No se puede promover. El empleado debe tener estatus 'Ascendido' en su evaluación 360.");
            return;
        }

        const nuevoCargo = window.prompt(`Ingresa el nuevo cargo para ${empleado.nombre} por su ascenso:`, "Director General");
        if (nuevoCargo === null) return; 

        const salarioStr = window.prompt(`Ingresa el nuevo salario para ${empleado.nombre} (solo números):`, "2500");
        if (salarioStr === null) return;

        const salario = Number(salarioStr);

        setLoading(true);
        const result = await promoverEmpleadoAscenso(empleado.id, nuevoCargo, salario);
        
        if (result.success) {
            alert(`¡${empleado.nombre} ha sido promovido a ${nuevoCargo}!`);
            await fetchEmpleados();
        } else {
            // @ts-ignore
            alert(`Error en promoción: ${result.error?.message || String(result.error) || 'Desconocido'}`);
        }
        setLoading(false);
    };

    const handleDelete = async (empleado: EmpleadoData) => {
        if (empleado.revisado !== 'Despedido') {
            alert("No se puede eliminar. El empleado debe tener estatus 'Despedido' en su evaluación 360.");
            return;
        }

        if (!confirm(`¿Estás seguro de ejecutar la eliminación/despido de ${empleado.nombre}? Esta acción es irreversible.`)) return;
        
        setLoading(true);
        const result = await eliminarEmpleadoDefinitivo(empleado.id);
        if (result.success) {
            alert(`${empleado.nombre} ha sido removido del sistema exitosamente.`);
            await fetchEmpleados();
        } else {
            // @ts-ignore
            alert(`Error al eliminar: ${result.error?.message || String(result.error) || 'Desconocido'}`);
        }
        setLoading(false);
    };

    const handleVerReporte = async (empleado: EmpleadoData) => {
        if (empleado.puntuacion_general === null || empleado.puntuacion_general === undefined) {
            alert("Este empleado no ha sido evaluado aún. Realiza una Evaluación 360 primero.");
            return;
        }
        setLoading(true);
        const result = await marcarEmpleadoParaReporte(empleado.id);
        setLoading(false);
        if (result.success) {
            navigate('/reportes');
        } else {
            alert(`Error al generar reporte: ${result.error || 'Desconocido'}`);
        }
    };

    return (
        <div className="w-full mx-auto p-6 space-y-4 max-w-440">
            <div className="flex items-center justify-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">Empleados Activos</h2>
                <button
                    onClick={fetchEmpleados}
                    disabled={loading}
                    className="text-sm px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors disabled:opacity-50"
                >
                    {loading ? "Cargando..." : "↻ Refrescar"}
                </button>
            </div>

            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="🔍 Buscar por cédula, nombre, cargo, departamento, estatus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-slate-300">
                    <thead className="bg-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                        <tr>
                            {[
                                "Cédula",
                                "Nombre",
                                "Cargo",
                                "Departamento",
                                "Fecha Ingreso",
                                "Score Gen.",
                                "Estatus Eval.",
                                "Acciones",
                            ].map((h) => (
                                <th key={h} className="px-4 py-3 text-left">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {empleados.length === 0 && !loading ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="text-center py-10 text-slate-500 bg-slate-800"
                                >
                                    No hay empleados registrados en el sistema.
                                </td>
                            </tr>
                        ) : (
                            empleados.map((empleado, i) => {
                                const statusRevisado = empleado.revisado || "No evaluado";
                                return (
                                    <tr
                                        key={empleado.id}
                                        className={`border-t border-slate-700 ${i % 2 === 0 ? "bg-slate-800" : "bg-slate-800/60"} hover:bg-slate-700/50 transition-colors`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {empleado.cedula}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-100">
                                            {empleado.nombre}
                                        </td>
                                        <td className="px-4 py-3">
                                            {empleado.cargo || "Sin asignar"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {empleado.departamento || "N/A"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {empleado.fecha_ingreso || "N/A"}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold">
                                            {empleado.puntuacion_general !== null ? `${(empleado.puntuacion_general * 100).toFixed(0)}%` : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${REVISADO_COLORS[statusRevisado] ?? REVISADO_COLORS["No evaluado"]}`}
                                            >
                                                {statusRevisado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEvaluando(empleado)}
                                                    className="px-2 py-1 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors"
                                                >
                                                    Eval. 360
                                                </button>
                                                <button
                                                    onClick={() => handlePromote(empleado)}
                                                    className="px-2 py-1 text-xs rounded bg-green-700 hover:bg-green-600 text-white transition-colors"
                                                >
                                                    Ascender
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(empleado)}
                                                    className="px-2 py-1 text-xs rounded bg-red-800 hover:bg-red-700 text-white transition-colors"
                                                >
                                                    Despedir
                                                </button>
                                                <button
                                                    onClick={() => handleVerReporte(empleado)}
                                                    disabled={empleado.puntuacion_general === null || empleado.puntuacion_general === undefined}
                                                    className="px-2 py-1 text-xs rounded bg-indigo-700 hover:bg-indigo-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title={empleado.puntuacion_general === null ? "Requiere evaluación 360 previa" : "Ver reporte detallado"}
                                                >
                                                    📊 Reporte
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
                <Evaluation360Modal
                    empleado={evaluando}
                    onClose={() => setEvaluando(null)}
                    onSuccess={fetchEmpleados}
                />
            )}
        </div>
    );
}
