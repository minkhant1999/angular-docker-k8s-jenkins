import { Injectable } from '@angular/core';
import { Car, RentalRoute } from '../models/car.model';

@Injectable({
  providedIn: 'root',
})
export class CarService {
  private readonly cars: Car[] = [
    {
      id: '1',
      name: 'Tesla Model 3',
      category: 'Electric',
      imageUrl:
        'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
      pricePerDay: 89,
      seats: 5,
      transmission: 'Automatic',
      fuel: 'Electric',
      description: 'Long range, premium interior, Autopilot-ready.',
    },
    {
      id: '2',
      name: 'BMW 3 Series',
      category: 'Luxury',
      imageUrl:
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
      pricePerDay: 75,
      seats: 5,
      transmission: 'Automatic',
      fuel: 'Petrol',
      description: 'Sport sedan with refined handling and comfort.',
    },
    {
      id: '3',
      name: 'Toyota RAV4',
      category: 'SUV',
      imageUrl:
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
      pricePerDay: 62,
      seats: 5,
      transmission: 'Automatic',
      fuel: 'Hybrid',
      description: 'Spacious SUV ideal for family trips and luggage.',
    },
    
    
  ];

  private readonly routes: RentalRoute[] = [
    {
      id: 'r1',
      label: 'Downtown → Airport',
      from: 'City Center',
      to: 'International Airport',
      distanceKm: 28,
    },
    {
      id: 'r2',
      label: 'Airport → Downtown',
      from: 'International Airport',
      to: 'City Center',
      distanceKm: 28,
    },
    {
      id: 'r3',
      label: 'Coastal highway loop',
      from: 'Harbor District',
      to: 'Beach Resort',
      distanceKm: 45,
    },
    {
      id: 'r4',
      label: 'Mountain scenic route',
      from: 'Valley Station',
      to: 'Summit Viewpoint',
      distanceKm: 62,
    },
    {
      id: 'r5',
      label: 'Business district',
      from: 'North Hub',
      to: 'South Convention Center',
      distanceKm: 18,
    },
  ];

  getCars(): Car[] {
    return [...this.cars];
  }

  getCarById(id: string): Car | undefined {
    return this.cars.find((c) => c.id === id);
  }

  getRoutes(): RentalRoute[] {
    return [...this.routes];
  }
}
