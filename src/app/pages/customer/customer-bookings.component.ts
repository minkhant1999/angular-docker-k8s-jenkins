import { Component, OnInit } from '@angular/core';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-customer-bookings',
  templateUrl: './customer-bookings.component.html',
  styleUrls: ['./customer-bookings.component.css'],
})
export class CustomerBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = true;

  constructor(private data: DataService, public auth: AuthService) {}

  ngOnInit(): void {
    const id = this.auth.user?.id;
    if (!id) return;
    this.data.getBookingsForCustomer(id).subscribe((b) => {
      this.bookings = b;
      this.loading = false;
    });
  }
}
