import { mkdir, writeFile, readdir, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CHUNKS_BASE_DIR = join(tmpdir(), "miracletree-chunks");
const STALE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Validates and sanitizes the uploadId to prevent directory traversal.
 */
export function sanitizeUploadId(uploadId) {
  if (typeof uploadId !== "string") {
    throw new Error("Invalid upload session ID.");
  }
  const clean = uploadId.replace(/[^a-zA-Z0-9_\-]/g, "");
  if (!clean || clean.length < 6 || clean.length > 80) {
    throw new Error("Invalid upload session ID format.");
  }
  return clean;
}

/**
 * Returns the directory path for an upload session.
 */
export function getUploadDir(uploadId) {
  const safeId = sanitizeUploadId(uploadId);
  return join(CHUNKS_BASE_DIR, safeId);
}

/**
 * Returns a sorted list of chunk indices already saved on disk for this uploadId.
 */
export async function getReceivedChunks(uploadId) {
  try {
    const dir = getUploadDir(uploadId);
    const entries = await readdir(dir);
    const chunkIndices = [];

    for (const name of entries) {
      const match = /^chunk_(\d{6})$/.exec(name);
      if (match) {
        chunkIndices.push(parseInt(match[1], 10));
      }
    }

    return chunkIndices.sort((a, b) => a - b);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Saves a single chunk buffer to disk.
 */
export async function saveChunk({ uploadId, chunkIndex, totalChunks, chunkBuffer }) {
  if (typeof chunkIndex !== "number" || chunkIndex < 0 || chunkIndex >= totalChunks) {
    throw new Error(`Invalid chunk index ${chunkIndex} (total: ${totalChunks})`);
  }
  if (!Buffer.isBuffer(chunkBuffer) || chunkBuffer.length === 0) {
    throw new Error("Empty chunk payload received.");
  }

  const dir = getUploadDir(uploadId);
  await mkdir(dir, { recursive: true });

  const chunkFileName = `chunk_${chunkIndex.toString().padStart(6, "0")}`;
  const filePath = join(dir, chunkFileName);

  await writeFile(filePath, chunkBuffer);

  // Opportunistic stale chunk cleanup in background (non-blocking)
  scheduleCleanup();

  return { success: true, chunkIndex };
}

/**
 * Checks whether all chunks [0..totalChunks-1] have been successfully saved.
 */
export async function isUploadComplete(uploadId, totalChunks) {
  const received = await getReceivedChunks(uploadId);
  if (received.length < totalChunks) return false;

  // Verify all contiguous chunks from 0 to totalChunks - 1 are present
  const set = new Set(received);
  for (let i = 0; i < totalChunks; i++) {
    if (!set.has(i)) return false;
  }
  return true;
}

/**
 * Concatenates all chunks in order into a single Buffer and cleans up the temporary files.
 */
export async function assembleChunks(uploadId, totalChunks) {
  const dir = getUploadDir(uploadId);
  const buffers = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunkFileName = `chunk_${i.toString().padStart(6, "0")}`;
    const filePath = join(dir, chunkFileName);
    const buffer = await readFile(filePath);
    buffers.push(buffer);
  }

  const completeBuffer = Buffer.concat(buffers);

  // Clean up the upload directory
  try {
    await rm(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[chunk-upload] Failed to clean up temp dir ${dir}:`, err?.message);
  }

  return completeBuffer;
}

/**
 * Removes temporary upload directory on abort or error.
 */
export async function cancelChunkUpload(uploadId) {
  try {
    const dir = getUploadDir(uploadId);
    await rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

let lastCleanup = 0;
function scheduleCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 15 * 60 * 1000) return; // run at most every 15 minutes
  lastCleanup = now;

  setTimeout(async () => {
    try {
      await mkdir(CHUNKS_BASE_DIR, { recursive: true });
      const entries = await readdir(CHUNKS_BASE_DIR);
      for (const entry of entries) {
        const itemPath = join(CHUNKS_BASE_DIR, entry);
        try {
          const itemStat = await stat(itemPath);
          if (itemStat.isDirectory() && now - itemStat.mtimeMs > STALE_MAX_AGE_MS) {
            await rm(itemPath, { recursive: true, force: true });
          }
        } catch {}
      }
    } catch {}
  }, 100);
}
