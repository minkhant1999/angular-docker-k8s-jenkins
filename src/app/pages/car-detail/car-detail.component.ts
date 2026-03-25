import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CarListing, primaryImage } from '../../models/car.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-car-detail',
  templateUrl: './car-detail.component.html',
  styleUrls: ['./car-detail.component.css'],
})
export class CarDetailComponent implements OnInit {
  car: CarListing | undefined;
  loading = true;
  error: string | null = null;
  primaryImage = primaryImage;
  /** Index of image shown in hero */
  heroImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private data: DataService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }
    this.data.getCarById(id).subscribe({
      next: (c) => {
        this.car = c;
        this.heroImageIndex = 0;
        this.loading = false;
        if (!c) this.error = 'Car not found.';
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load.';
      },
    });
  }

  isOwnListing(): boolean {
    if (!this.car || !this.auth.user) return false;
    return this.car.ownerId === this.auth.user.id;
  }

  heroSrc(car: CarListing): string {
    return car.images?.[this.heroImageIndex] ?? primaryImage(car);
  }

  setHero(i: number): void {
    this.heroImageIndex = i;
  }

  startChat(): void {
    if (!this.car || this.auth.user?.role !== 'customer') return;
    this.data.getOrCreateConversation(this.car.id).subscribe({
      next: (conv) => void this.router.navigate(['/chat', conv.id]),
      error: (e) => alert(e?.message || 'Could not open chat'),
    });
  }
}
