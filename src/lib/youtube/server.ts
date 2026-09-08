/// <reference types="node" />

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeApiError extends Error {
  readonly status: number | undefined;
  readonly reason: string | undefined;

  constructor(
    message: string,
    options?: ErrorOptions & { status?: number; reason?: string },
  ) {
    super(message, options);
    this.name = "YouTubeApiError";
    this.status = options?.status;
    this.reason = options?.reason;
  }
}

function youtubeDiagnostic(
  step: string,
  details: { status?: number; reason?: string; message?: string } = {},
): void {
  if (process.env["NODE_ENV"] === "production") return;
  console.info("[youtube]", { step, ...details });
}

function getApiKey(): string {
  const key = process.env["YOUTUBE_API_KEY"];
  if (!key) throw new YouTubeApiError("YouTube import is not configured.");
  return key;
}

async function youtubeRequest<T>(
  resource: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}/${resource}`);
  url.search = new URLSearchParams({ ...params, key: getApiKey() }).toString();
  youtubeDiagnostic("upstream_request", { message: url.pathname });
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new YouTubeApiError("Unable to reach YouTube right now.", {
      cause: error,
    });
  }
  const body = (await response.json().catch(() => null)) as
    YouTubeErrorBody | T | null;
  if (!response.ok) {
    const reason = isYouTubeErrorBody(body)
      ? body.error?.errors?.[0]?.reason
      : undefined;
    const upstreamMessage = isYouTubeErrorBody(body)
      ? body.error?.message
      : undefined;
    youtubeDiagnostic("upstream_error", {
      status: response.status,
      ...(reason ? { reason } : {}),
      ...(upstreamMessage
        ? { message: upstreamMessage.replace(/[\r\n\t]+/g, " ").slice(0, 240) }
        : {}),
    });
    if (reason === "quotaExceeded") {
      throw new YouTubeApiError(
        "YouTube import quota has been reached. Try again later.",
        { status: response.status, reason },
      );
    }
    if (response.status === 404 || reason === "playlistNotFound") {
      throw new YouTubeApiError(
        "That YouTube channel or playlist was not found.",
        {
          status: response.status,
          ...(reason ? { reason } : {}),
        },
      );
    }
    throw new YouTubeApiError("YouTube could not return that data right now.", {
      status: response.status,
      ...(reason ? { reason } : {}),
    });
  }
  if (!body || isYouTubeErrorBody(body)) {
    youtubeDiagnostic("response_parse_failed", { status: response.status });
    throw new YouTubeApiError("YouTube returned an invalid response.");
  }
  youtubeDiagnostic("response_parse_succeeded", { status: response.status });
  return body;
}

type YouTubeErrorBody = {
  error?: { errors?: Array<{ reason?: string }>; message?: string };
};

function isYouTubeErrorBody(value: unknown): value is YouTubeErrorBody {
  return Boolean(value && typeof value === "object" && "error" in value);
}

type ChannelResponse = {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      description?: string;
      thumbnails?: ThumbnailSet;
    };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>;
};

type ThumbnailSet = Record<
  string,
  { url: string; width?: number; height?: number }
>;

export type YouTubeChannel = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  uploadsPlaylistId: string | null;
};

function firstThumbnail(thumbnails?: ThumbnailSet): string | null {
  return (
    thumbnails?.["high"]?.url ??
    thumbnails?.["medium"]?.url ??
    thumbnails?.["default"]?.url ??
    null
  );
}

export async function resolveYouTubeChannel(
  input: string,
): Promise<YouTubeChannel> {
  const identifier = input.trim();
  if (!identifier)
    throw new YouTubeApiError(
      "Enter a YouTube channel URL, handle, or channel ID.",
    );

  let id: string | undefined;
  let handle: string | undefined;
  let username: string | undefined;
  if (identifier.startsWith("UC") && !identifier.includes("/")) {
    id = identifier;
  } else if (identifier.startsWith("@")) {
    handle = identifier.slice(1);
  } else if (
    identifier.startsWith("http://") ||
    identifier.startsWith("https://")
  ) {
    let url: URL;
    try {
      url = new URL(identifier);
    } catch {
      throw new YouTubeApiError("Enter a valid YouTube channel URL.");
    }
    if (!/(^|\.)youtube\.com$/.test(url.hostname)) {
      throw new YouTubeApiError("Use a youtube.com channel URL.");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && parts[1]) id = parts[1];
    else if (parts[0]?.startsWith("@")) handle = parts[0].slice(1);
    else if (parts[0] === "user" && parts[1]) username = parts[1];
    else
      throw new YouTubeApiError(
        "Use a /@handle, /channel/ID, or /user/name URL.",
      );
  } else {
    handle = identifier.replace(/^@/, "");
  }

  const params = id
    ? { part: "snippet,contentDetails", id }
    : handle
      ? { part: "snippet,contentDetails", forHandle: handle }
      : { part: "snippet,contentDetails", forUsername: username! };
  const response = await youtubeRequest<ChannelResponse>("channels", params);
  const channel = response.items?.[0];
  if (!channel)
    throw new YouTubeApiError("No public YouTube channel matched that input.");
  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description ?? "",
    thumbnailUrl: firstThumbnail(channel.snippet.thumbnails),
    uploadsPlaylistId:
      channel.contentDetails?.relatedPlaylists?.uploads ?? null,
  };
}

type PlaylistResponse = {
  nextPageToken?: string;
  items?: Array<{
    id: string;
    snippet: { title: string; thumbnails?: ThumbnailSet };
    contentDetails?: { itemCount?: number };
  }>;
};

export type YouTubePlaylist = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  itemCount: number | null;
};

export async function listYouTubePlaylists(
  channelId: string,
  pageToken?: string,
): Promise<{ playlists: YouTubePlaylist[]; nextPageToken: string | null }> {
  const response = await youtubeRequest<PlaylistResponse>("playlists", {
    part: "snippet,contentDetails",
    channelId,
    maxResults: "50",
    ...(pageToken ? { pageToken } : {}),
  });
  return {
    playlists: (response.items ?? []).map((playlist) => ({
      id: playlist.id,
      title: playlist.snippet.title,
      thumbnailUrl: firstThumbnail(playlist.snippet.thumbnails),
      itemCount: playlist.contentDetails?.itemCount ?? null,
    })),
    nextPageToken: response.nextPageToken ?? null,
  };
}

type PlaylistItemResponse = {
  nextPageToken?: string;
  items?: Array<{
    snippet: {
      title: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      position?: number;
      resourceId?: { videoId?: string };
      thumbnails?: ThumbnailSet;
    };
    contentDetails?: { videoId?: string; videoPublishedAt?: string };
  }>;
};

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  playlistId?: string;
  playlistTitle?: string;
  playlistPosition?: number;
};

type VideoResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: ThumbnailSet;
    };
    contentDetails?: { duration?: string };
  }>;
};

function formatDuration(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function listPlaylistItems(
  playlistId: string,
  pageToken?: string,
): Promise<{ videos: YouTubeVideo[]; nextPageToken: string | null }> {
  const response = await youtubeRequest<PlaylistItemResponse>("playlistItems", {
    part: "snippet,contentDetails",
    playlistId,
    maxResults: "20",
    ...(pageToken ? { pageToken } : {}),
  });
  const raw: Array<Omit<YouTubeVideo, "duration"> & { id: string }> = [];
  for (const item of response.items ?? []) {
    const id = item.contentDetails?.videoId ?? item.snippet.resourceId?.videoId;
    if (!id) continue;
    raw.push({
      id,
      title: item.snippet.title,
      description: item.snippet.description ?? "",
      channelTitle: item.snippet.channelTitle ?? "",
      publishedAt:
        item.contentDetails?.videoPublishedAt ??
        item.snippet.publishedAt ??
        null,
      thumbnailUrl: firstThumbnail(item.snippet.thumbnails),
      ...(item.snippet.position !== undefined
        ? { playlistPosition: item.snippet.position }
        : {}),
    });
  }
  const durationById = new Map<string, string | null>();
  if (raw.length) {
    const details = await youtubeRequest<VideoResponse>("videos", {
      part: "contentDetails",
      id: raw.map((video) => video.id).join(","),
    });
    for (const video of details.items ?? []) {
      durationById.set(
        video.id,
        formatDuration(video.contentDetails?.duration),
      );
    }
  }
  return {
    videos: raw.map((video) => ({
      ...video,
      duration: durationById.get(video.id) ?? null,
    })),
    nextPageToken: response.nextPageToken ?? null,
  };
}

export async function listRecentYouTubeVideos(
  uploadsPlaylistId: string,
  pageToken?: string,
) {
  try {
    return await listPlaylistItems(uploadsPlaylistId, pageToken);
  } catch (error) {
    if (
      error instanceof YouTubeApiError &&
      error.reason === "playlistNotFound" &&
      uploadsPlaylistId.startsWith("UU")
    ) {
      youtubeDiagnostic("uploads_playlist_empty", {
        ...(error.status === undefined ? {} : { status: error.status }),
        reason: error.reason,
      });
      return { videos: [], nextPageToken: null };
    }
    throw error;
  }
}

export async function listYouTubePlaylistVideos(
  playlistId: string,
  pageToken?: string,
) {
  return listPlaylistItems(playlistId, pageToken);
}

export async function getYouTubeVideosById(
  ids: string[],
): Promise<YouTubeVideo[]> {
  if (!ids.length) return [];
  const response = await youtubeRequest<VideoResponse>("videos", {
    part: "snippet,contentDetails",
    id: ids.join(","),
  });
  return (response.items ?? []).map((video) => ({
    id: video.id,
    title: video.snippet?.title ?? "Untitled YouTube video",
    description: video.snippet?.description ?? "",
    channelTitle: video.snippet?.channelTitle ?? "",
    publishedAt: video.snippet?.publishedAt ?? null,
    thumbnailUrl: firstThumbnail(video.snippet?.thumbnails),
    duration: formatDuration(video.contentDetails?.duration),
  }));
}
