import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  submitted = false;
  error: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async submit(): Promise<void> {
    this.submitted = true;
    this.error = null;

    if (this.form.invalid) {
      return;
    }

    const email = this.form.value.email ?? '';
    const password = this.form.value.password ?? '';
    const result = this.auth.login(email, password);
    if (!result.ok) {
      this.error = result.error;
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    await this.router.navigateByUrl(returnUrl);
  }
}
