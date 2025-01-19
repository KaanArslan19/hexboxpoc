/* import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          placeholder: "0x0",
          type: "text",
        },
        signature: {
          label: "Signature",
          placeholder: "0x0",
          type: "text",
        },
      },
      async authorize(credentials, req) {
        console.log("Starting authorization...");
        try {
          if (!credentials?.message || !credentials?.signature) {
            console.error("Missing credentials");
            return null;
          }

          // Log the raw message for debugging
          console.log("Raw message:", credentials.message);

          let siweMessage;
          try {
            // Check if the message is already a SiweMessage instance
            if (typeof credentials.message === "string") {
              // Try parsing if it's a string
              const parsedMessage = credentials.message.startsWith("{")
                ? JSON.parse(credentials.message)
                : credentials.message;
              siweMessage = new SiweMessage(parsedMessage);
            } else {
              // If it's already an object, use it directly
              siweMessage = new SiweMessage(credentials.message);
            }
          } catch (e) {
            console.error("Error parsing SIWE message:", e);
            return null;
          }

          console.log("SIWE Message:", siweMessage);

          const nextAuthUrl =
            process.env.NEXTAUTH_URL ||
            (process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : null);

          console.log("NextAuth URL:", nextAuthUrl);

          if (!nextAuthUrl) {
            console.error("No nextAuthUrl found");
            return null;
          }

          const nextAuthHost = new URL(nextAuthUrl).host;
          console.log("Domain check:", {
            messageDomain: siweMessage.domain,
            expectedDomain: nextAuthHost,
          });

          if (siweMessage.domain !== nextAuthHost) {
            console.error("Domain mismatch");
            return null;
          }

          const nonce = await getCsrfToken({ req: { headers: req.headers } });
          console.log("Nonce check:", {
            messageNonce: siweMessage.nonce,
            expectedNonce: nonce,
          });

          if (siweMessage.nonce !== nonce) {
            console.error("Nonce mismatch");
            return null;
          }

          const verifyResult = await siweMessage.verify({
            signature: credentials.signature,
            domain: nextAuthHost,
          });
          console.log("Verification result:", verifyResult);

          if (!verifyResult.success) {
            console.error("Verification failed:", verifyResult);
            return null;
          }

          return {
            id: siweMessage.address,
          };
        } catch (e) {
          console.error("Authorization error:", e);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },

  debug: process.env.NODE_ENV === "development",

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      session.address = token.sub;
      session.user = {
        name: token.sub,
      };
      return session;
    },
  },
};
 */
