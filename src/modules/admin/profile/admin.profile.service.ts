import { prisma } from '../../../config/prisma';
import { usersService } from '../../users/users.service';
import { UpdateProfileInput } from '../../users/users.validators';
import { hashPassword, comparePassword } from '../../../utils/password';
import { ApiError } from '../../../utils/ApiError';

export const adminProfileService = {
  getMyProfile(adminId: string) {
    return usersService.getById(adminId);
  },

  updateMyProfile(adminId: string, input: UpdateProfileInput) {
    return usersService.updateProfile(adminId, input);
  },

  updateAvatar(adminId: string, file: any) {
    return usersService.updateAvatar(adminId, file);
  },

  async changePassword(adminId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: adminId } });
    if (!user) {
      throw ApiError.notFound('Admin not found.');
    }

    const matches = await comparePassword(currentPassword, user.password);
    if (!matches) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: adminId }, data: { password: passwordHash } });

    // Revoke all active sessions after a password change.
    await prisma.refreshToken.updateMany({
      where: { userId: adminId, revoked: false },
      data: { revoked: true },
    });

    return { message: 'Password changed successfully.' };
  },
};
