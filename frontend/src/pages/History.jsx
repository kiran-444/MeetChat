import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton, Container, Box } from '@mui/material';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                // Defensive check: ensure 'history' is an array. 
                // If your API returns { data: [...] }, change this to history.data
                if (Array.isArray(history)) {
                    setMeetings(history);
                } else if (history && Array.isArray(history.data)) {
                    setMeetings(history.data);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        };

        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4, mb: 2 }}>
                <IconButton onClick={() => routeTo("/home")} aria-label="home">
                    <HomeIcon />
                </IconButton>
                <Typography variant="h5" sx={{ mt: 2, mb: 2 }}>Meeting History</Typography>
            </Box>

            {/* Use optional chaining and check if it's an array */}
            {Array.isArray(meetings) && meetings.length > 0 ? (
                meetings.map((e, i) => (
                    <Card key={e._id || i} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                Code: {e.meetingCode}
                            </Typography>
                            <Typography variant="h6" component="div">
                                {e.title || "Untitled Meeting"}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                Date: {formatDate(e.date)}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Typography color="text.secondary">No meetings found.</Typography>
            )}
        </Container>
    );
}