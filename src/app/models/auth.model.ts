export type UserRole = 'customer' | 'owner' | 'admin';

export interface UserProfile {
  phone?: string;
  bio?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile?: UserProfile;
  isOnline?: boolean;
  lastSeenAt?: string;
}
