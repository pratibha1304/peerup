"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

type UserSettings = {
  emailUpdates: boolean
  matchAlerts: boolean
  callReminders: boolean
  digestFrequency: 'daily' | 'weekly' | 'off'
  profileVisibility: 'community' | 'matches-only'
  timezone: string
}

interface User {
  uid: string;
  email: string;
  password?: string; // Add password field
  name: string;
  role: 'mentor' | 'buddy' | 'mentee';
  age?: string;
  location?: string;
  linkedin?: string;
  skills?: string[];
  interests?: string[];
  goals?: string;
  availability?: string[];
  interaction?: string;
  profilePicUrl?: string;
  resumeUrl?: string;
  settings?: UserSettings;
  status: 'active' | 'pending_review';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: Omit<User, 'uid' | 'createdAt' | 'status'>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
          } else {
            // User doesn't exist in Firestore, create basic profile
            const basicUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: 'buddy',
              profilePicUrl: firebaseUser.photoURL || '',
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), basicUser);
            setUser(basicUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          // Still set a basic user to prevent blocking authentication
          const basicUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'buddy',
            profilePicUrl: firebaseUser.photoURL || '',
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          setUser(basicUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (userData: Omit<User, 'uid' | 'createdAt' | 'status'>) => {
    try {
      // Create Firebase auth user with the actual password
      const password = userData.password || userData.email; // Use provided password or fallback to email
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      
      // Create user document in Firestore (without password)
      const { password: _, ...userDataWithoutPassword } = userData;
      const newUser: User = {
        ...userDataWithoutPassword,
        uid: userCredential.user.uid,
        status: userData.role === 'mentor' ? 'pending_review' : 'active',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('User must be authenticated to update profile');
    }
    if (!user.uid) {
      throw new Error('User UID is missing');
    }
    try {
      console.log('Updating Firestore document:', user.uid, updates);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      console.log('Firestore update successful');
      setUser({ ...user, ...updates });
      console.log('User state updated');
    } catch (error: any) {
      console.error('Profile update error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. You may not have permission to update this profile.');
      } else if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(error.message || 'Failed to update profile');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 