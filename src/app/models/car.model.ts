export interface RentalRoute {
  id: string;
  label: string;
  from: string;
  to: string;
  distanceKm: number;
}

export interface Car {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  pricePerDay: number;
  seats: number;
  transmission: string;
  fuel: string;
  description: string;
}
