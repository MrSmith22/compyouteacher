import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { logActivity } from "@/lib/logActivity";
import { isDevAuthEnabled } from "@/lib/auth/devAuth";

const providers = [
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
];

if (isDevAuthEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "dev-credentials",
      name: "Development",
      credentials: {
        email: { label: "Email", type: "text" },
        secret: { label: "Dev secret", type: "password" },
      },
      async authorize(credentials) {
        const expectedSecret = process.env.DEV_AUTH_SECRET;

        if (!expectedSecret || credentials?.secret !== expectedSecret) {
          return null;
        }

        const email =
          credentials?.email?.trim() ||
          process.env.DEV_AUTH_EMAIL ||
          "dev-student@localhost";

        return {
          id: email,
          email,
          name: "Dev Student",
        };
      },
    })
  );
}

export const authOptions = {
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? user.email ?? token.sub;
        if (user.email) {
          token.email = user.email;
        }
        if (user.name) {
          token.name = user.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      if (token.email) {
        session.user.email = token.email;
      }
      if (token.name) {
        session.user.name = token.name;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl + "/dashboard";
    },
  },
  events: {
    async signIn({ user, account }) {
      if (user?.email) {
        await logActivity(user.email, "login", {
          metadata: {
            via: account?.provider === "dev-credentials" ? "dev_credentials" : "google_oauth",
          },
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
