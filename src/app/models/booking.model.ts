export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface Booking {
  id: string;
  carId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  destination: string;
  status: BookingStatus;
  totalDays: number;
  estimatedTotal: number;
  routeLabel?: string;
  createdAt: string;
}
