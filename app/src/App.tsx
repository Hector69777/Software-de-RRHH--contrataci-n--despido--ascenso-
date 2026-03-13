import { Navigate, Route, Routes } from "react-router";
import "./globals.css";
import { useTitleUpdater } from "./hooks/useTitleUpdater.tsx";
import CandidatesPage from "./routes/CandidatesPage.tsx";
import NewCandidatePage from "./routes/NewCandidatePage.tsx";
import EmployeesPage from "./routes/EmployeesPage.tsx";
import ReportsPage from "./routes/ReportsPage.tsx";

export default function App() {
    useTitleUpdater();

    return (
        <Routes>
            <Route
                path="/"
                element={<Navigate to="/nuevo-candidato" replace />}
            />
            <Route path="/nuevo-candidato" element={<NewCandidatePage />} />
            <Route path="/candidatos" element={<CandidatesPage />} />
            <Route path="/empleados" element={<EmployeesPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
        </Routes>
    );
}
