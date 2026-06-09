import "../../styles/app.css";
import "../../styles/modal.css";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { getSessionContext } from "@/lib/data/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  return (
    <div className="app">
      <Sidebar ctx={ctx} />
      <div className="main">
        <Topbar ctx={ctx} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
