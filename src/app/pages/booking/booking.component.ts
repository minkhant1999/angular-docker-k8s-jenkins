import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Car, RentalRoute } from '../../models/car.model';
import { CarService } from '../../services/car.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
})
export class BookingComponent implements OnInit {
  car: Car | undefined;
  routes: RentalRoute[] = [];
  form: FormGroup;
  submitted = false;
  bookingRef: string | null = null;

  /** $ per km added to base rental (route distance) */
  private readonly routeRatePerKm = 0.35;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService,
    private fb: FormBuilder
  ) {
    const today = this.toInputDate(new Date());
    const tomorrow = this.toInputDate(this.addDays(new Date(), 1));

    this.form = this.fb.group({
      routeId: ['', Validators.required],
      startDate: [today, Validators.required],
      endDate: [tomorrow, Validators.required],
    });
  }

  ngOnInit(): void {
    this.routes = this.carService.getRoutes();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }
    this.car = this.carService.getCarById(id);
    if (!this.car) {
      this.router.navigate(['/']);
      return;
    }
    if (this.routes.length) {
      this.form.patchValue({ routeId: this.routes[0].id });
    }
  }

  get selectedRoute(): RentalRoute | undefined {
    const id = this.form.get('routeId')?.value;
    return this.routes.find((r) => r.id === id);
  }

  get rentalDays(): number {
    const start = this.parseDate(this.form.get('startDate')?.value);
    const end = this.parseDate(this.form.get('endDate')?.value);
    if (!start || !end) return 0;
    const ms = end.getTime() - start.getTime();
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }

  get baseRental(): number {
    if (!this.car) return 0;
    return this.car.pricePerDay * this.rentalDays;
  }

  get routeFee(): number {
    const r = this.selectedRoute;
    if (!r) return 0;
    return Math.round(r.distanceKm * this.routeRatePerKm * 100) / 100;
  }

  get estimatedTotal(): number {
    return Math.round((this.baseRental + this.routeFee) * 100) / 100;
  }

  onSubmit(): void {
    this.submitted = true;
    this.bookingRef = null;
    if (this.form.invalid || !this.car || this.rentalDays < 1) {
      return;
    }
    const ref = `BK-${Date.now().toString(36).toUpperCase()}`;
    this.bookingRef = ref;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private toInputDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private parseDate(s: string | undefined): Date | null {
    if (!s) return null;
    const d = new Date(s + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  private addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
}
