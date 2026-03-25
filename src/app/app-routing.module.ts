import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BookingComponent } from './pages/booking/booking.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { AuthGuard } from './guards/auth.guard';
import { CustomerGuard } from './guards/customer.guard';
import { OwnerGuard } from './guards/owner.guard';
import { CarDetailComponent } from './pages/car-detail/car-detail.component';
import { CustomerBookingsComponent } from './pages/customer/customer-bookings.component';
import { OwnerDashboardComponent } from './pages/owner/owner-dashboard.component';
import { OwnerCarFormComponent } from './pages/owner/owner-car-form.component';
import { OwnerBookingsComponent } from './pages/owner/owner-bookings.component';
import { InboxComponent } from './pages/inbox/inbox.component';
import { ChatComponent } from './pages/chat/chat.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'cars/:id', component: CarDetailComponent },
  { path: 'book/:id', component: BookingComponent, canActivate: [AuthGuard, CustomerGuard] },
  { path: 'my-bookings', component: CustomerBookingsComponent, canActivate: [AuthGuard, CustomerGuard] },
  { path: 'inbox', component: InboxComponent, canActivate: [AuthGuard] },
  { path: 'chat/:id', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'owner', component: OwnerDashboardComponent, canActivate: [OwnerGuard] },
  { path: 'owner/cars/new', component: OwnerCarFormComponent, canActivate: [OwnerGuard] },
  { path: 'owner/cars/:id/edit', component: OwnerCarFormComponent, canActivate: [OwnerGuard] },
  { path: 'owner/bookings', component: OwnerBookingsComponent, canActivate: [OwnerGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
