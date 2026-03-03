import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { pool } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !account.providerAccountId) {
        return false;
      }

      // Upsert user by google_id
      const result = await pool.query(
        `INSERT INTO users (google_id, email, name, avatar_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (google_id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = now()
         RETURNING id`,
        [
          account.providerAccountId,
          user.email ?? "",
          user.name ?? "",
          user.image ?? "",
        ]
      );

      const userId = result.rows[0].id;

      // Auto-create default board on first sign-in
      const boards = await pool.query(
        `SELECT id FROM boards WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      if (boards.rows.length === 0) {
        await pool.query(
          `INSERT INTO boards (user_id, name) VALUES ($1, 'My Board')`,
          [userId]
        );
      }

      return true;
    },

    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        // On initial sign-in, attach user_id to token
        const result = await pool.query(
          `SELECT id FROM users WHERE google_id = $1`,
          [account.providerAccountId]
        );
        if (result.rows.length > 0) {
          token.userId = result.rows[0].id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
