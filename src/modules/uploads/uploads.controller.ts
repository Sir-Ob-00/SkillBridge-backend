import { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { uploadsService } from './uploads.service';

export const uploadsController = {
  uploadImage: asyncHandler(async (req, res: Response) => {
    const file = (req as any).uploadedFile as { buffer: Buffer } | undefined;
    if (!file || !file.buffer) {
      throw ApiError.badRequest('No file uploaded.');
    }

    const folder = (req.query.folder as string | undefined) ?? 'skillbridge/general';
    const secureUrl = await uploadsService.uploadImage(file.buffer, folder);

    return sendSuccess(res, { success: true, url: secureUrl }, 'Image uploaded successfully.', 201);
  }),
};
