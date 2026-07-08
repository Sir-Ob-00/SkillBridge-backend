import { Role, BookingStatus } from '@prisma/client';
import { bookingsService } from '../../bookings/bookings.service';
import { ListBookingsQuery } from '../../bookings/bookings.validators';

// Admins may access any booking; the bookingsService treats admin role as a
// privileged participant, so a sentinel id is sufficient for the lookup.
const ADMIN_SENTINEL = '00000000-0000-0000-0000-000000000000';

export const adminBookingsService = {
  list(query: ListBookingsQuery) {
    return bookingsService.list(ADMIN_SENTINEL, Role.admin, query);
  },
  getById(id: string) {
    return bookingsService.getById(id, ADMIN_SENTINEL, Role.admin);
  },
  updateStatus(id: string, status: BookingStatus) {
    return bookingsService.updateStatus(id, ADMIN_SENTINEL, Role.admin, status);
  },
};
