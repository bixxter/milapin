import { auth } from "./auth";

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session as typeof session & { user: { id: string; email: string; name: string } };
}
