import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'DriveLux Rent';
  currentYear = new Date().getFullYear();

  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
