import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CarListing, primaryImage } from '../../models/car.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  cars: CarListing[] = [];
  loading = true;
  primaryImage = primaryImage;

  filterForm = this.fb.group({
    q: [''],
    location: [''],
    maxPrice: [''],
    carType: [''],
  });

  constructor(private fb: FormBuilder, public auth: AuthService, private data: DataService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const v = this.filterForm.getRawValue();
    const maxP = v.maxPrice ? Number(v.maxPrice) : undefined;
    this.data
      .getCars({
        q: v.q || undefined,
        location: v.location || undefined,
        maxPrice: maxP != null && !isNaN(maxP) ? maxP : undefined,
        carType: v.carType || undefined,
      })
      .subscribe((cars) => {
        this.cars = cars;
        this.loading = false;
      });
  }

  bookingCommands(carId: string): (string | number)[] {
    return this.auth.isAuthenticated() ? ['/book', carId] : ['/login'];
  }

  bookingQueryParams(carId: string): Record<string, string> | null {
    return this.auth.isAuthenticated() ? null : { returnUrl: `/book/${carId}` };
  }
}
