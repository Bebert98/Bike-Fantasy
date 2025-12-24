import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import HistoryPage from "./pages/HistoryPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import MyTeamPage from "./pages/MyTeamPage";
import TeamPublicPage from "./pages/TeamPublicPage";
import ProfileHubPage from "./pages/ProfileHubPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="my-team" element={<MyTeamPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfileHubPage />} />
          <Route path="team/:teamId" element={<TeamPublicPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
