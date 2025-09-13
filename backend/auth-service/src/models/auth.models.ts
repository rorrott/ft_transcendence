// backend/auth-service/src/models/auth.models.ts
export interface AuthUser {
	id: number;
	name: string;
	email: string;
	password?: string;
	twoFactorEnabled: boolean;
	twoFactorSecret?: string | null;
	twoFactorMethod?: 'totp' | 'sms' | 'email'; //adding thid
  	phoneNumber?: string; // adding this
  	backupEmail?: string; // adding this
	createdAt: number; 
	updatedAt: number;
}

// Interface for user data when creating/updating 
export type NewAuthUser = Omit<AuthUser, 'id' | 'createdAt' | 'updatedAt'> & {
	password: string;
};

// Interface for user data after being fetched from DB, excluding sensitive fields
export type SafeAuthUser = Omit<AuthUser, 'password' | 'twoFactorSecret'>;
