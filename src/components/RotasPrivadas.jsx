import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Mrp from "../pages/Mrp";
import Operadores from "../pages/Operadores";
import Maquinas from "../pages/Maquinas";
import OrdemProducao from "../pages/OrdemProducao";
import MrpPorOP from "../pages/MrpPorOp";

export default function RotasPrivadas() {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/maquinas/:codmaq" element={<Maquinas />} />
            <Route path="/op" element={<OrdemProducao />} />
            <Route path="/operadores" element={<Operadores />} />
            <Route path="/mrp" element={<Mrp />} />
            <Route path="/mrpPorOp" element={<MrpPorOP />} />
        </Routes>
    );
}
