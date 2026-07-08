import { usersService } from '../../users/users.service';
import { UpdateProfileInput } from '../../users/users.validators';

export const adminProfileService = {
  getMyProfile(adminId: string) {
    return usersService.getById(adminId);
  },

  updateMyProfile(adminId: string, input: UpdateProfileInput) {
    return usersService.updateProfile(adminId, input);
  },
};
