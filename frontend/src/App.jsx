import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoleplayPage from './pages/RoleplayPage';
import ScorePage from './pages/ScorePage';

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/roleplay" element={<RoleplayPage />} />
        <Route path="/score" element={<ScorePage />} />
      </Routes>
    </div>
  );
}
