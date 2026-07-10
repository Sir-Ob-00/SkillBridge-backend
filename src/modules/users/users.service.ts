import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { parsePagination } from '../../utils/pagination';
import { buildPaginationMeta } from '../../utils/apiResponse';
import { UpdateProfileInput, ListUsersQuery } from './users.validators';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../../utils/cloudinary';

const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  profileImageUrl: true,
  isSuspended: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const usersService = {
  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_FIELDS,
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: PUBLIC_USER_FIELDS,
    });

    return user;
  },

  async updateAvatar(userId: string, file: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageUrl: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (!file) {
      throw ApiError.badRequest('Image file is required.');
    }

    try {
      const oldPublicId = getPublicIdFromUrl(user.profileImageUrl ?? '');
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId).catch(() => {});
      }
    } catch {
      // ignore old image cleanup errors
    }

    let imageUrl: string;
    try {
      imageUrl = await uploadToCloudinary(file.buffer, 'avatars');
    } catch (error) {
      console.error('Cloudinary upload failed (avatar):', error);
      throw ApiError.internal('Failed to upload image.');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: imageUrl },
      select: PUBLIC_USER_FIELDS,
    });

    return updated;
  },

  async listUsers(query: ListUsersQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        select: PUBLIC_USER_FIELDS,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async suspendUser(userId: string, suspend: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: suspend },
      select: PUBLIC_USER_FIELDS,
    });

    if (suspend) {
      // Revoke all active sessions when suspending.
      await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    }

    return user;
  },

  async deleteUser(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully.' };
  },
};
