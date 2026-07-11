import { authService } from '../../auth/auth.service';
import { usersService } from '../../users/users.service';

export const adminAuthService = {
  login(input: { email: string; password: string }) {
    // adminLogin reuses the shared login flow but restricts to admin roles.
    return authService.adminLogin(input);
  },

  refresh(refreshToken: string) {
    return authService.refresh(refreshToken);
  },

  logout(refreshToken: string) {
    return authService.logout(refreshToken);
  },

  forgotPassword(input: { email: string }) {
    return authService.forgotPassword(input);
  },

  resetPassword(input: { token: string; password: string }) {
    return authService.resetPassword(input);
  },

  me(adminId: string) {
    return usersService.getById(adminId);
  },
};
