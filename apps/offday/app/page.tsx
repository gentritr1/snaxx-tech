import Dashboard from "@/components/dashboard";
import { getWorkspace } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <Dashboard initial={await getWorkspace()} />;
}
