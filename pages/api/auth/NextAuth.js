import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', credentials.username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          return null;
        }
        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data();
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }
        const { password, ...userWithoutPass } = user;
        userWithoutPass.id = userDoc.id;
        return userWithoutPass;
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});
