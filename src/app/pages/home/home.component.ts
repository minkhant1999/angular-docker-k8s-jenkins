import { Component } from '@angular/core';
import { Car } from '../../models/car.model';
import { CarService } from '../../services/car.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  cars: Car[] = [];

  constructor(private carService: CarService) {
    this.cars = this.carService.getCars();
  }
}
