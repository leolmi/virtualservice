export type UserRole = 'user' | 'admin';

export interface IUser {
  _id: string;
  email: string;
  password?: string;
  googleId?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  deletionRequestedAt?: Date;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface MeResponse {
  userId: string;
  email: string;
  role: string;
  mcpEnabled: boolean;
}
