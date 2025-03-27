/* import React, { useState } from 'react';
import { autocompleteRiders } from '../services/api';

const TeamCreation = () => {
  const [query, setQuery] = useState('');
  const [riders, setRiders] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  // This will hold the data for the 12 riders and their points
  const [team, setTeam] = useState(
    Array(12).fill({ rider_name: '', points: 0 })
  );

  // Function to handle search query change
  const handleSearchChange = async (e, index) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);
  
    if (searchQuery.length > 2) {  // Only start searching after 3 characters
      const fetchedRiders = await autocompleteRiders(searchQuery);
      setRiders(fetchedRiders);
    }
  
    // Update the selected rider in the team state at the specified index
    const updatedTeam = [...team];
    updatedTeam[index] = {
      ...updatedTeam[index],  // Spread the existing rider object
      rider_name: searchQuery  // Update only the rider_name for this specific rider
    };
    setTeam(updatedTeam);
  };

  // Function to handle rider selection and update total cost
  const handleRiderSelect = (rider, index) => {
    const updatedTeam = [...team];
    updatedTeam[index].rider_name = rider.rider_name;
    updatedTeam[index].points = rider.points;

    // Update the total cost
    const newTotalCost = updatedTeam.reduce((acc, rider) => acc + rider.points, 0);
    setTeam(updatedTeam);
    setTotalCost(newTotalCost);
  };

  return (
    <div>
      <h1>Create Your Cycling Team ! </h1>
      <table>
        <thead>
          <tr>
            <th>Rider Name</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {team.map((entry, index) => (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  value={entry.rider_name}
                  onChange={(e) => handleSearchChange(e, index)}
                  placeholder="Type to search..."
                />
                {riders.length > 0 && (
                  <ul>
                    {riders.map((rider, idx) => (
                      <li key={idx} onClick={() => handleRiderSelect(rider, index)}>
                        {rider.rider_name} - {rider.points} points
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td>{entry.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <h3>Total Cost: {totalCost} points</h3>
      </div>
    </div>
  );
};

export default TeamCreation; */

import React, { useState } from "react";
import Select from "react-select";

const TeamCreation = () => {
  const [team, setTeam] = useState([
    { id: 1, rider_name: "", points: 0 },
    { id: 2, rider_name: "", points: 0 },
    { id: 3, rider_name: "", points: 0 },
    { id: 4, rider_name: "", points: 0 },
    { id: 5, rider_name: "", points: 0 },
    { id: 6, rider_name: "", points: 0 },
    { id: 7, rider_name: "", points: 0 },
    { id: 8, rider_name: "", points: 0 },
    { id: 9, rider_name: "", points: 0 },
    { id: 10, rider_name: "", points: 0 },
    { id: 11, rider_name: "", points: 0 },
    { id: 12, rider_name: "", points: 0 },
  ]);

  const handleRiderChange = (selectedOption, index) => {
    const updatedTeam = [...team];
    updatedTeam[index].rider_name = selectedOption.label;
    updatedTeam[index].points = selectedOption.value;
    setTeam(updatedTeam);
  };

  const fetchRiders = async (inputValue) => {
    const response = await fetch(`/api/riders?search=${inputValue}`);
    const data = await response.json();
    return data.map((rider) => ({
      label: rider.rider_name,
      value: rider.points,
    }));
  };

  return (
    <div>
        <h1>Create Your Cycling Team ! </h1>
        <table>
            <thead>
            <tr>
                <th>Rider</th>
                <th>Points</th>
            </tr>
            </thead>
            <tbody>
            {team.map((rider, index) => (
                <tr key={rider.id}>
                <td>
                    <Select
                    value={{ label: rider.rider_name, value: rider.points }}
                    onChange={(selectedOption) => handleRiderChange(selectedOption, index)}
                    loadOptions={fetchRiders} // Async autocomplete
                    isSearchable
                    />
                </td>
                <td>{rider.points}</td>
                </tr>
            ))}
            </tbody>
        </table>
    </div>
  );
};

export default TeamCreation;