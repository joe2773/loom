import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../auth/AuthContext';
import styles from './LoginButton.module.css';

export function LoginButton() {
  const { user, login, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return (
      <div className={styles.loginWrap}>
        <GoogleLogin
          onSuccess={(cred) => {
            setError(null);
            if (!cred.credential) {
              setError('No credential returned from Google');
              return;
            }
            login(cred.credential).catch((err: Error) => setError(err.message));
          }}
          onError={() => setError('Google sign-in failed')}
          size="medium"
          theme="outline"
        />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  }

  return (
    <div className={styles.userWrap}>
      <button
        type="button"
        className={styles.userButton}
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        {user.picture ? (
          <img src={user.picture} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
        ) : (
          <span className={styles.avatarFallback}>{user.email.charAt(0).toUpperCase()}</span>
        )}
        <span className={styles.email}>{user.name || user.email}</span>
      </button>
      {menuOpen && (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
