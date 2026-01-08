import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDB } from "@/app/utils/database";
import User from "@/app/models/User";

async function firebasePasswordLogin(email, password) {
  const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await res.json();

  if (data.error) throw new Error(data.error.message);

  return data; // contains idToken, localId, email, etc.
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        // Firebase password login with REST API
        const fb = await firebasePasswordLogin(email, password);

        // Sync with MongoDB
        await connectToDB();
        let user = await User.findOne({ email: fb.email });

        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fb.localId}`;

        if (!user) {
          user = await User.create({
            email: fb.email,
            firebaseUid: fb.localId,
            username: fb.email.split("@")[0],
            image: avatar,
          });
        }

        return {
          id: user._id.toString(),
          email: fb.email,
          name: user.username,
          image: user.image || avatar,
          firebaseUid: fb.localId,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        await connectToDB();
        const dbUser = await User.findOne({ email: user.email });

        token.id = dbUser._id.toString();
        token.role = dbUser.role || "user";
        token.firebaseUid = dbUser.firebaseUid;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.firebaseUid = token.firebaseUid;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Check if redirecting after sign-in
      if (url.startsWith(baseUrl)) return url;

      // Default redirect
      return baseUrl;
    },

    async signIn({ account, profile, user }) {
      await connectToDB();

      if (account?.provider === "google") {
        const existing = await User.findOne({ email: profile.email });

        if (!existing) {
          await User.create({
            email: profile.email,
            username: profile.name.replace(/\s+/g, "").toLowerCase(),
            googleId: profile.sub,
            image: profile.picture,
            role: "user",
          });
        } else {
          // Attach role to user object for redirect logic
          user.role = existing.role;
        }
      }

      // For credentials provider, fetch role
      if (account?.provider === "credentials") {
        const dbUser = await User.findOne({ email: user.email });
        user.role = dbUser?.role || "user";
      }

      return true;
    },
  },
  pages: {
    signIn: "/account",
    error: "/account",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
