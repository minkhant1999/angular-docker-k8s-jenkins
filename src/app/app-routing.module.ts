import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BookingComponent } from './pages/booking/booking.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'book/:id', component: BookingComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
