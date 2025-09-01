# Task Manager App

A simple **Task Manager** application where users can manage their tasks efficiently.
Users can **add, edit, and delete tasks**, with authentication handled via Supabase.

## Features

* User authentication with Supabase
* Add, edit, and delete tasks
* Responsive and easy-to-use interface
* Password reset support

---

## Getting Started

Follow these steps to set up the project locally.

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase database

1. **Create a Supabase project**
   Go to [Supabase](https://supabase.com/) and create a new project.

2. **Run database schema**
   Open the SQL Editor in Supabase and run the commands from:

   ```
   /database/schema.sql
   ```

3. **Configure authentication**
   In Supabase Dashboard:

   * Navigate to **Authentication → Settings → Site URL**
   * Add your site URL (e.g., `http://localhost:3000`)
   * Add a redirect URL for password reset (e.g., `http://localhost:3000/reset-password`)

4. **Update environment variables**
   Create a `.env` file at the root of your project and add:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Start the development server

```bash
npm run dev
```

Visit `http://localhost:3000` (might be different for you) in your browser to see the app running.