# Next.js Todo App with Neon & Drizzle

A modern, simple Todo application built with:
- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Database:** [Neon Postgres](https://neon.tech/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Driver:** `@neondatabase/serverless` (HTTP)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## Features
- CRUD operations with Next.js Server Actions
- Persistent storage on Neon Postgres
- Responsive and clean UI with Tailwind CSS
- Real-time UI updates via `revalidatePath`

---

## Local Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd nextjs-todo
```

### 2. Install dependencies
```bash
npm install
```

### 3. Database Configuration
1. Create a [Neon](https://neon.tech/) account and a new project.
2. Copy the **Connection String** from the Neon console: 
   ```bash
   npx neonctl@latest init
   ```
3. Create a `.env` file in the root directory and paste your connection string:
   ```env
   DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
   ```

### 4. Run Migrations
Generate and run migrations to set up your database schema:
```bash
npx drizzle-kit push
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Server Deployment (Vercel)

### 1. Push to GitHub
Create a new repository on GitHub and push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [Vercel](https://vercel.com/) and click **New Project**.
2. Import your GitHub repository.
3. In the **Environment Variables** section, add `DATABASE_URL` with your Neon connection string.
4. Click **Deploy**.

Vercel will automatically build and deploy your application. Subsequent pushes to `main` will trigger automatic redeployments.

---

## Tech Stack Notes
- **Hosting:** Vercel Hobby tier is used for seamless Git-to-Deploy workflow.
- **Neon Driver:** We use `@neondatabase/serverless` with HTTP connection to avoid connection overhead and handle "sleeping" databases gracefully.
- **Drizzle Kit:** Used for schema management and quick prototyping via `drizzle-kit push`.
