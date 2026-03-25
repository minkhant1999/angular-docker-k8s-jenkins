import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserRole } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  submitted = false;
  error: string | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    role: ['customer' as UserRole, [Validators.required]],
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async submit(): Promise<void> {
    this.submitted = true;
    this.error = null;

    if (this.form.invalid) {
      return;
    }

    const name = this.form.value.name ?? '';
    const email = this.form.value.email ?? '';
    const password = this.form.value.password ?? '';
    const confirmPassword = this.form.value.confirmPassword ?? '';
    const role = (this.form.value.role ?? 'customer') as UserRole;

    if (password !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    const result = this.auth.signup(email, password, name, role);
    if (!result.ok) {
      this.error = result.error;
      return;
    }

    await this.router.navigateByUrl('/');
  }
}
