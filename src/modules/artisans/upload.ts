import multer from 'multer';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs/promises';
import { mkdir } from 'fs/promises';

const tempDir = path.join(os.tmpdir(), 'skillbridge-uploads');
mkdir(tempDir, { recursive: true }).catch(() => {});

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, tempDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

export const cleanupTempFile = async (filePath: string | undefined) => {
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {
    // ignore cleanup errors
  }
};
