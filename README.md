# Journal App

A social journaling app built with Next.js and Supabase. Users can create text, audio, photo, and video journal entries with optional geolocation. Entries can be made public to appear in a shared feed and on a community map.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth & Database:** Supabase (Auth, Postgres, Storage)
- **Styling:** Tailwind CSS 4
- **Maps:** Leaflet / react-leaflet / react-leaflet-cluster
- **Language:** TypeScript

## Features

- Email/password authentication
- Journal entries with text, audio, photo, or video
- In-browser camera and microphone capture
- Geolocation tagging with interactive map
- Public/private entry visibility toggle
- Public feed showing entries from all users
- Map view with blue pins (own entries) and red pins (others' public entries)
- Marker clustering: nearby pins group into a count circle, expanding into individual pins on zoom
- Warm-styled map popups with image/video previews, earth-tone badges, and "View entry" links
- "Back to Map" navigation from entry detail page that re-opens the originating popup
- Media previews (image thumbnails, video with play overlay) on entry cards in feed and journal
- Masonry/waterfall layout on the public feed for varied card heights
- User profiles with unique usernames
- Settings page to change username
- Debug page to manage user accounts

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in your Supabase dashboard under **Project Settings > API**.

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `anon` public key
- `SUPABASE_SERVICE_ROLE_KEY` — `service_role` secret key (required for the debug page)

### 3. Supabase setup (manual steps)

The following must be done manually in the **Supabase Dashboard**.

#### 3a. Create a storage bucket

1. Go to **Storage** and create a new bucket named `journal-media`
2. Set it to **private**

#### 3b. Run SQL migrations

Go to **SQL Editor** and run the following:

```sql
-- Create journal_entries table
CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('text', 'audio', 'picture', 'video')),
  text_content text,
  media_url text,
  latitude double precision,
  longitude double precision,
  public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own entries and any public entries
CREATE POLICY "Users can read own and public entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id OR public = true);

-- Users can insert their own entries
CREATE POLICY "Users can insert own entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (needed to display usernames)
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 3c. (Optional) Disable email confirmation for development

Go to **Authentication > Providers > Email** and turn off **"Confirm email"** to skip email verification during development.

#### 3d. Backfill profiles for existing users

If you have users that were created before the `profiles` table was set up, run this in the SQL Editor:

```sql
INSERT INTO profiles (id, username)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

The project uses [Vitest](https://vitest.dev) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit and component tests.

```bash
# Run tests in watch mode
npm test

# Run tests once (CI-friendly)
npm run test:run

# Run tests with verbose output
npx vitest run --reporter=verbose
```

Tests are located in `src/__tests__/` and cover utility functions, hooks, components, API routes, and middleware.

## Pages

| Route | Description |
|---|---|
| `/auth/login` | Sign in |
| `/auth/signup` | Create account |
| `/dashboard` | Your journal entries |
| `/dashboard/new` | Create a new entry |
| `/dashboard/entry/[id]` | View an entry |
| `/dashboard/feed` | Public entries from all users |
| `/dashboard/map` | Map view of geotagged entries |
| `/dashboard/settings` | Change your username |
| `/dashboard/debug` | Admin: list and delete user accounts |
