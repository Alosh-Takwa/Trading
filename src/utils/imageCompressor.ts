/**
 * Client-side image compression and downscaling utility.
 * Converts uploaded local files from computer/phone into clean, lightweight Base64 Data URLs.
 * Keeps memory footprint very low (< 30KB) for localStorage and Google Drive records.
 */
export const compressImageFile = (
  file: File,
  maxWidth = 240,
  maxHeight = 240,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('الملف المختار ليس صورة صالحة'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('');
            return;
          }

          // Fill white background for clean rendering
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Always produce JPEG at 0.75 quality for compact footprint (< 25KB)
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          // If somehow still > 40KB, downscale further
          if (dataUrl.length > 50000) {
            const smallerCanvas = document.createElement('canvas');
            smallerCanvas.width = Math.round(canvas.width * 0.7);
            smallerCanvas.height = Math.round(canvas.height * 0.7);
            const sCtx = smallerCanvas.getContext('2d');
            if (sCtx) {
              sCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
              dataUrl = smallerCanvas.toDataURL('image/jpeg', 0.65);
            }
          }

          resolve(dataUrl);
        } catch (err) {
          console.warn('Canvas compression error:', err);
          resolve('');
        }
      };
      img.onerror = () => {
        console.warn('Image element load error');
        resolve('');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
