# Cloud Saves with Supabase

**What changes**

- Connect the game to your Supabase project so game state is saved and loaded from the cloud instead of local storage
- Every time you end a turn or the game auto-saves, it writes to Supabase
- When you open the app, it loads your latest cloud save

**How it works**

- A new Supabase helper is added that talks to your "Realm of Crowns" project using the anon key you provided
- Game saves are stored in a Supabase table (created via the app on first use if needed, using Supabase's REST API)
- Each device gets a unique device ID so saves are tied to it (no sign-in required for now)
- Local AsyncStorage is no longer used for game saves — everything goes through Supabase
- If the cloud is unreachable, the game still works and retries saving when connection returns

**What stays the same**

- All gameplay, screens, and visuals remain unchanged
- The save/load flow feels identical to the player — just backed by the cloud now

