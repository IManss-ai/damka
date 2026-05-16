const BASE = '/api';

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...opts.headers }, ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw err;
  }
  return res.json();
}

async function reqSilent(path: string, opts: RequestInit = {}) {
  try { return await req(path, opts); } catch { return null; }
}

export const api = {
  auth: {
    register: (data: any) => req('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => req('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => req('/auth/logout', { method: 'POST' }),
    me: () => reqSilent('/auth/me'),
  },
  leaderboard: {
    global: () => req('/leaderboard/global'),
    city: () => req('/leaderboard/city'),
  },
  puzzles: {
    daily: () => req('/puzzles/daily'),
    solve: (id: string, data: any) => req(`/puzzles/${id}/solve`, { method: 'POST', body: JSON.stringify(data) }),
    ranking: (id: string) => req(`/puzzles/${id}/ranking`),
  },
  bosses: {
    list: () => req('/bosses'),
    beaten: (id: number) => req(`/bosses/${id}/beaten`, { method: 'POST' }),
    attempt: (id: number) => req(`/bosses/${id}/attempt`, { method: 'POST' }),
  },
  users: { profile: (username: string) => req(`/users/${username}`) },
  cosmetics: {
    list: () => req('/cosmetics'),
    owned: () => req('/cosmetics/owned'),
    buy: (id: string) => req(`/cosmetics/${id}/buy`, { method: 'POST' }),
  },
};
