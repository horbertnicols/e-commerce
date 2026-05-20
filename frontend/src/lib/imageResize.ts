import Cookies from 'js-cookie';
import { ApiError } from './api';

const TARGET_SIZE = 800;
const QUALITY = 0.9;

// 把任意图片缩放到 size×size，保持比例，留白补底
export async function resizeToSquareBlob(
  file: File,
  size = TARGET_SIZE,
  bg = '#ffffff',
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('图片加载失败'));
      el.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 不可用');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const scale = Math.min(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('图片转换失败'))),
        'image/jpeg',
        QUALITY,
      ),
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// 把 Blob 上传到后端，返回 URL（形如 /uploads/products/xxx.jpg）
export async function uploadImageBlob(blob: Blob): Promise<string> {
  const fd = new FormData();
  fd.append('file', blob, 'image.jpg');

  const token = Cookies.get('token');
  const res = await fetch('/api/upload/image', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  const json = await res.json();
  if (json.code !== 0) {
    throw new ApiError(json.code, json.message);
  }
  return json.data.url as string;
}

// 保持宽高比，仅当超过 maxWidth 或 maxHeight 时等比缩小（适合横幅/宽图）
export async function resizeToFitBlob(
  file: File,
  maxWidth = 2000,
  maxHeight = 2000,
  quality = 0.92,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('图片加载失败'));
      el.src = objectUrl;
    });

    let w = img.width;
    let h = img.height;

    if (w > maxWidth || h > maxHeight) {
      const scale = Math.min(maxWidth / w, maxHeight / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 不可用');
    ctx.drawImage(img, 0, 0, w, h);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('图片转换失败'))),
        'image/jpeg',
        quality,
      ),
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// 一步到位：File → resize → upload → URL
export async function resizeAndUpload(file: File): Promise<string> {
  const blob = await resizeToSquareBlob(file);
  return uploadImageBlob(blob);
}
