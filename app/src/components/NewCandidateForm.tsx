import type { ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { registrarCandidato } from "../supabase";

const FORMACION = [
    "Secundaria",
    "Técnico",
    "Universitaria",
    "PostGrado",
    "Doctorado",
] as const;

interface CandidateFormValues {
    cedula: string;
    nombre: string;
    telefono: string;
    cv: FileList;
    departamento_deseado: string;
    anos_experiencia: number;
    formacion: string;
}

export default function NewCandidateForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
    } = useForm<CandidateFormValues>();
    const cvFile = watch("cv");

    const onSubmit: SubmitHandler<CandidateFormValues> = async (data) => {
        const result = await registrarCandidato({
            ...data,
            cv: cvFile,
            estado: "Pendiente",
            respuestas_evaluacion: null,
        });
        if (result.success) {
            alert("Candidato registrado.");
        } else {
            alert("Error al registrar el candidato.");
        }
    };

    const fieldClass =
        "block w-full border border-slate-600 rounded-md px-3 py-2 text-sm bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const errorComponent = (msg: ReactNode) => (
        <p className="text-red-400 text-xs mt-1">{msg}</p>
    );

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-slate-800 rounded-xl p-8 w-full max-w-lg space-y-4 shadow-2xl"
        >
            <h2 className="text-xl font-bold text-slate-100 mb-5 text-center">
                Registrar Candidato
            </h2>

            {(
                [
                    { id: "cedula", label: "Cédula" },
                    { id: "nombre", label: "Nombre" },
                    { id: "telefono", label: "Teléfono" },
                ] as const
            ).map(({ id, label }) => (
                <div key={id}>
                    <label className="text-sm font-medium text-slate-300 block mb-1">
                        {label}
                    </label>
                    <input
                        {...register(id, { required: "Requerido" })}
                        className={fieldClass}
                    />
                    {errors[id] && errorComponent(errors[id]?.message)}
                </div>
            ))}

            <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">
                    CV (PDF)
                </label>
                <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    {...register("cv", { required: "Adjunte su CV" })}
                    className="block w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-slate-700 file:text-blue-400 hover:file:bg-slate-600 mt-1"
                />
                {cvFile?.[0] && (
                    <p className="text-xs text-green-400 mt-1">
                        📎 {cvFile[0].name}
                    </p>
                )}
                {errors.cv && errorComponent(errors.cv.message)}
            </div>

            <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">
                    Departamento Deseado
                </label>
                <input
                    {...register("departamento_deseado", {
                        required: "Requerido",
                    })}
                    className={fieldClass}
                />
                {errors.departamento_deseado &&
                    errorComponent(errors.departamento_deseado.message)}
            </div>

            <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">
                    Años de Experiencia
                </label>
                <input
                    type="number"
                    min={0}
                    max={60}
                    {...register("anos_experiencia", {
                        required: "Requerido",
                        min: 0,
                        valueAsNumber: true,
                    })}
                    className={fieldClass}
                />
                {errors.anos_experiencia &&
                    errorComponent(errors.anos_experiencia.message)}
            </div>

            <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">
                    Formación
                </label>
                <select
                    {...register("formacion", { required: "Requerido" })}
                    className={fieldClass}
                >
                    <option value="" className="bg-slate-700">
                        Seleccione...
                    </option>
                    {FORMACION.map((f) => (
                        <option key={f} className="bg-slate-700">
                            {f}
                        </option>
                    ))}
                </select>
                {errors.formacion && errorComponent(errors.formacion.message)}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-md transition-colors text-sm"
            >
                {isSubmitting ? "Registrando..." : "Registrar Candidato"}
            </button>
        </form>
    );
}
