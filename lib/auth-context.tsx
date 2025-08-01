"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  uid: string;
  email: string;
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
  status: 'active' | 'pending_review';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: Omit<User, 'uid' | 'createdAt' | 'status'>) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('peerup_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('peerup_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, accept any email/password combination
    // In a real app, you'd validate against a backend
    const fakeUser: User = {
      uid: `user_${Date.now()}`,
      email,
      name: email.split('@')[0], // Use email prefix as name
      role: 'buddy',
      age: '25',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/user',
      skills: ['javascript', 'react', 'python'],
      interests: ['web development', 'AI', 'startups'],
      goals: 'Build a successful tech career and help others grow',
      availability: ['monday', 'wednesday', 'friday'],
      interaction: 'video',
      profilePicUrl: '',
      resumeUrl: '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    setUser(fakeUser);
    localStorage.setItem('peerup_user', JSON.stringify(fakeUser));
  };

  const signUp = async (userData: Omit<User, 'uid' | 'createdAt' | 'status'>) => {
    // Simulate registration delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newUser: User = {
      ...userData,
      uid: `user_${Date.now()}`,
      status: userData.role === 'mentor' ? 'pending_review' : 'active',
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem('peerup_user', JSON.stringify(newUser));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('peerup_user');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('peerup_user', JSON.stringify(updatedUser));
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