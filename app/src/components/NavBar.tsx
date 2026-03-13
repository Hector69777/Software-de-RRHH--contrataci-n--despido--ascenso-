import { NavLink } from "react-router";

const NAV_ITEMS = [
    { label: "Nuevo candidato", path: "/nuevo-candidato" },
    { label: "Candidatos", path: "/candidatos" },
    { label: "Empleados", path: "/empleados" },
    { label: "Reportes", path: "/reportes" },
];

export default function NavBar() {
    return (
        <div className="flex items-center justify-center">
            <nav className="flex items-center justify-center gap-6 px-6 py-3 bg-slate-800 border border-slate-700 rounded-2xl m-6 w-full max-w-150">
                {NAV_ITEMS.map(({ label, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `text-sm no-underline ${isActive ? "text-white font-semibold" : "text-slate-400 hover:text-white hover:underline"}`
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
