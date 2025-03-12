import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';

const TeamCreation = () => {
    const [team, setTeam] = useState(Array(12).fill({ name: '', points: 0 }));
    const [totalPoints, setTotalPoints] = useState(0);

    // Calculate total points whenever the team changes
    useEffect(() => {
        const points = team.reduce((sum, rider) => sum + rider.points, 0);
        setTotalPoints(points);
    }, [team]); // Recalculate total points whenever the team state changes

    const handleInputChange = (index, value) => {
        const updatedTeam = [...team];
        updatedTeam[index] = { ...updatedTeam[index], name: value };
        setTeam(updatedTeam);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Team Creation</h1>
            
            <Table data={team} columns={['Cyclist Name', 'UCI Points']} />

            <div className="mt-4">
                <Button disabled>{`Total Points: ${totalPoints}`}</Button>
            </div>
        </div>
    );
};

export default TeamCreation;