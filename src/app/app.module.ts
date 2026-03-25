import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    BookingComponent,
    LoginComponent,
    SignupComponent,
    CarDetailComponent,
    CustomerBookingsComponent,
    OwnerDashboardComponent,
    OwnerCarFormComponent,
    OwnerBookingsComponent,
    InboxComponent,
    ChatComponent,
  ],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule, ReactiveFormsModule, FormsModule],
  providers: [AuthGuard, CustomerGuard, OwnerGuard],
  bootstrap: [AppComponent],
})
export class AppModule {}
