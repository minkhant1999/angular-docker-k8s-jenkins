import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarListing } from '../../models/car.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-owner-dashboard',
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.css'],
})
export class OwnerDashboardComponent implements OnInit {
  cars: CarListing[] = [];
  pendingBookings = 0;
  loading = true;

  constructor(public auth: AuthService, private data: DataService, private router: Router) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const id = this.auth.user?.id;
    if (!id) return;
    this.loading = true;
    this.data.getCarsByOwner(id).subscribe((cars) => {
      this.cars = cars;
      this.data.getBookingsForOwner(id).subscribe((bookings) => {
        this.pendingBookings = bookings.filter((b) => b.status === 'pending').length;
        this.loading = false;
      });
    });
  }

  deleteCar(car: CarListing): void {
    if (!confirm(`Delete ${car.name}?`)) return;
    this.data.deleteCar(car.id).subscribe(() => this.refresh());
  }

  claimDemoFleet(): void {
    const id = this.auth.user?.id;
    if (!id) return;
    this.data.claimDemoFleet(id).subscribe((n) => {
      if (n > 0) this.refresh();
      else alert('No demo listings left to claim (already assigned).');
    });
  }
}
