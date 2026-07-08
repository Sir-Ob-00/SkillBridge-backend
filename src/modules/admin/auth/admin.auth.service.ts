import { authService } from '../../auth/auth.service';

export const adminAuthService = {
  login(input: { email: string; password: string }) {
    return authService.adminLogin(input);
  },
};
