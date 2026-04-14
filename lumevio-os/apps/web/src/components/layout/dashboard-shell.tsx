import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={styles.wrap}>
      <Sidebar />
      <div style={styles.content}>
        <Topbar />
        <div style={styles.inner}>{children}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    minHeight: "100vh",
    background: "#05051b",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  inner: {
    padding: "0 28px 28px 28px",
  },
};