import GoogleProvider from "next-auth/providers/google";
import { logActivity } from "@/lib/logActivity";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // keep your user id on the session (as you had)
      session.user.id = token.sub;
      return session;
    },
    redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl + "/dashboard";
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.email) {
        await logActivity(user.email, "login", {
          metadata: { via: "google_oauth" },
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};