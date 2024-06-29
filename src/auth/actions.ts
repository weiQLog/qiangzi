'use server';

import {
  KEY_CALLBACK_URL,
  KEY_CREDENTIALS_SIGN_IN_ERROR,
  KEY_CREDENTIALS_SIGN_IN_ERROR_URL,
  signIn,
  signOut,
} from '@/auth';
import { PATH_ADMIN_PHOTOS } from '@/site/paths';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { redirect } from 'next/navigation';

export const signInAction = async (
  _prevState: string | undefined,
  formData: FormData,
) => {
  try {
    await signIn('credentials', Object.fromEntries(formData));
    // console.log("登录");
    // await signIn('github');
  } catch (error) {
    console.log("出错", error)
    if (
      `${error}`.includes(KEY_CREDENTIALS_SIGN_IN_ERROR) || 
      `${error}`.includes(KEY_CREDENTIALS_SIGN_IN_ERROR_URL)
    ) {
      // Return credentials error to display on sign-in page.
      console.log("KEY_CREDENTIALS_SIGN_IN_ERROR", KEY_CREDENTIALS_SIGN_IN_ERROR);
      return KEY_CREDENTIALS_SIGN_IN_ERROR;
    } else if (!`${error}`.includes('NEXT_REDIRECT')) {
      console.log('Unknown sign in error:', {
        errorText: `${error}`,
        error,
      });
      // Rethrow non-redirect errors
      throw error;
    }
  }
  redirect(formData.get(KEY_CALLBACK_URL) as string || PATH_ADMIN_PHOTOS);
};

export const signOutAction = async () => {
  console.log("登出")
  let res = await signOut();
  console.log("登出", res)
};
