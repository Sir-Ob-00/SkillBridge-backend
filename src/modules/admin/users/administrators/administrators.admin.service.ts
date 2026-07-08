import { adminUsersService } from '../admin.users.service';
import { ListAdminUsersQuery } from '../admin.users.validators';

export const administratorsAdminService = {
  listAdministrators(query: ListAdminUsersQuery) {
    return adminUsersService.listAdministrators(query);
  },
};
