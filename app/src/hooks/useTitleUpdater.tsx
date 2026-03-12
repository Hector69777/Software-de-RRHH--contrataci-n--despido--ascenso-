import { useEffect } from "react";
import { useLocation } from "react-router";

const TITLE = "SIA-Premium";

const TITLE_MAP = {
    "/nuevo-candidato": "Nuevo candidato",
    "/candidatos": "Candidatos",
};

export function useTitleUpdater() {
    const location = useLocation();
    useEffect(() => {
        document.title =
            location.pathname in TITLE_MAP
                ? `${TITLE_MAP[location.pathname as keyof typeof TITLE_MAP]} | ${TITLE}`
                : TITLE;
    }, [location]);
}
