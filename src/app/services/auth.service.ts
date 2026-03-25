import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthUser, UserRole } from '../models/auth.model';

type StoredUserRecord = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly usersKey = 'drivelux_users_v2';
  private readonly sessionKey = 'drivelux_session_v2';

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(this.readSession());
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    window.addEventListener('storage', (e) => {
      if (e.key === this.sessionKey) {
        this.userSubject.next(this.readSession());
      }
    });
  }

  get user(): AuthUser | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  signup(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): { ok: true } | { ok: false; error: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const displayName = name.trim();
    if (!normalizedEmail || !password || !displayName) {
      return { ok: false, error: 'Name, email, and password are required.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    if (role !== 'customer' && role !== 'owner') {
      return { ok: false, error: 'Choose Customer or Car owner.' };
    }

    const users = this.readUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      return { ok: false, error: 'An account with that email already exists.' };
    }

    users.push({ email: normalizedEmail, password, name: displayName, role });
    this.writeUsers(users);

    const sessionUser = this.toAuthUser(normalizedEmail, displayName, role);
    this.writeSession(sessionUser);
    this.userSubject.next(sessionUser);
    return { ok: true };
  }

  login(email: string, password: string): { ok: true } | { ok: false; error: string } {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { ok: false, error: 'Email and password are required.' };
    }

    const users = this.readUsers();
    const match = users.find((u) => u.email === normalizedEmail && u.password === password);
    if (!match) {
      return { ok: false, error: 'Invalid email or password.' };
    }

    const sessionUser = this.toAuthUser(match.email, match.name, match.role);
    this.writeSession(sessionUser);
    this.userSubject.next(sessionUser);
    return { ok: true };
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.userSubject.next(null);
  }

  private toAuthUser(email: string, name: string, role: UserRole): AuthUser {
    return {
      id: `local-${email}`,
      email,
      name,
      role,
    };
  }

  private readUsers(): StoredUserRecord[] {
    try {
      const raw = localStorage.getItem(this.usersKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (x) =>
          typeof x?.email === 'string' &&
          typeof x?.password === 'string' &&
          typeof x?.name === 'string' &&
          (x?.role === 'customer' || x?.role === 'owner')
      );
    } catch {
      return [];
    }
  }

  private writeUsers(users: StoredUserRecord[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  private readSession(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.sessionKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed['email'] !== 'string') return null;
      if (
        typeof parsed['name'] === 'string' &&
        (parsed['role'] === 'customer' || parsed['role'] === 'owner')
      ) {
        return {
          id: String(parsed['id'] ?? `local-${parsed['email']}`),
          email: parsed['email'],
          name: parsed['name'],
          role: parsed['role'] as UserRole,
          profile:
            typeof parsed['profile'] === 'object' && parsed['profile']
              ? (parsed['profile'] as AuthUser['profile'])
              : undefined,
        };
      }
      /** Legacy session: email only */
      const email = parsed['email'] as string;
      return this.toAuthUser(email, email.split('@')[0] || 'User', 'customer');
    } catch {
      return null;
    }
  }

  private writeSession(user: AuthUser): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
  }
}
