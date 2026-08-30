/**
 * uploadManager.js
 * Resumable Multipart Video Upload Manager
 * Direct Browser -> Cloudflare R2 Upload via Presigned Part URLs
 * Powered by IndexedDB session recovery, File.slice() streaming, and parallel concurrency
 */

import { API_V1_URL } from '../../services/api';

const DB_NAME = 'VideoUploadManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'active_uploads';
const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB chunks
const CONCURRENCY = 4; // 4 parallel chunk uploads
const MAX_RETRIES = 3;

/**
 * Open IndexedDB for persistent upload state recovery
 */
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileFingerprint' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Generate unique fingerprint for file (Name + Size + LastModified)
 */
export const getFileFingerprint = (file) => {
  return `${file.name}_${file.size}_${file.lastModified}`;
};

/**
 * Save upload session to IndexedDB
 */
export const saveUploadSession = async (sessionData) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(sessionData);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save upload session to IndexedDB:', err);
  }
};

/**
 * Get upload session by file fingerprint
 */
export const getUploadSession = async (fileFingerprint) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(fileFingerprint);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not read upload session from IndexedDB:', err);
    return null;
  }
};

/**
 * Remove completed/aborted upload session from IndexedDB
 */
export const removeUploadSession = async (fileFingerprint) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(fileFingerprint);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not remove upload session from IndexedDB:', err);
  }
};

/**
 * Resumable Video Uploader Engine
 */
export class ResumableVideoUpload {
  constructor(file, options = {}) {
    this.file = file;
    this.chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    this.concurrency = options.concurrency || CONCURRENCY;
    this.onProgress = options.onProgress || (() => { });
    this.onStatusChange = options.onStatusChange || (() => { });
    this.onComplete = options.onComplete || (() => { });
    this.onError = options.onError || (() => { });

    this.fingerprint = getFileFingerprint(file);
    this.totalParts = Math.ceil(file.size / this.chunkSize) || 1;
    this.uploadSessionId = null;
    this.uploadId = null;
    this.objectKey = null;
    this.mediaId = null;

    // Completed parts map: { [partNumber]: etag }
    this.completedParts = new Map();
    // Part statuses: 'pending' | 'uploading' | 'completed' | 'failed'
    this.partStatuses = new Array(this.totalParts).fill('pending');

    this.isPaused = false;
    this.isCancelled = false;
    this.activeWorkers = 0;
    this.startTime = null;
    this.uploadedBytes = 0;
    this.speedHistory = [];
  }

  /**
   * Start or Resume Multipart Upload
   */
  async start() {
    this.isPaused = false;
    this.isCancelled = false;
    this.startTime = Date.now();
    this.onStatusChange('INITIALIZING');

    try {
      // 1. Check for existing session in IndexedDB
      const savedSession = await getUploadSession(this.fingerprint);

      if (savedSession && savedSession.uploadSessionId) {
        this.uploadSessionId = savedSession.uploadSessionId;
        this.uploadId = savedSession.uploadId;
        this.objectKey = savedSession.objectKey;
        this.mediaId = savedSession.mediaId;

        // Restore completed parts from IndexedDB
        if (savedSession.completedParts) {
          Object.entries(savedSession.completedParts).forEach(([partNum, etag]) => {
            this.completedParts.set(Number(partNum), etag);
            this.partStatuses[Number(partNum) - 1] = 'completed';
          });
        }

        // Query R2 backend for synced uploaded parts
        await this.syncWithR2Parts();
        console.log(`[UploadManager] Resuming session ${this.uploadSessionId}. Skipped ${this.completedParts.size}/${this.totalParts} chunks.`);
      } else {
        // 2. Initiate fresh multipart upload via Spring Boot
        await this.initiateBackendSession();
      }

      this.onStatusChange('UPLOADING');
      this.updateProgress();

      // 3. Launch Parallel Chunk Worker Pool
      this.processQueue();
    } catch (err) {
      this.onStatusChange('FAILED');
      this.onError(err);
    }
  }

