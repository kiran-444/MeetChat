import * as React from "react";
import { Avatar, Button, CssBaseline, TextField, Box, Grid, Snackbar, Typography, createTheme, ThemeProvider } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../App.css";

const robotoTheme = createTheme({
    palette: { mode: "dark", primary: { main: "#d97500" } },
    typography: { fontFamily: '"Roboto", sans-serif' },
});

export default function Authentication() {
    const [formState, setFormState] = React.useState(0);
    const navigate = useNavigate();
    const [name, setName] = React.useState("");
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState();
    const [open, setOpen] = React.useState(false);
    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        try {
            if (formState === 0) {
                await handleLogin(username, password);
                navigate("/home");
            } else {
                let result = await handleRegister(name, username, password);
                setMessage(result);
                setOpen(true);
                setFormState(0);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error occurred");
        }
    };

    return (
        <ThemeProvider theme={robotoTheme}>
            <Grid container component="main" className="landingPageContainer" sx={{ height: "100vh", overflow: "hidden" }}>
                <CssBaseline />
                <Grid item xs={false} sm={4} md={7} sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", justifyContent: "center", px: 8 }}>
                    <Typography variant="h2" sx={{ fontWeight: 900, mb: 1 }}>MeetChat</Typography>
                    <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 300 }}>Bridge the gap with high-quality video calls.</Typography>
                </Grid>
                <Grid item xs={12} sm={8} md={5} sx={{ display: "flex", background: "rgba(15, 15, 15, 0.85)", backdropFilter: "blur(15px)", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                    <Box sx={{ my: "auto", mx: "auto", px: { xs: 3, md: 8 }, py: 2, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "450px" }}>
                        <Avatar sx={{ m: 1, bgcolor: "primary.main" }}><LockOutlinedIcon /></Avatar>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>{formState === 0 ? "Welcome" : "Sign Up"}</Typography>
                        <Box sx={{ display: "flex", p: 0.5, bgcolor: "rgba(255,255,255,0.05)", borderRadius: "12px", mb: 2, width: "100%" }}>
                            <Button fullWidth variant={formState === 0 ? "contained" : "text"} onClick={() => setFormState(0)}>Sign In</Button>
                            <Button fullWidth variant={formState === 1 ? "contained" : "text"} onClick={() => setFormState(1)}>Register</Button>
                        </Box>
                        <Box component="form" noValidate sx={{ width: "100%" }}>
                            {formState === 1 && <TextField size="small" margin="dense" required fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />}
                            <TextField size="small" margin="dense" required fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                            <TextField size="small" margin="dense" required fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            {error && <Typography color="error" variant="caption" sx={{ mt: 1, display: "block", textAlign: "center" }}>{error}</Typography>}
                            <Button fullWidth variant="contained" sx={{ mt: 3, py: 1.2, fontWeight: 700, borderRadius: "8px" }} onClick={handleAuth}>{formState === 0 ? "Log In" : "Create Account"}</Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
            <Snackbar open={open} autoHideDuration={4000} message={message} />
        </ThemeProvider>
    );
}