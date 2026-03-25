import { Component, OnInit } from '@angular/core';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-owner-bookings',
  templateUrl: './owner-bookings.component.html',
  styleUrls: ['./owner-bookings.component.css'],
})
export class OwnerBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = true;
  actionError: string | null = null;

  constructor(private data: DataService, private auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.auth.user?.id;
    if (!id) return;
    this.data.getBookingsForOwner(id).subscribe((b) => {
      this.bookings = b;
      this.loading = false;
    });
  }

  setStatus(b: Booking, status: 'approved' | 'rejected'): void {
    this.actionError = null;
    const oid = this.auth.user?.id;
    if (!oid) return;
    this.data.updateBookingStatus(b.id, status, oid).subscribe((res) => {
      if (!res.ok) this.actionError = res.error || 'Failed';
      else this.load();
    });
  }
}
