import NavBar from "../components/NavBar";
import ReportsDashboard from "../components/ReportsDashboard";

export default function ReportsPage() {
    return (
        <div className="min-h-screen bg-slate-900">
            <NavBar />
            <main className="pt-20 pb-12">
                <ReportsDashboard />
            </main>
        </div>
    );
}
