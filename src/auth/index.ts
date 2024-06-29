import { isPathProtected } from '@/site/paths';
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GithubProvider from "next-auth/providers/github";


export const KEY_CREDENTIALS_SIGN_IN_ERROR = 'CredentialsSignin';
export const KEY_CREDENTIALS_SIGN_IN_ERROR_URL =
  'https://errors.authjs.dev#credentialssignin';
export const KEY_CALLBACK_URL = 'callbackUrl';

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    // GithubProvider,
    Credentials({
      async authorize({ email, password }) {
        if (
          process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email &&
          process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === password
        ) {
          const user: User = { email, name: 'Admin User' };
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // async redirect({ url, baseUrl }) {
    //   console.log('Redirecting to:', url);
    //   console.log('Base URL:', baseUrl);
    //   if (url.startsWith('/')) return `${baseUrl}${url}`;
    //   else if (new URL(url).origin === baseUrl) return url;
    //   return baseUrl;
    // },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      const isUrlProtected = isPathProtected(pathname);
      const isUserLoggedIn = !!auth?.user;
      //  用户登录，或者不是保护路径则true
      const isRequestAuthorized = !isUrlProtected || isUserLoggedIn;

      return isRequestAuthorized;
    },
    // jwt({ token, trigger, session }) {
    //   if (trigger === 'update') token.name = session.user.name
    //   return token
    // },
  },
  pages: {
    signIn: '/sign-in',
  },
});

/**
 * 执行adminserver action
 * @param callback 
 * @returns 
 */
export const safelyRunAdminServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  if (session?.user) {
    return callback();
  } else {
    throw new Error('Unauthorized server action request');
  }
};

/**
 * 生成 authSecret
 * @returns 
 */
export const generateAuthSecret = () => fetch(
  'https://generate-secret.vercel.app/32',
  { cache: 'no-cache' },
).then(res => res.text());