  /**
   * Request initiation from Spring Boot backend
   */
  async initiateBackendSession() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_V1_URL}/media/multipart/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        fileName: this.file.name,
        fileSize: this.file.size,
        chunkSize: this.chunkSize,
        mimeType: this.file.type || 'video/mp4'
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success || !data.data) {
      throw new Error(data.message || 'Failed to initiate multipart upload session.');
    }

    const payload = data.data;
    this.uploadSessionId = payload.uploadSessionId;
    this.uploadId = payload.uploadId;
    this.objectKey = payload.objectKey;
    this.mediaId = payload.mediaId;
    this.totalParts = payload.totalParts;
    this.chunkSize = payload.chunkSize;

    // Check if backend returned already uploaded parts
    if (payload.alreadyUploadedParts && payload.alreadyUploadedParts.length > 0) {
      payload.alreadyUploadedParts.forEach((p) => {
        this.completedParts.set(p.partNumber, p.eTag);
        this.partStatuses[p.partNumber - 1] = 'completed';
      });
    }

    await this.persistState();
  }

  /**
   * Sync uploaded parts from R2 to guarantee accurate resume
   */
  async syncWithR2Parts() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/media/multipart/parts?uploadSessionId=${this.uploadSessionId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.parts) {
        data.data.parts.forEach((p) => {
          this.completedParts.set(p.partNumber, p.eTag);
          this.partStatuses[p.partNumber - 1] = 'completed';
        });
        await this.persistState();
      }
    } catch (e) {
      console.warn('[UploadManager] Could not sync parts with R2:', e);
    }
  }

  /**
   * Save active state to IndexedDB
   */
  async persistState() {
    const partsObject = {};
    this.completedParts.forEach((etag, partNum) => {
      partsObject[partNum] = etag;
    });

    await saveUploadSession({
      fileFingerprint: this.fingerprint,
      uploadSessionId: this.uploadSessionId,
      uploadId: this.uploadId,
      objectKey: this.objectKey,
      mediaId: this.mediaId,
      fileName: this.file.name,
      fileSize: this.file.size,
      chunkSize: this.chunkSize,
      totalParts: this.totalParts,
      completedParts: partsObject,
      updatedAt: Date.now()
    });
  }

  /**
   * Worker Loop for parallel chunk uploads
   */
  processQueue() {
    if (this.isPaused || this.isCancelled) return;

    // Check if all parts completed
    if (this.completedParts.size === this.totalParts) {
      if (this.activeWorkers === 0) {
        this.completeUpload();
      }
      return;
    }

    // Spawn workers up to concurrency limit
    while (this.activeWorkers < this.concurrency) {
      const nextPartNumber = this.getNextPendingPart();
      if (!nextPartNumber) break;

      this.activeWorkers++;
      this.uploadChunk(nextPartNumber)
        .finally(() => {
          this.activeWorkers--;
          this.processQueue();
        });
    }
  }

  /**
   * Find next part number to upload
   */
  getNextPendingPart() {
    for (let i = 0; i < this.totalParts; i++) {
      const partNum = i + 1;
      if (!this.completedParts.has(partNum) && this.partStatuses[i] === 'pending') {
        this.partStatuses[i] = 'uploading';
        return partNum;
      }
    }
    return null;
  }

  /**
   * Upload single chunk directly from Browser -> R2 with retry
   */
  async uploadChunk(partNumber) {
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      if (this.isPaused || this.isCancelled) {
        this.partStatuses[partNumber - 1] = 'pending';
        return;
      }

      attempts++;
      try {
        // 1. Fetch Presigned Part URL from Spring Boot
        const token = localStorage.getItem('token');
        const urlRes = await fetch(`${API_V1_URL}/media/multipart/part-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            uploadSessionId: this.uploadSessionId,
            partNumber: partNumber
          })
        });

        const urlData = await urlRes.json();
        if (!urlRes.ok || !urlData.success || !urlData.data?.presignedUrl) {
          throw new Error(`Failed to get presigned URL for part ${partNumber}`);
        }

        const presignedUrl = urlData.data.presignedUrl;

        // 2. Slice the chunk from File without reading whole file into memory
        const start = (partNumber - 1) * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const chunkBlob = this.file.slice(start, end);

        // 3. Upload chunk directly to Cloudflare R2 or through proxy fallback
        let etag = null;
        if (!this.directR2Failed) {
          try {
            etag = await this.putChunkToR2(presignedUrl, chunkBlob);
          } catch (directErr) {
            console.warn(`[UploadManager] Direct R2 PUT failed (${directErr.message}), switching remaining chunks to backend proxy...`);
            this.directR2Failed = true;
            etag = await this.putChunkViaBackend(partNumber, chunkBlob);
          }
        } else {
          etag = await this.putChunkViaBackend(partNumber, chunkBlob);
        }

        // 4. Register completed chunk
        this.completedParts.set(partNumber, etag);
        this.partStatuses[partNumber - 1] = 'completed';
        await this.persistState();

        this.updateProgress();
        return;
      } catch (err) {
        console.warn(`[UploadManager] Part ${partNumber} attempt ${attempts} failed:`, err.message);
        if (attempts >= MAX_RETRIES) {
          this.partStatuses[partNumber - 1] = 'failed';
          this.onStatusChange('ERROR');
          throw err;
        }
        // Exponential backoff with jitter: 1s, 2s, 4s...
        const delay = Math.pow(2, attempts) * 500 + Math.random() * 300;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  async putChunkViaBackend(partNumber, chunkBlob) {
    const token = localStorage.getItem('token');
    const proxyUrl = `${API_V1_URL}/media/multipart/part-chunk?uploadSessionId=${this.uploadSessionId}&partNumber=${partNumber}`;

    const response = await fetch(proxyUrl, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: chunkBlob
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      let etag = response.headers.get('ETag') || response.headers.get('etag') || data?.data?.etag;
      if (!etag) etag = `chunk-${partNumber}-${Date.now()}`;
      return etag.replace(/"/g, '').trim();
    }
    throw new Error(data.message || `Proxy chunk upload failed with status ${response.status}`);
  }

  async putChunkToR2(url, chunkBlob) {
    // 1. Primary: Use standard fetch PUT with CORS
    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: chunkBlob,
        mode: 'cors'
      });

      if (response.ok) {
        let etag = response.headers.get('ETag') || response.headers.get('etag');
        if (!etag) {
          etag = `chunk-${Date.now()}`;
        }
        return etag.replace(/"/g, '').trim();
      }
    } catch (fetchErr) {
      console.warn('[UploadManager] fetch PUT failed:', fetchErr.message);
      throw fetchErr;
    }

    // 2. Fallback: Use XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let etag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag');
          if (!etag) {
            etag = `chunk-${Date.now()}`;
          }
          etag = etag.replace(/"/g, '').trim();
          resolve(etag);
        } else {
          reject(new Error(`R2 storage rejected chunk with HTTP ${xhr.status}: ${xhr.statusText || 'Error'}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error(`Network error uploading chunk to storage (${xhr.status || 'CORS/Connection error'})`));
      };

      xhr.ontimeout = () => {
        reject(new Error('Chunk upload to R2 storage timed out'));
      };

      xhr.send(chunkBlob);
    });
  }

  /**
   * Calculate and broadcast metrics (Progress %, Speed MB/s, ETA)
   */
  updateProgress() {
    let completedBytes = 0;
    for (let i = 0; i < this.totalParts; i++) {
      const partNum = i + 1;
      if (this.completedParts.has(partNum)) {
        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        completedBytes += (end - start);
      }
    }

    const percentage = Math.min(100, Math.round((completedBytes / this.file.size) * 100));
    const elapsedSeconds = (Date.now() - (this.startTime || Date.now())) / 1000;
    const speedBytesPerSec = elapsedSeconds > 0 ? completedBytes / elapsedSeconds : 0;
    const speedMBps = (speedBytesPerSec / (1024 * 1024)).toFixed(2);

    const remainingBytes = this.file.size - completedBytes;
    const etaSeconds = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : 0;

    this.onProgress({
      percentage,
      uploadedBytes: completedBytes,
      totalBytes: this.file.size,
      speedMBps: Number(speedMBps),
      etaSeconds,
      completedPartsCount: this.completedParts.size,
      totalPartsCount: this.totalParts,
      partStatuses: [...this.partStatuses]
    });
  }

  /**
   * Finalize Multipart Upload in Spring Boot & R2
   */
  async completeUpload() {
    this.onStatusChange('FINALIZING');
    try {
      const partsPayload = [];
      for (let i = 1; i <= this.totalParts; i++) {
        partsPayload.push({
          partNumber: i,
          etag: this.completedParts.get(i) || `etag-${i}`
        });
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/media/multipart/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          uploadSessionId: this.uploadSessionId,
          parts: partsPayload
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to finalize video upload on server.');
      }

      // Cleanup IndexedDB on success
      await removeUploadSession(this.fingerprint);

      this.onStatusChange('COMPLETED');
      this.onComplete(data.data);
    } catch (err) {
      this.onStatusChange('FAILED');
      this.onError(err);
    }
  }

  /**
   * Pause Active Upload
   */
  pause() {
    this.isPaused = true;
    this.onStatusChange('PAUSED');
  }

  /**
   * Resume Paused Upload
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.startTime = Date.now();
      this.onStatusChange('UPLOADING');
      this.processQueue();
    }
  }

  /**
   * Cancel and Abort Upload
   */
  async cancel() {
    this.isCancelled = true;
    this.isPaused = true;
    this.onStatusChange('CANCELLED');

    try {
      if (this.uploadSessionId) {
        const token = localStorage.getItem('token');
        await fetch(`${API_V1_URL}/media/multipart/abort?uploadSessionId=${this.uploadSessionId}`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
      }
      await removeUploadSession(this.fingerprint);
    } catch (e) {
      console.warn('Could not abort upload session:', e);
    }
  }
}
