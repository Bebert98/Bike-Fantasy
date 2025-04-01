import React from 'react';
import '../styles/HomePage.css';
import { Link } from 'react-router-dom';
import philippeGilbertImage from '../assets/philippe_gilbert.png';

const podiumData = [
    { year: 2004, winner: 'Maximilien', second: 'Fabrice', third: 'Jean-Christophe' },
    { year: 2005, winner: 'Patrice', second: 'Fabrice', third: 'Dominique' },
    { year: 2006, winner: 'Maximilien', second: 'Dominique', third: 'Fabrice' },
    { year: 2007, winner: 'Jean-Christophe', second: 'Damien', third: 'Harold' },
    { year: 2008, winner: 'Maximilien', second: 'Jean-Christophe', third: 'Pierre-Jean' },
    { year: 2009, winner: 'Harold', second: 'Damien', third: 'Dominique' },
    { year: 2010, winner: 'Maximilien', second: 'Damien', third: 'Dominique' },
    { year: 2011, winner: 'Maximilien', second: 'Patrice', third: 'Harold' },
    { year: 2012, winner: 'Damien', second: 'Harold', third: 'Dominique' },
    { year: 2013, winner: 'Harold', second: 'Dominique', third: 'Jean-Christophe' },
    { year: 2014, winner: 'Damien', second: 'Patrice', third: 'Maximilien' },
    { year: 2015, winner: 'Harold', second: 'Maximilien', third: 'Antoine' },
    { year: 2016, winner: 'Damien', second: 'Antoine', third: 'Dominique' },
    { year: 2017, winner: 'Damien', second: 'Harold', third: 'Antoine' },
    { year: 2018, winner: 'Antoine', second: 'Pierre-Gilles', third: 'Jean-Christophe' },
    { year: 2019, winner: 'Antoine', second: 'Harold', third: 'Jean-Christophe' },
    { year: 2020, winner: 'Bernard', second: 'Jean-Christophe', third: 'Brice' },
    { year: 2021, winner: 'Olivier (Jo)', second: 'Antoine', third: 'Albert' },
    { year: 2022, winner: 'Felix', second: 'Jack', third: 'Albert' },
    { year: 2023, winner: 'Adrien', second: 'Jack', third: 'Dominique' },
    { year: 2024, winner: 'Albert', second: 'Jack', third: 'Dominique' }
];

const HomePage = () => {
    return (
        <div className="homepage-container">
            <div className="hero-image">
                <img src={philippeGilbertImage} alt="Philippe Gilbert Victory" />
            </div>

            <h1>Mega Bike</h1>
            <h3>since 2004...</h3>
            
            <div className="content-container">
                <div className="links-section">
                    <Link to="/leaderboard" className="big-button">Leaderboard</Link>
                    <Link to="/my-team" className="big-button">My Team</Link>
                </div>

                <div className="history-section">
                    <h2>Podium History</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>Winner</th>
                                <th>2nd</th>
                                <th>3rd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {podiumData.map((entry, index) => (
                                <tr key={index}>
                                    <td>{entry.year}</td>
                                    <td>{entry.winner}</td>
                                    <td>{entry.second}</td>
                                    <td>{entry.third}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HomePage;