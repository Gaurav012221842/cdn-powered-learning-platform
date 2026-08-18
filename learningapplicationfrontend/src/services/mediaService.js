import { apiFetch } from './api';

export const mediaService = {
  requestUploadUrl: (fileName, mediaType) => apiFetch('/media/upload-url', { method: 'POST', body: JSON.stringify({ fileName, mediaType }) }),
  getSignedStreamingUrl: (mediaId) => apiFetch(`/media/${mediaId}/signed-url`),
};
