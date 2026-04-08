# Completely remove sign-in/sign-up screens and auth provider

**What's happening:** The sign-in and sign-up screens still exist as files in the project. Even though the main layout no longer uses authentication, Expo Router can still navigate to these screens, and on some devices the app may land on the sign-in page.

**What will be done:**

- Delete the sign-in screen
- Delete the sign-up screen
- Delete the authentication provider file
- Delete the Supabase utility file (if only used for auth)
- Ensure the app always goes straight to the game (kingdom select or continue) with no login required

