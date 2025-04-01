import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeamCreation from './components/TeamCreation';
import Leaderboard from './pages/Leaderboard'; // Assume this will be created later

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/my-team" element={<TeamCreation />} />
            </Routes>
        </Router>
    );
};

export default App;
