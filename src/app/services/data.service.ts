import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, switchMap, tap } from 'rxjs/operators';
import { Booking, BookingStatus } from '../models/booking.model';
import { CarListing, RentalRoute } from '../models/car.model';
import { ChatMessage, Conversation } from '../models/chat.model';
import { AuthService } from './auth.service';

const LS_CARS = 'drivelux_data_cars_v1';
const LS_BOOKINGS = 'drivelux_data_bookings_v1';
const LS_CONV = 'drivelux_data_conversations_v1';
const LS_MSG = 'drivelux_data_messages_v1';

const SIM_DELAY_MS = 350;

/** Mock routes for booking surcharge (same as before) */
const MOCK_ROUTES: RentalRoute[] = [
  { id: 'r1', label: 'Downtown → Airport', from: 'City Center', to: 'International Airport', distanceKm: 28 },
  { id: 'r2', label: 'Airport → Downtown', from: 'International Airport', to: 'City Center', distanceKm: 28 },
  { id: 'r3', label: 'Coastal highway', from: 'Harbor', to: 'Beach Resort', distanceKm: 45 },
];

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private seeded = false;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getRoutes(): RentalRoute[] {
    return MOCK_ROUTES;
  }

  private routeRatePerKm = 0.35;

  /** Load seed JSON once, then merge with stored cars */
  ensureSeeded(): Observable<void> {
    if (this.seeded) return of(undefined).pipe(delay(SIM_DELAY_MS));
    const raw = localStorage.getItem(LS_CARS);
    if (raw) {
      this.seeded = true;
      return of(undefined).pipe(delay(SIM_DELAY_MS));
    }
    return this.http.get<CarListing[]>('assets/data/seed-cars.json').pipe(
      tap((seed) => {
        localStorage.setItem(LS_CARS, JSON.stringify(seed));
        this.seeded = true;
      }),
      map(() => undefined),
      catchError(() => {
        localStorage.setItem(LS_CARS, JSON.stringify([]));
        this.seeded = true;
        return of(undefined);
      }),
      delay(SIM_DELAY_MS)
    );
  }

  getCars(filters?: { location?: string; maxPrice?: number; carType?: string; q?: string }): Observable<CarListing[]> {
    return this.ensureSeeded().pipe(
      switchMap(() => {
        let list = this.readCars();
        if (filters?.location) {
          const t = filters.location.toLowerCase();
          list = list.filter((c) => c.location.toLowerCase().includes(t));
        }
        if (filters?.maxPrice != null && !isNaN(filters.maxPrice)) {
          list = list.filter((c) => c.pricePerDay <= filters.maxPrice!);
        }
        if (filters?.carType) {
          const t = filters.carType.toLowerCase();
          list = list.filter((c) => c.carType.toLowerCase().includes(t));
        }
        if (filters?.q) {
          const t = filters.q.toLowerCase();
          list = list.filter(
            (c) =>
              c.name.toLowerCase().includes(t) ||
              c.model.toLowerCase().includes(t) ||
              c.description.toLowerCase().includes(t)
          );
        }
        return of(list).pipe(delay(SIM_DELAY_MS));
      })
    );
  }

  getCarById(id: string): Observable<CarListing | undefined> {
    return this.ensureSeeded().pipe(
      switchMap(() => of(this.readCars().find((c) => c.id === id)).pipe(delay(SIM_DELAY_MS)))
    );
  }

  addCar(car: Omit<CarListing, 'id'>): Observable<CarListing> {
    const id = `car-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const full: CarListing = { ...car, id };
    const list = this.readCars();
    list.push(full);
    this.writeCars(list);
    return of(full).pipe(delay(SIM_DELAY_MS));
  }

  updateCar(id: string, patch: Partial<CarListing>): Observable<CarListing | undefined> {
    const list = this.readCars();
    const i = list.findIndex((c) => c.id === id);
    if (i < 0) return of(undefined).pipe(delay(SIM_DELAY_MS));
    list[i] = { ...list[i], ...patch, id: list[i].id, ownerId: list[i].ownerId };
    this.writeCars(list);
    return of(list[i]).pipe(delay(SIM_DELAY_MS));
  }

  deleteCar(id: string): Observable<boolean> {
    const list = this.readCars().filter((c) => c.id !== id);
    this.writeCars(list);
    const bookings = this.readBookings().filter((b) => b.carId !== id);
    this.writeBookings(bookings);
    return of(true).pipe(delay(SIM_DELAY_MS));
  }

  getCarsByOwner(ownerId: string): Observable<CarListing[]> {
    return this.ensureSeeded().pipe(
      switchMap(() => of(this.readCars().filter((c) => c.ownerId === ownerId)).pipe(delay(SIM_DELAY_MS)))
    );
  }

  /** Reassign seed demo cars from `seed-owner` to the current owner so bookings/notifications work locally. */
  claimDemoFleet(newOwnerId: string): Observable<number> {
    const list = this.readCars();
    let n = 0;
    for (const c of list) {
      if (c.ownerId === 'seed-owner') {
        c.ownerId = newOwnerId;
        n++;
      }
    }
    if (n) this.writeCars(list);
    const bookings = this.readBookings();
    let bn = 0;
    for (const b of bookings) {
      if (b.ownerId === 'seed-owner') {
        b.ownerId = newOwnerId;
        bn++;
      }
    }
    if (bn) this.writeBookings(bookings);
    return of(n).pipe(delay(SIM_DELAY_MS));
  }

  /** Overlap: [start, end) vs existing pending/approved */
  private hasBookingOverlap(carId: string, start: string, end: string, excludeId?: string): boolean {
    const s = new Date(start + 'T12:00:00');
    const e = new Date(end + 'T12:00:00');
    return this.readBookings().some((b) => {
      if (b.carId !== carId) return false;
      if (b.id === excludeId) return false;
      if (b.status !== 'pending' && b.status !== 'approved') return false;
      const bs = new Date(b.startDate + 'T12:00:00');
      const be = new Date(b.endDate + 'T12:00:00');
      return s < be && e > bs;
    });
  }

  bookCar(payload: {
    carId: string;
    startDate: string;
    endDate: string;
    destination: string;
    routeId?: string;
  }): Observable<{ ok: true; booking: Booking } | { ok: false; error: string }> {
    const user = this.auth.user;
    if (!user || user.role !== 'customer') {
      return of({ ok: false as const, error: 'Only customers can book.' }).pipe(delay(SIM_DELAY_MS));
    }
    const car = this.readCars().find((c) => c.id === payload.carId);
    if (!car) return of({ ok: false as const, error: 'Car not found.' }).pipe(delay(SIM_DELAY_MS));
    if (car.ownerId === user.id) {
      return of({ ok: false as const, error: 'You cannot book your own car.' }).pipe(delay(SIM_DELAY_MS));
    }

    const start = new Date(payload.startDate + 'T12:00:00');
    const end = new Date(payload.endDate + 'T12:00:00');
    if (end <= start) {
      return of({ ok: false as const, error: 'Return date must be after pick-up date.' }).pipe(delay(SIM_DELAY_MS));
    }

    if (this.hasBookingOverlap(payload.carId, payload.startDate, payload.endDate)) {
      return of({
        ok: false as const,
        error: 'Those dates overlap another booking for this car. Choose different dates.',
      }).pipe(delay(SIM_DELAY_MS));
    }

    const ms = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    let estimated = car.pricePerDay * totalDays;
    let routeLabel: string | undefined;
    if (payload.routeId) {
      const r = MOCK_ROUTES.find((x) => x.id === payload.routeId);
      if (r) {
        estimated += Math.round(r.distanceKm * this.routeRatePerKm * 100) / 100;
        routeLabel = r.label;
      }
    }

    const booking: Booking = {
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      carId: car.id,
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      ownerId: car.ownerId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      destination: payload.destination.trim(),
      status: 'pending',
      totalDays,
      estimatedTotal: Math.round(estimated * 100) / 100,
      routeLabel,
      createdAt: new Date().toISOString(),
    };

    const list = this.readBookings();
    list.push(booking);
    this.writeBookings(list);
    return of({ ok: true as const, booking }).pipe(delay(SIM_DELAY_MS));
  }

  getBookingsForCustomer(customerId: string): Observable<Booking[]> {
    return of(
      this.readBookings()
        .filter((b) => b.customerId === customerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    ).pipe(delay(SIM_DELAY_MS));
  }

  getBookingsForOwner(ownerId: string): Observable<Booking[]> {
    return of(
      this.readBookings()
        .filter((b) => b.ownerId === ownerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    ).pipe(delay(SIM_DELAY_MS));
  }

  updateBookingStatus(bookingId: string, status: BookingStatus, ownerId: string): Observable<{ ok: boolean; error?: string }> {
    const list = this.readBookings();
    const b = list.find((x) => x.id === bookingId);
    if (!b) return of({ ok: false, error: 'Booking not found' }).pipe(delay(SIM_DELAY_MS));
    if (b.ownerId !== ownerId) return of({ ok: false, error: 'Forbidden' }).pipe(delay(SIM_DELAY_MS));
    if (status === 'approved') {
      const conflict = list.some(
        (x) =>
          x.id !== b.id &&
          x.carId === b.carId &&
          x.status === 'approved' &&
          new Date(x.startDate + 'T12:00:00') < new Date(b.endDate + 'T12:00:00') &&
          new Date(x.endDate + 'T12:00:00') > new Date(b.startDate + 'T12:00:00')
      );
      if (conflict) {
        return of({ ok: false, error: 'Conflicts with another approved booking for these dates.' }).pipe(
          delay(SIM_DELAY_MS)
        );
      }
    }
    b.status = status;
    this.writeBookings(list);
    return of({ ok: true }).pipe(delay(SIM_DELAY_MS));
  }

  getConversationsForUser(userId: string): Observable<Conversation[]> {
    return of(
      this.readConversations()
        .filter((c) => c.customerId === userId || c.ownerId === userId)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    ).pipe(delay(SIM_DELAY_MS));
  }

  getOrCreateConversation(carId: string): Observable<Conversation> {
    const user = this.auth.user;
    if (!user) return throwError(() => new Error('Not authenticated'));
    if (user.role !== 'customer') {
      return throwError(() => new Error('Only customers can message owners'));
    }
    const car = this.readCars().find((c) => c.id === carId);
    if (!car) return throwError(() => new Error('Car not found'));

    const ownerName = car.ownerId === 'seed-owner' ? 'Demo Fleet Owner' : 'Car owner';
    let convs = this.readConversations();
    let conv = convs.find((c) => c.carId === carId && c.customerId === user.id && c.ownerId === car.ownerId);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        carId: car.id,
        carName: `${car.name} ${car.model}`,
        customerId: user.id,
        customerName: user.name,
        ownerId: car.ownerId,
        ownerName,
        lastMessageAt: new Date().toISOString(),
      };
      convs.push(conv);
      this.writeConversations(convs);
    }
    return of(conv).pipe(delay(SIM_DELAY_MS));
  }

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    return of(
      this.readMessages()
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    ).pipe(delay(SIM_DELAY_MS));
  }

  sendMessage(conversationId: string, text: string): Observable<ChatMessage> {
    const user = this.auth.user;
    if (!user) return throwError(() => new Error('Not authenticated'));
    const convs = this.readConversations();
    const conv = convs.find((c) => c.id === conversationId);
    if (!conv || (conv.customerId !== user.id && conv.ownerId !== user.id)) {
      return throwError(() => new Error('Forbidden'));
    }
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    const msgs = this.readMessages();
    msgs.push(msg);
    this.writeMessages(msgs);
    conv.lastMessageAt = msg.createdAt;
    this.writeConversations(convs);
    return of(msg).pipe(delay(SIM_DELAY_MS));
  }

  private readCars(): CarListing[] {
    try {
      const raw = localStorage.getItem(LS_CARS);
      if (!raw) return [];
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? (p as CarListing[]) : [];
    } catch {
      return [];
    }
  }

  private writeCars(cars: CarListing[]): void {
    localStorage.setItem(LS_CARS, JSON.stringify(cars));
  }

  private readBookings(): Booking[] {
    try {
      const raw = localStorage.getItem(LS_BOOKINGS);
      if (!raw) return [];
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? (p as Booking[]) : [];
    } catch {
      return [];
    }
  }

  private writeBookings(b: Booking[]): void {
    localStorage.setItem(LS_BOOKINGS, JSON.stringify(b));
  }

  private readConversations(): Conversation[] {
    try {
      const raw = localStorage.getItem(LS_CONV);
      if (!raw) return [];
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? (p as Conversation[]) : [];
    } catch {
      return [];
    }
  }

  private writeConversations(c: Conversation[]): void {
    localStorage.setItem(LS_CONV, JSON.stringify(c));
  }

  private readMessages(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(LS_MSG);
      if (!raw) return [];
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? (p as ChatMessage[]) : [];
    } catch {
      return [];
    }
  }

  private writeMessages(m: ChatMessage[]): void {
    localStorage.setItem(LS_MSG, JSON.stringify(m));
  }
}
