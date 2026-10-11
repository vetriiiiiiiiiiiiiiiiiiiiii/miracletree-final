"use client";

/**
 * Default chunk size: 384 KB (393,216 bytes).
 * Chosen specifically for low/unreliable internet: small enough that individual HTTP packets
 * and cellular frames are completed before radio drops or timeouts, yet large enough to avoid
 * excessive HTTP handshake overhead.
 */
export const DEFAULT_CHUNK_SIZE = 384 * 1024;
export const MAX_CHUNK_RETRIES = 5;
export const CHUNK_TIMEOUT_MS = 40000;

/**
 * Generates a stable session upload ID based on file identity and random token.
 */
export function generateUploadId(file) {
  const safeName = (file.name || "file").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `up_${safeName}_${file.size}_${timestamp}_${random}`;
}

/**
 * Queries server for chunks already received for an uploadId (allows instant resumption).
 */
export async function getUploadedChunks({ endpoint, uploadId, signal }) {
  try {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("uploadId", uploadId);
    const response = await fetch(url.toString(), {
      method: "GET",
      signal,
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.receivedChunks) ? data.receivedChunks : [];
  } catch {
    return [];
  }
}

/**
 * Uploads a file chunk by chunk with automatic retries, backoff, resume capability,
 * and real-time progress reporting. Designed specifically for low-bandwidth and spotty internet.
 *
 * @param {Object} options
 * @param {File} options.file - The File object to upload
 * @param {string} [options.endpoint="/api/admin/upload"] - API endpoint
 * @param {string} [options.folder="library"] - Target folder
 * @param {string} [options.alt=""] - Alt text for image
 * @param {number} [options.chunkSize=393216] - Chunk size in bytes (384KB default)
 * @param {number} [options.maxRetries=5] - Retries per chunk
 * @param {AbortSignal} [options.signal] - Abort controller signal to cancel upload
 * @param {Function} [options.onProgress] - ({ percent, loaded, total, chunkIndex, totalChunks, retrying, retryCount, message }) => void
 * @returns {Promise<{ id: string, url: string, width?: number, height?: number }>}
 */
export async function uploadFileInChunks({
  file,
  endpoint = "/api/admin/upload",
  folder = "library",
  alt = "",
  chunkSize = DEFAULT_CHUNK_SIZE,
  maxRetries = MAX_CHUNK_RETRIES,
  signal,
  onProgress,
}) {
  if (!(file instanceof Blob)) {
    throw new Error("Invalid file provided for upload.");
  }

  const fileSize = file.size;
  const totalChunks = Math.max(1, Math.ceil(fileSize / chunkSize));
  const uploadId = generateUploadId(file);

  // Check if server already has any chunks (resumability support)
  const receivedChunks = await getUploadedChunks({ endpoint, uploadId, signal });
  const receivedSet = new Set(receivedChunks);

  let loadedBytes = 0;
  for (let i = 0; i < totalChunks; i++) {
    if (receivedSet.has(i)) {
      loadedBytes += Math.min(chunkSize, fileSize - i * chunkSize);
    }
  }

  const reportProgress = (details = {}) => {
    if (typeof onProgress !== "function") return;
    const percent = Math.min(100, Math.round((loadedBytes / fileSize) * 100));
    onProgress({
      percent,
      loaded: loadedBytes,
      total: fileSize,
      totalChunks,
      uploadId,
      ...details,
    });
  };

  reportProgress({
    chunkIndex: 0,
    message: totalChunks > 1 ? `Starting chunked upload (1 of ${totalChunks})…` : "Preparing upload…",
  });

  let finalResponseData = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (signal?.aborted) {
      throw new DOMException("Upload aborted by user", "AbortError");
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(fileSize, start + chunkSize);
    const chunkBlob = file.slice(start, end);
    const thisChunkBytes = chunkBlob.size;

    // Skip if server already confirmed having this chunk
    if (receivedSet.has(chunkIndex)) {
      reportProgress({
        chunkIndex: chunkIndex + 1,
        message: `Restored chunk ${chunkIndex + 1} of ${totalChunks}…`,
      });
      continue;
    }

    let attempt = 0;
    let chunkSuccess = false;

    while (attempt <= maxRetries && !chunkSuccess) {
      if (signal?.aborted) {
        throw new DOMException("Upload aborted by user", "AbortError");
      }

      attempt++;

      // Inform UI if retrying due to low internet
      if (attempt > 1) {
        reportProgress({
          chunkIndex,
          retrying: true,
          retryCount: attempt - 1,
          message: `Weak connection. Retrying chunk ${chunkIndex + 1} of ${totalChunks} (attempt ${attempt}/${maxRetries + 1})…`,
        });

        // Exponential backoff with slight jitter (e.g. 1.2s, 2.4s, 4.8s...)
        const backoffMs = Math.min(10000, 1000 * Math.pow(1.8, attempt - 1) + Math.random() * 400);
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, backoffMs);
          if (signal) {
            signal.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new DOMException("Upload aborted", "AbortError"));
            }, { once: true });
          }
        });
      }

      try {
        const formData = new FormData();
        formData.append("chunk", chunkBlob, file.name || "blob");
        formData.append("uploadId", uploadId);
        formData.append("chunkIndex", String(chunkIndex));
        formData.append("totalChunks", String(totalChunks));
        formData.append("fileName", file.name || "upload");
        formData.append("fileSize", String(fileSize));
        formData.append("fileType", file.type || "application/octet-stream");
        formData.append("folder", folder);
        if (alt) formData.append("alt", alt);

        // Individual chunk timeout via AbortController linked to external signal
        const chunkAbort = new AbortController();
        const timeoutId = setTimeout(() => chunkAbort.abort(), CHUNK_TIMEOUT_MS);
        const onParentAbort = () => chunkAbort.abort();
        signal?.addEventListener("abort", onParentAbort);

        let response;
        try {
          response = await fetch(endpoint, {
            method: "POST",
            body: formData,
            signal: chunkAbort.signal,
          });
        } finally {
          clearTimeout(timeoutId);
          signal?.removeEventListener("abort", onParentAbort);
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          // If server explicitly returned client validation error (400, 413, 415), do not keep retrying
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(data.error || `Upload rejected (${response.status})`);
          }
          // Server error 5xx or 429: allow retry loop to backoff and try again
          throw new Error(data.error || `Server responded with ${response.status}`);
        }

        // Chunk uploaded successfully
        chunkSuccess = true;
        loadedBytes += thisChunkBytes;
        receivedSet.add(chunkIndex);

        if (chunkIndex === totalChunks - 1 || data.url) {
          finalResponseData = data;
          reportProgress({
            chunkIndex: totalChunks,
            percent: 100,
            message: "Finishing & optimizing image…",
          });
        } else {
          reportProgress({
            chunkIndex: chunkIndex + 1,
            message: `Uploaded chunk ${chunkIndex + 1} of ${totalChunks}…`,
          });
        }
      } catch (err) {
        if (err.name === "AbortError" && signal?.aborted) {
          throw err;
        }

        // If it's a fatal client error, throw immediately
        if (
          err.message?.includes("The limit is") ||
          err.message?.includes("Upload a JPEG") ||
          err.message?.includes("not a readable image") ||
          err.message?.includes("Not authorised")
        ) {
          throw err;
        }

        console.warn(`[chunk-upload] Chunk ${chunkIndex + 1}/${totalChunks} attempt ${attempt} failed:`, err.message);

        if (attempt > maxRetries) {
          throw new Error(
            `Connection lost while uploading chunk ${chunkIndex + 1} of ${totalChunks}. Please check your connection and try again.`
          );
        }
      }
    }
  }

  if (!finalResponseData || !finalResponseData.url) {
    throw new Error("Upload completed but server did not return image details.");
  }

  return finalResponseData;
}
