import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarListing } from '../../models/car.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-owner-car-form',
  templateUrl: './owner-car-form.component.html',
  styleUrls: ['./owner-car-form.component.css'],
})
export class OwnerCarFormComponent implements OnInit {
  editId: string | null = null;
  saving = false;
  error: string | null = null;
  imagePreviews: string[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    model: ['', Validators.required],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1990), Validators.max(new Date().getFullYear() + 1)]],
    pricePerDay: [0, [Validators.required, Validators.min(1)]],
    location: ['', Validators.required],
    carType: ['', Validators.required],
    description: [''],
    seats: [5],
    transmission: ['Automatic'],
    fuel: ['Petrol'],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private data: DataService
  ) {}

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.data.getCarById(this.editId).subscribe((car) => {
        if (!car || car.ownerId !== this.auth.user?.id) {
          this.router.navigate(['/owner']);
          return;
        }
        this.imagePreviews = [...(car.images || [])];
        this.form.patchValue({
          name: car.name,
          model: car.model,
          year: car.year,
          pricePerDay: car.pricePerDay,
          location: car.location,
          carType: car.carType,
          description: car.description,
          seats: car.seats ?? 5,
          transmission: car.transmission ?? 'Automatic',
          fuel: car.fuel ?? 'Petrol',
        });
      });
    }
  }

  onFilesSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    const max = 6 - this.imagePreviews.length;
    const take = Math.min(files.length, max);
    for (let i = 0; i < take; i++) {
      const f = files[i];
      if (!f.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result as string;
        if (r.length > 2_000_000) {
          this.error = 'One image is too large; try under ~1.5MB.';
          return;
        }
        this.imagePreviews = [...this.imagePreviews, r];
        this.error = null;
      };
      reader.readAsDataURL(f);
    }
    input.value = '';
  }

  removeImage(i: number): void {
    this.imagePreviews = this.imagePreviews.filter((_, j) => j !== i);
  }

  submit(): void {
    this.error = null;
    const uid = this.auth.user?.id;
    if (!uid) return;
    if (this.imagePreviews.length === 0) {
      this.error = 'Add at least one image (stored as base64 in localStorage).';
      return;
    }
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload: Omit<CarListing, 'id'> = {
      ownerId: uid,
      name: v.name!,
      model: v.model!,
      year: Number(v.year),
      pricePerDay: Number(v.pricePerDay),
      location: v.location!,
      carType: v.carType!,
      description: v.description || '',
      images: [...this.imagePreviews],
      seats: Number(v.seats) || 5,
      transmission: v.transmission || undefined,
      fuel: v.fuel || undefined,
    };

    this.saving = true;
    if (this.editId) {
      this.data.updateCar(this.editId, payload).subscribe({
        next: (c) => {
          this.saving = false;
          if (!c) {
            this.error = 'Listing not found.';
            return;
          }
          void this.router.navigate(['/owner']);
        },
        error: () => {
          this.saving = false;
          this.error = 'Could not save.';
        },
      });
    } else {
      this.data.addCar(payload).subscribe({
        next: () => {
          this.saving = false;
          void this.router.navigate(['/owner']);
        },
        error: () => {
          this.saving = false;
          this.error = 'Could not save.';
        },
      });
    }
  }
}
