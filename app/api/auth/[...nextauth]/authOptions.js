import GoogleProvider from "next-auth/providers/google";

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
  },
  // keep any other callbacks/settings you had – for example redirect:
  // redirect({ url, baseUrl }) {
  //   return url.startsWith(baseUrl) ? url : baseUrl + "/dashboard";
  // },

  secret: process.env.NEXTAUTH_SECRET,
};