const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function exchangeGoogleIdToken(idToken: string): Promise<AuthResponse> {
  if (!API_URL) throw new Error('API not configured');
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Sign-in failed: ${res.status}`);
  }
  return (await res.json()) as AuthResponse;
}
