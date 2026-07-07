# AI Chatbot (Next.js 14 + Python Serverless API)

A clean, minimalist AI chatbot built with Next.js 14 (App Router, TypeScript, Tailwind CSS, shadcn/ui) and a Python serverless backend running on Vercel.

## Environment Variables

The following environment variables must be configured in the Vercel dashboard and local `.env` files:

- `SUPABASE_URL`: The API URL of your Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY`: The service role secret key for database authentication.
- `GEMINI_API_KEY`: API Key for Google Gemini (`gemini-3.1-flash-lite`).
- `GROQ_API_KEY`: API Key for Groq (`llama-3.3-70b-versatile`).
- `JWT_SECRET`: Secret key used to sign and verify JSON Web Tokens.

## How to Create the First Admin User in Supabase

Since the admin dashboard requires an existing admin to provision new user accounts, you must bootstrap your first admin user directly inside Supabase:

1. Generate a bcrypt password hash by running this Python command in your terminal:
   ```bash
   python -c "import bcrypt; print(bcrypt.hashpw(b'YOUR_PASSWORD_HERE', bcrypt.gensalt()).decode('utf-8'))"
   ```
2. Copy the generated hash.
3. Open the **SQL Editor** in your Supabase dashboard and execute the following query to insert the user record:
   ```sql
   INSERT INTO users (username, password_hash, is_admin)
   VALUES ('admin', 'YOUR_GENERATED_HASH_HERE', true);
   ```

## Database Schema Reference

Ensure you have the following tables set up in your Supabase database:

```sql
-- Users Table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Chats Table
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Messages Table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  model_used TEXT, -- nullable, only for assistant
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

## Local Development

To run both the Next.js frontend and the Python serverless backend locally, it is recommended to use the **Vercel CLI**, which simulates the production environment and routes API requests correctly:

1. Install the Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```
2. Create a local `.env` file at the root of the project with the required environment variables.
3. Run the development environment:
   ```bash
   vercel dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

To deploy the application directly to production on Vercel:

```bash
vercel --prod
```
