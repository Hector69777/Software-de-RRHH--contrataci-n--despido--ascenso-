import NavBar from "../components/NavBar";
import NewCandidateFrom from "../components/NewCandidateForm";

export default function NewCandidatePage() {
    return (
        <>
            <NavBar />
            <div className="flex justify-center my-5">
                <NewCandidateFrom />
            </div>
        </>
    );
}
