/** Full listing stored in localStorage (mock API) */
export interface CarListing {
  id: string;
  ownerId: string;
  name: string;
  model: string;
  year: number;
  pricePerDay: number;
  location: string;
  carType: string;
  description: string;
  images: string[];
  seats?: number;
  transmission?: string;
  fuel?: string;
}

/** Legacy alias for templates */
export type Car = CarListing;

export function primaryImage(car: CarListing): string {
  return car.images?.[0] ?? 'assets/placeholder-car.svg';
}

export interface RentalRoute {
  id: string;
  label: string;
  from: string;
  to: string;
  distanceKm: number;
}
