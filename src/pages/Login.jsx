// src/pages/Login.jsx
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const handleSubmit = (e) => {
        e.preventDefault();
        if (usuario === "adminCE" && senha === "1234CE") {
            login({ nome: "Administrador CE", usuario: "adminCE", empresa: "2" });
            navigate(from, { replace: true });
        } else if (usuario === "adminCG" && senha === "cg@2025") {
            login({ nome: "Administrador CG", usuario: "adminCG", empresa: "1" });
            navigate(from, { replace: true });
        } else {
            alert("Usuário ou senha inválidos");
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            
        >
            <Paper
                elevation={8}
                sx={{
                    p: 5,
                    width: 360,
                    borderRadius: 3,
                    backgroundColor: "#fff",
                }}
            >
                <Box textAlign="center" mb={3}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        Acesso ao Sistema
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Informe suas credenciais
                    </Typography>
                </Box>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Usuário"
                        fullWidth
                        margin="normal"
                        variant="outlined"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                    />
                    <TextField
                        label="Senha"
                        type="password"
                        fullWidth
                        margin="normal"
                        variant="outlined"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ mt: 3, py: 1.5, fontWeight: "bold" }}
                    >
                        Entrar
                    </Button>
                </form>
            </Paper>
        </Box>
    );
}
