import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Dashboard } from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return <Dashboard user={session.user} />;
  }

  return <LandingPage />;
}
