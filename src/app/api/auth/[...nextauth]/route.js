// lib/auth.js or pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { connectToDB } from "@/app/utils/database";
import User from "@/app/models/User";
// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          const { email, password } = credentials;

          if (!email || !password) {
            throw new Error("Email and password are required");
          }

          // Sign in with Firebase
          const userCredential = await signInWithEmailAndPassword(
            firebaseAuth,
            email,
            password
          );

          const firebaseUser = userCredential.user;

          // Generate avatar URL if no photoURL exists
          const avatarUrl =
            firebaseUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`;

          // Store/update user in MongoDB
          await connectToDB();
          let user = await User.findOne({ email: firebaseUser.email });

          if (!user) {
            user = await User.create({
              email: firebaseUser.email,
              username:
                firebaseUser.displayName?.replace(/\s+/g, "").toLowerCase() ||
                email.split("@")[0],
              firebaseUid: firebaseUser.uid,
              image: avatarUrl,
            });
          }

          return {
            id: user._id.toString(),
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            image: avatarUrl,
            firebaseUid: firebaseUser.uid,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error(error.message);
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      await connectToDB();
      const sessionUser = await User.findOne({ email: session.user.email });
      if (sessionUser) {
        session.user.id = sessionUser._id.toString();
        session.user.firebaseUid = sessionUser.firebaseUid;
      }
      return session;
    },
    async signIn({ account, profile, user, credentials }) {
      try {
        await connectToDB();

        // Handle Google OAuth
        if (account?.provider === "google") {
          const userExists = await User.findOne({ email: profile.email });
          if (!userExists) {
            await User.create({
              email: profile.email,
              username: profile.name.replace(/\s+/g, "").toLowerCase(),
              image: profile.picture,
              googleId: profile.sub,
            });
          } else {
            // Update with Google info if needed
            await User.findByIdAndUpdate(userExists._id, {
              googleId: profile.sub,
              image: profile.picture || userExists.image,
            });
          }
        }

        // Ensure all users have an image
        if (user?.email) {
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser && !dbUser.image) {
            dbUser.image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbUser._id}`;
            await dbUser.save();
          }
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/account",
    error: "/account",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
