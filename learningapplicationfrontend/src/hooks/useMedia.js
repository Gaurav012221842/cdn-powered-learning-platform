import { useState } from 'react';
import { mediaService } from '../services/mediaService';

export const useMedia = () => {
  const [uploading, setUploading] = useState(false);

  const requestUpload = async (fileName, mediaType) => {
    setUploading(true);
    try {
      const response = await mediaService.requestUploadUrl(fileName, mediaType);
      return response.data;
    } finally {
      setUploading(false);
    }
  };

  return { requestUpload, uploading };
};
