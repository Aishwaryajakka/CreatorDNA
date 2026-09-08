import { createFileRoute, redirect } from "@tanstack/react-router";

import { YouTubeImportWorkspace } from "@/components/import/YouTubeImportWorkspace";

export const Route = createFileRoute("/import-youtube")({
  beforeLoad: () => {
    throw redirect({ to: "/import", search: { source: "youtube" } });
  },
  component: YouTubeImportWorkspace,
});
