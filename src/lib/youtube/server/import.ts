import {
  addContentItemPlaylistAssociations,
  getContentItemByExternalId,
} from "@/lib/creator-dna/repository";
import { saveCreatorContentAndDNA } from "@/lib/creator-dna/server/save-content";
import { getYouTubeVideosById, type YouTubeVideo } from "../server";

export type YouTubeImportSelection = {
  videoId: string;
  playlistId?: string;
  playlistTitle?: string;
  playlistPosition?: number | null;
};

export type YouTubeImportResult = {
  imported: Array<{ videoId: string; title: string; contentId: string }>;
  skipped: Array<{ videoId: string; reason: "already imported" }>;
  failed: Array<{ videoId: string; error: string }>;
};

const MAX_BATCH_SIZE = 25;

function buildRawText(video: YouTubeVideo): string {
  const lines = [`Title: ${video.title}`];
  if (video.description.trim()) lines.push(`Description: ${video.description.trim()}`);
  if (video.publishedAt) lines.push(`Published: ${video.publishedAt}`);
  lines.push(`Source: https://www.youtube.com/watch?v=${video.id}`);
  if (video.playlistTitle) lines.push(`Playlist: ${video.playlistTitle}`);
  return lines.join("\n");
}

export async function importYouTubeVideos(
  selections: YouTubeImportSelection[],
  userId: string,
): Promise<YouTubeImportResult> {
  const uniqueSelections = Array.from(
    new Map(selections.map((selection) => [selection.videoId, selection])).values(),
  );
  if (!uniqueSelections.length) throw new Error("Select at least one video to import.");
  if (uniqueSelections.length > MAX_BATCH_SIZE) {
    throw new Error(`Select no more than ${MAX_BATCH_SIZE} videos at a time.`);
  }

  const videos = await getYouTubeVideosById(uniqueSelections.map((selection) => selection.videoId));
  const videosById = new Map(videos.map((video) => [video.id, video]));
  const result: YouTubeImportResult = { imported: [], skipped: [], failed: [] };

  for (const selection of uniqueSelections) {
    const video = videosById.get(selection.videoId);
    if (!video) {
      result.failed.push({ videoId: selection.videoId, error: "Video is unavailable or private." });
      continue;
    }
    try {
      const existing = await getContentItemByExternalId(userId, "youtube", video.id);
      if (existing) {
        result.skipped.push({ videoId: video.id, reason: "already imported" });
        continue;
      }
      const playlistTitle = selection.playlistTitle?.trim();
      const saved = await saveCreatorContentAndDNA(
        {
          title: video.title,
          platform: "YouTube",
          publishedAt: video.publishedAt,
          rawText: buildRawText(video),
          external: {
            source: "youtube",
            id: video.id,
            url: `https://www.youtube.com/watch?v=${video.id}`,
          },
        },
        userId,
      );
      if (playlistTitle && selection.playlistId) {
        await addContentItemPlaylistAssociations(saved.contentItem.id, userId, [
          {
            playlistId: selection.playlistId,
            playlistTitle,
            ...(selection.playlistPosition !== undefined
              ? { playlistPosition: selection.playlistPosition }
              : {}),
          },
        ]);
      }
      result.imported.push({ videoId: video.id, title: video.title, contentId: saved.contentItem.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      if (message.toLowerCase().includes("duplicate") || message.includes("unique")) {
        result.skipped.push({ videoId: video.id, reason: "already imported" });
      } else {
        result.failed.push({ videoId: video.id, error: "This video could not be imported. Try again later." });
      }
    }
  }
  return result;
}
