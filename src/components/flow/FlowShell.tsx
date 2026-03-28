import FlowHeader from "./FlowHeader";
import FlowFooter from "./FlowFooter";

interface FlowShellProps {
  children: React.ReactNode;
}

export default function FlowShell({ children }: FlowShellProps) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <FlowHeader />
      <main className="flex-grow flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <FlowFooter />
    </div>
  );
}
