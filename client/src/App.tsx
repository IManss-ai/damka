import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './stores/auth';
import { useFriends } from './stores/friends';
import { LangContext } from './lib/i18n';
import { useLangState } from './stores/lang';
import { getSocket } from './lib/socket';
import Landing from './pages/Landing';
import Play from './pages/Play';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import Bosses from './pages/Bosses';
import Puzzle from './pages/Puzzle';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import Pro from './pages/Pro';
import Tournament from './pages/Tournament';
import Friends from './pages/Friends';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function InvitePopup() {
  const { invite, setInvite } = useFriends();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!invite) return null;

  function accept() {
    if (!user || !invite) return;
    const socket = getSocket();
    socket.emit('friend:invite:accept', {
      fromUserId: invite.fromUserId,
      toUserId: user.id,
      toUsername: user.username,
    });
    setInvite(null);
  }

  function decline() {
    if (!invite) return;
    const socket = getSocket();
    socket.emit('friend:invite:decline', { fromUserId: invite.fromUserId });
    setInvite(null);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface-card border border-border rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xl font-black text-accent">
            {invite.fromUsername[0]?.toUpperCase()}
          </span>
          <div>
            <p className="font-bold text-ink">{invite.fromUsername}</p>
            <p className="text-sm text-ink-muted">wants to play a game!</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={accept} className="btn-primary flex-1 py-3">Accept</button>
          <button onClick={decline} className="btn-secondary flex-1 py-3">Decline</button>
        </div>
      </div>
    </div>
  );
}

function GlobalSocketSetup() {
  const { user } = useAuth();
  const { setInvite } = useFriends();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit('user:register', { userId: user.id });
    socket.on('friend:invited', ({ fromUserId, fromUsername }: { fromUserId: string; fromUsername: string }) => {
      setInvite({ fromUserId, fromUsername });
    });
    socket.on('friend:invite:matched', ({ gameId, role }: { gameId: string; role: string }) => {
      navigate(`/game/${gameId}?role=${role}`);
    });
    return () => {
      socket.off('friend:invited');
      socket.off('friend:invite:matched');
    };
  }, [user, setInvite, navigate]);

  return null;
}

export default function App() {
  const { fetchMe } = useAuth();
  const { lang, setLang } = useLangState();
  useEffect(() => { fetchMe(); }, []);
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div className="min-h-screen bg-surface-base text-ink flex flex-col">
        <Navbar />
        <GlobalSocketSetup />
        <InvitePopup />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/play" element={<Play />} />
            <Route path="/game/:id" element={<Game />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/bosses" element={<Bosses />} />
            <Route path="/puzzle" element={<Puzzle />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/pro" element={<Pro />} />
            <Route path="/tournament" element={<Tournament />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </LangContext.Provider>
  );
}
