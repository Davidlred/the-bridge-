import { UserState } from "../types";

const USERS_KEY = 'bridge_users_db';
const SESSION_KEY = 'bridge_active_session';
const DATA_PREFIX = 'bridge_data_';

interface UserProfile {
  email: string;
  password: string; // In a real app, this would be hashed
  createdAt: number;
}

export const authService = {
  // --- AUTHENTICATION ---

  signUp: (email: string, password: string): Promise<UserProfile> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const existing = users.find((u: UserProfile) => u.email === email);

        if (existing) {
          reject(new Error('User already exists'));
          return;
        }

        const newUser: UserProfile = { email, password, createdAt: Date.now() };
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // Auto sign in
        localStorage.setItem(SESSION_KEY, email);
        
        // Simulate sending email
        console.log(`[The Bridge System] sending verification email to ${email}`);
        
        resolve(newUser);
      }, 800); // Simulate network delay
    });
  },

  signIn: (email: string, password: string): Promise<UserProfile> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const user = users.find((u: UserProfile) => u.email === email && u.password === password);

        if (user) {
          localStorage.setItem(SESSION_KEY, email);
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  },

  signOut: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): string | null => {
    return localStorage.getItem(SESSION_KEY);
  },

  // --- DATA PERSISTENCE (MOCK DATABASE) ---

  saveUserData: (email: string, data: UserState) => {
    localStorage.setItem(`${DATA_PREFIX}${email}`, JSON.stringify(data));
  },

  loadUserData: (email: string): UserState => {
    const data = localStorage.getItem(`${DATA_PREFIX}${email}`);
    if (data) {
      return JSON.parse(data);
    }
    // Default initial state for new users
    return {
      userImageBase64: null,
      goals: []
    };
  }
};