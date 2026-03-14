import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css"; // We are back to using the single global CSS file
import { Button, TextField, Box, Typography, ThemeProvider, createTheme } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import { AuthContext } from "../contexts/AuthContext";

const theme = createTheme({
    palette: { mode: 'dark', primary: { main: '#d97500' } },
    typography: { fontFamily: '"Roboto", sans-serif' },
});

function Home() {
    const navigate = useNavigate();
    const { addToUserHistory } = useContext(AuthContext);
    const [meetingCode, setMeetingCode] = useState("");

    const handleJoinVideoCall = async () => {
        if (!meetingCode) return alert("Please enter a meeting code");
        try {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        } catch (e) {
            console.error(e);
            navigate(`/${meetingCode}`); // Fallback navigation
        }
    };

    return (
        <ThemeProvider theme={theme}>
            {/* Switched to landingPageContainer to inherit the working background */}
            <div className="landingPageContainer">
                <nav className="navBar">
                    <div className="navHeader" onClick={() => navigate("/home")}>
                        <h2>MeetChat</h2>
                    </div>
                    <div className="navList">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: "8px", cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }} 
                             onClick={() => navigate("/history")}>
                            <RestoreIcon fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>History</Typography>
                        </Box>
                        <Button variant="outlined" 
                            onClick={() => { localStorage.removeItem("token"); navigate("/auth"); }}
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', borderRadius: '10px' }}
                            startIcon={<LogoutIcon />}>
                            Logout
                        </Button>
                    </div>
                </nav>

                {/* Switched to landingMainContainer for unified layout */}
                <div className="landingMainContainer">
                    <div className="textContent">
                        <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '3.8rem' }, lineHeight: 1.1 }}>
                            Quality Connections, <br /> 
                            <span style={{ color: 'var(--primary-orange)' }}>Every Time.</span>
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#ccc', mb: 4, maxWidth: '450px', fontSize: '1.1rem' }}>
                            Join a secure meeting with your team or loved ones by entering a code below.
                        </Typography>
                        
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' }, 
                            gap: "12px", 
                            background: 'rgba(255,255,255,0.05)', 
                            p: 2, 
                            borderRadius: '16px', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            backdropFilter: 'blur(15px)',
                            maxWidth: '500px'
                        }}>
                            <TextField fullWidth size="small" label="Meeting Code" variant="outlined" 
                                value={meetingCode} onChange={(e) => setMeetingCode(e.target.value)} 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <Button variant="contained" onClick={handleJoinVideoCall} 
                                sx={{ borderRadius: '10px', px: 4, py: 1.2, fontWeight: 700, boxShadow: '0 8px 20px rgba(217, 117, 0, 0.3)' }}>
                                Join Call
                            </Button>
                        </Box>
                    </div>
                    
                    <div className="imageContainer">
                        <img src="/logo3.png" alt="Dashboard Illustration" />
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
}

export default withAuth(Home);