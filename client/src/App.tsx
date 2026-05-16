import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth';
import Landing from './pages/Landing';
import Play from './pages/Play';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import Bosses from './pages/Bosses';
import Puzzle from './pages/Puzzle';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';

export default function App() {
  const { fetchMe } = useAuth();
  useEffect(() => { fetchMe(); }, []);
  return (
    <div className="min-h-screen bg-surface-base text-ink">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/play" element={<Play />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/bosses" element={<Bosses />} />
        <Route path="/puzzle" element={<Puzzle />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
