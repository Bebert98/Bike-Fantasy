import React from 'react';
import { Routes, Route } from 'react-router-dom'; 
import TeamCreation from './pages/TeamCreation';
import Home from './pages/Home';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/team-creation" element={<TeamCreation />} />
        </Routes>
    );
};

export default App;