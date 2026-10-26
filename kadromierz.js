// Klient nieoficjalnego API Kadromierza (to samo, czego używa app.kadromierz.pl)
const BASE = 'https://api.kadromierz.pl';

const baseHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  authV2: 'true',
  'x-kadro-frontend': 'true',
  Origin: 'https://app.kadromierz.pl',
  Referer: 'https://app.kadromierz.pl/',
};

function collectCookies(res) {
  const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  return list.map((c) => c.split(';')[0]).join('; ');
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/security/authentication`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Logowanie nieudane (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return { userId: data.user_id, cookie: collectCookies(res), token: data.auth_token };
}

export async function getShifts(session, from, to) {
  const headers = { ...baseHeaders, userId: session.userId, Cookie: session.cookie };
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  const res = await fetch(`${BASE}/employees/${session.userId}/shifts?from=${from}&to=${to}`, { headers });
  if (!res.ok) throw new Error(`Pobieranie grafiku nieudane (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.shifts || [];
}
