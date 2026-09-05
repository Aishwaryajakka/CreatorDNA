import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, LoaderCircle, Play, Youtube } from "lucide-react";
import { PageHeader, Panel } from "@/components/dna-ui";
import { authenticatedFetch } from "@/lib/supabase/client";

export const Route = createFileRoute("/import-youtube")({
  component: ImportYouTubePage,
});

type Channel = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  uploadsPlaylistId: string | null;
};
type Video = {
  id: string;
  title: string;
  description: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  playlistPosition?: number | null;
};
type Playlist = { id: string; title: string; thumbnailUrl: string | null; itemCount: number | null };
type Selection = { videoId: string; playlistId?: string; playlistTitle?: string; playlistPosition?: number | null };
type Status = "queued" | "importing" | "imported" | "already imported" | "failed";

function ImportYouTubePage() {
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [recentPageToken, setRecentPageToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistListPageToken, setPlaylistListPageToken] = useState<string | null>(null);
  const [playlistVideoPageToken, setPlaylistVideoPageToken] = useState<string | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([]);
  const [openPlaylist, setOpenPlaylist] = useState<Playlist | null>(null);
  const [view, setView] = useState<"recent" | "playlists">("recent");
  const [selected, setSelected] = useState<Map<string, Selection>>(new Map());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Map<string, Status>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await authenticatedFetch(url, init);
    const body = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(body.error ?? "YouTube request failed.");
    return body;
  }

  async function findChannel(event: React.FormEvent) {
    event.preventDefault();
    if (loading || !identifier.trim()) return;
    setLoading(true); setError(""); setNotice(""); setChannel(null); setVideos([]); setPlaylists([]); setSelected(new Map());
    try {
      const found = await getJson<Channel>(`/api/youtube/channel?identifier=${encodeURIComponent(identifier.trim())}`);
      setChannel(found);
      const [recent, playlistResponse] = await Promise.all([
        found.uploadsPlaylistId ? getJson<{ videos: Video[]; nextPageToken: string | null }>(`/api/youtube/videos?uploadsPlaylistId=${encodeURIComponent(found.uploadsPlaylistId)}`) : Promise.resolve({ videos: [], nextPageToken: null }),
        getJson<{ playlists: Playlist[]; nextPageToken: string | null }>(`/api/youtube/playlists?channelId=${encodeURIComponent(found.id)}`),
      ]);
      setView("recent"); setOpenPlaylist(null); setVideos(recent.videos); setRecentPageToken(recent.nextPageToken); setPlaylists(playlistResponse.playlists); setPlaylistListPageToken(playlistResponse.nextPageToken);
      await refreshImported(recent.videos.map((video) => video.id));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to find that channel."); }
    finally { setLoading(false); }
  }

  async function loadMoreRecent() {
    if (!channel?.uploadsPlaylistId || !recentPageToken || loading) return;
    setLoading(true); setError("");
    try {
      const response = await getJson<{ videos: Video[]; nextPageToken: string | null }>(`/api/youtube/videos?uploadsPlaylistId=${encodeURIComponent(channel.uploadsPlaylistId)}&pageToken=${encodeURIComponent(recentPageToken)}`);
      setVideos((current) => [...current, ...response.videos]); setRecentPageToken(response.nextPageToken); await refreshImported(response.videos.map((video) => video.id));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load more videos."); }
    finally { setLoading(false); }
  }

  async function loadMorePlaylists() {
    if (!channel?.id || !playlistListPageToken || loading) return;
    setLoading(true); setError("");
    try {
      const response = await getJson<{ playlists: Playlist[]; nextPageToken: string | null }>(`/api/youtube/playlists?channelId=${encodeURIComponent(channel.id)}&pageToken=${encodeURIComponent(playlistListPageToken)}`);
      setPlaylists((current) => [...current, ...response.playlists]); setPlaylistListPageToken(response.nextPageToken);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load more playlists."); }
    finally { setLoading(false); }
  }

  async function refreshImported(ids: string[]) {
    if (!ids.length) return;
    const query = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
    const response = await getJson<{ importedIds: string[] }>(`/api/youtube/imported?${query}`);
    setImportedIds((current) => new Set([...current, ...response.importedIds]));
  }

  async function openPlaylistDetails(playlist: Playlist) {
    setOpenPlaylist(playlist); setLoadingPlaylist(true); setError("");
    try {
      const response = await getJson<{ videos: Video[]; nextPageToken: string | null }>(`/api/youtube/playlist-videos?playlistId=${encodeURIComponent(playlist.id)}`);
      setPlaylistVideos(response.videos); setPlaylistVideoPageToken(response.nextPageToken); await refreshImported(response.videos.map((video) => video.id));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load playlist."); }
    finally { setLoadingPlaylist(false); }
  }

  async function loadMorePlaylistVideos() {
    if (!openPlaylist || !playlistVideoPageToken || loadingPlaylist) return;
    setLoadingPlaylist(true); setError("");
    try {
      const response = await getJson<{ videos: Video[]; nextPageToken: string | null }>(`/api/youtube/playlist-videos?playlistId=${encodeURIComponent(openPlaylist.id)}&pageToken=${encodeURIComponent(playlistVideoPageToken)}`);
      setPlaylistVideos((current) => [...current, ...response.videos]); setPlaylistVideoPageToken(response.nextPageToken); await refreshImported(response.videos.map((video) => video.id));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load more playlist videos."); }
    finally { setLoadingPlaylist(false); }
  }

  function toggle(video: Video, context?: Playlist) {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(video.id)) next.delete(video.id);
      else next.set(video.id, { videoId: video.id, ...(context ? { playlistId: context.id, playlistTitle: context.title, ...(video.playlistPosition !== undefined ? { playlistPosition: video.playlistPosition } : {}) } : {}) });
      return next;
    });
  }

  async function selectPlaylist() {
    if (!openPlaylist) return;
    setLoadingPlaylist(true);
    let allVideos = [...playlistVideos];
    let nextPageToken = playlistVideoPageToken;
    try {
      while (nextPageToken) {
        const response = await getJson<{ videos: Video[]; nextPageToken: string | null }>(`/api/youtube/playlist-videos?playlistId=${encodeURIComponent(openPlaylist.id)}&pageToken=${encodeURIComponent(nextPageToken)}`);
        allVideos = [...allVideos, ...response.videos];
        nextPageToken = response.nextPageToken;
      }
      setPlaylistVideos(allVideos);
      setPlaylistVideoPageToken(null);
      await refreshImported(allVideos.map((video) => video.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the full playlist.");
      setLoadingPlaylist(false);
      return;
    }
    setSelected((current) => {
      const next = new Map(current);
      const everySelected = allVideos.every((video) => next.has(video.id));
      for (const video of allVideos) {
        if (everySelected) next.delete(video.id);
        else next.set(video.id, { videoId: video.id, playlistId: openPlaylist.id, playlistTitle: openPlaylist.title, ...(video.playlistPosition !== undefined ? { playlistPosition: video.playlistPosition } : {}) });
      }
      return next;
    });
    setLoadingPlaylist(false);
  }

  async function importSelected() {
    if (!selected.size || loading) return;
    const ids = [...selected.keys()];
    setLoading(true); setError(""); setNotice("");
    setStatuses(new Map(ids.map((id) => [id, "importing" as Status])));
    try {
      const response = await getJson<{ imported: Array<{ videoId: string }>; skipped: Array<{ videoId: string }>; failed: Array<{ videoId: string; error: string }> }>("/api/youtube/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ selections: [...selected.values()] }) });
      const next = new Map<string, Status>();
      response.imported.forEach((item) => next.set(item.videoId, "imported"));
      response.skipped.forEach((item) => next.set(item.videoId, "already imported"));
      response.failed.forEach((item) => next.set(item.videoId, "failed"));
      setStatuses(next); setImportedIds((current) => new Set([...current, ...response.imported.map((item) => item.videoId)]));
      setNotice(`${response.imported.length} imported · ${response.skipped.length} already imported · ${response.failed.length} failed`);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to import selected videos."); }
    finally { setLoading(false); }
  }

  const playlistAllSelected = Boolean(openPlaylist && playlistVideos.length && playlistVideos.every((video) => selected.has(video.id)));
  const selectedCount = selected.size;
  const statusFor = (id: string): Status | null => statuses.get(id) ?? (importedIds.has(id) ? "already imported" : null);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Import YouTube" title="Bring your published videos into Creator DNA" subtitle="Connect a public YouTube channel. Creator DNA will use the real video metadata as source material for your memory, Story Map, and planning." />
      <Panel accent="var(--story)" className="p-6 sm:p-8">
        <form onSubmit={findChannel} className="flex flex-col gap-3 sm:flex-row">
          <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="https://youtube.com/@creator or @handle" className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3.5 text-sm outline-none focus:border-primary" />
          <button disabled={loading || !identifier.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"><Youtube className="h-4 w-4" />{loading ? "Finding…" : "Find Channel"}</button>
        </form>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        {notice ? <p className="mt-3 text-sm font-medium text-midnight">{notice}</p> : null}
      </Panel>

      {channel ? <>
        <Panel className="flex items-start gap-4 p-6">
          {channel.thumbnailUrl ? <img src={channel.thumbnailUrl} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-xl bg-muted"><Youtube className="h-7 w-7 text-muted-foreground" /></span>}
          <div className="min-w-0"><p className="eyebrow">Channel</p><h2 className="mt-1 text-xl font-bold text-midnight">{channel.title}</h2><p className="mt-1 text-xs text-muted-foreground">{channel.id}</p>{channel.description ? <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{channel.description}</p> : null}</div>
        </Panel>
        <div className="flex flex-wrap gap-2"><Tab active={view === "recent"} onClick={() => { setView("recent"); setOpenPlaylist(null); }}>Recent Videos</Tab><Tab active={view === "playlists"} onClick={() => { setView("playlists"); setOpenPlaylist(null); }}>Playlists</Tab></div>
        {view === "recent" ? <Panel className="p-6"><SectionHeader title="Recent Videos" count={videos.length} /><div className="mt-4 space-y-3">{videos.length ? videos.map((video) => <VideoRow key={video.id} video={video} checked={selected.has(video.id)} status={statusFor(video.id)} onToggle={() => toggle(video)} />) : <Empty text="No public videos were found for this channel." />}</div>{recentPageToken ? <LoadMore onClick={() => void loadMoreRecent()} loading={loading} label="Load more videos" /> : null}</Panel> : openPlaylist ? <Panel className="p-6"><button type="button" onClick={() => setOpenPlaylist(null)} className="text-xs font-semibold text-primary">← All playlists</button><SectionHeader title={openPlaylist.title} count={openPlaylist.itemCount} /><button type="button" onClick={() => void selectPlaylist()} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-midnight">{playlistAllSelected ? "Clear selection" : "Select entire playlist"}</button>{loadingPlaylist ? <p className="mt-5 text-sm text-muted-foreground">Loading playlist videos…</p> : <div className="mt-4 space-y-3">{playlistVideos.map((video) => <VideoRow key={video.id} video={video} checked={selected.has(video.id)} status={statusFor(video.id)} onToggle={() => toggle(video, openPlaylist)} />)}</div>}{playlistVideoPageToken ? <LoadMore onClick={() => void loadMorePlaylistVideos()} loading={loadingPlaylist} label="Load more playlist videos" /> : null}</Panel> : <Panel className="p-6"><SectionHeader title="Playlists" count={playlists.length} /><div className="mt-4 grid gap-3 md:grid-cols-2">{playlists.length ? playlists.map((playlist) => <button type="button" key={playlist.id} onClick={() => void openPlaylistDetails(playlist)} className="flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted/50">{playlist.thumbnailUrl ? <img src={playlist.thumbnailUrl} alt="" className="h-14 w-20 rounded-lg object-cover" /> : <span className="h-14 w-20 rounded-lg bg-muted" />}<span className="min-w-0"><span className="block truncate text-sm font-semibold text-midnight">{playlist.title}</span><span className="mt-1 block text-xs text-muted-foreground">{playlist.itemCount ?? ""} videos · Open playlist</span></span><ChevronDown className="ml-auto h-4 w-4 -rotate-90 text-muted-foreground" /></button>) : <Empty text="No public playlists were found for this channel." />}</div>{playlistListPageToken ? <LoadMore onClick={() => void loadMorePlaylists()} loading={loading} label="Load more playlists" /> : null}</Panel>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><button type="button" onClick={() => void importSelected()} disabled={!selectedCount || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-midnight px-5 py-3 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}Import selected ({selectedCount})</button>{notice ? <a href="/story-map" className="text-sm font-semibold text-primary">View Story Map →</a> : null}</div>
      </> : null}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2 text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{children}</button>; }
function SectionHeader({ title, count }: { title: string; count: number | null }) { return <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-midnight">{title}</h2>{count != null ? <span className="text-xs text-muted-foreground">{count} videos</span> : null}</div>; }
function VideoRow({ video, checked, status, onToggle }: { video: Video; checked: boolean; status: Status | null; onToggle: () => void }) { return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40"><input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 accent-primary" /><span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">{video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <Play className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-midnight">{video.title}</span><span className="mt-1 block text-xs text-muted-foreground">{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "Date unavailable"}{video.duration ? ` · ${video.duration}` : ""}</span></span>{status ? <span className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{status === "imported" ? <Check className="h-3.5 w-3.5" /> : null}{status}</span> : null}</label>; }
function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>; }
function LoadMore({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) { return <button type="button" onClick={onClick} disabled={loading} className="mt-5 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-midnight disabled:opacity-50">{loading ? "Loading…" : label}</button>; }
