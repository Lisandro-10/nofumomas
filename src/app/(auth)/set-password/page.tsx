import SetPasswordClient from "./_components/SetPasswordClient";

export default function SetPasswordPage({
  searchParams,
}: {
  searchParams: { oobCode?: string; email?: string; mode?: string; firstTime?: string; expired?: string };
}) {
  return (
    <SetPasswordClient
      oobCode={searchParams.oobCode ?? ""}
      email={searchParams.email ?? ""}
      mode={searchParams.mode}
      firstTime={searchParams.firstTime !== "false"}
      initialExpired={searchParams.expired === "true"}
    />
  );
}
