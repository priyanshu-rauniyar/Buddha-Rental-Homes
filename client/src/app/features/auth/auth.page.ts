import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-art"><p class="eyebrow">Buddha Rental Homes</p><h1>{{ isRegister ? 'Find your place in a new city.' : 'Good to have you back.' }}</h1><p>Student stays, made more thoughtful.</p></section>
      <section class="auth-panel">
        <p class="back-link">Buddha Rental Homes account access</p>
        <p class="eyebrow">{{ isRegister ? 'Create an account' : 'Account access' }}</p>
        <h2>{{ isRegister ? 'Start your next chapter' : 'Welcome back' }}</h2>
        <p class="muted">{{ isRegister ? 'Create a student account to find a stay, or an owner account to list your room.' : 'Sign in to browse rooms, request visits, and open your role dashboard.' }}</p>
        <form (ngSubmit)="submit()">
          <label *ngIf="isRegister">Full name<input name="name" [(ngModel)]="form.name" required minlength="2" autocomplete="name" /></label>
          <label>Email address<input name="email" [(ngModel)]="form.email" type="email" required autocomplete="email" /></label>
          <label>Password<input name="password" [(ngModel)]="form.password" type="password" required minlength="6" [autocomplete]="isRegister ? 'new-password' : 'current-password'" /></label>
          <label *ngIf="isRegister">Account type<select name="role" [(ngModel)]="form.role"><option value="student">Student</option><option value="owner">Room owner</option></select></label>
          <p class="error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
          <button class="primary-button" type="submit" [disabled]="submitting">{{ submitting ? 'Please wait...' : (isRegister ? 'Create account' : 'Sign in') }}</button>
        </form>
        <p class="switch-link">{{ isRegister ? 'Already have an account?' : 'New to Buddha Rental Homes?' }} <a [routerLink]="isRegister ? '/login' : '/register'" [queryParams]="route.snapshot.queryParams">{{ isRegister ? 'Sign in' : 'Create an account' }}</a></p>
   
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:calc(100vh - 160px); background:var(--paper,#f5f4ec); }
    .auth-page { min-height:calc(100vh - 160px); max-width:1180px; margin:auto; padding:55px 24px; display:grid; grid-template-columns:1fr .8fr; align-items:stretch; gap:35px; }
    .auth-art { min-height:480px; padding:45px; display:flex; flex-direction:column; justify-content:end; color:white; background:linear-gradient(0deg,rgba(20,35,25,.77),transparent 70%),url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85') center/cover; }
    .eyebrow { color:var(--green,#315d46); font-size:.73rem; text-transform:uppercase; font-weight:800; }.auth-art .eyebrow { color:#e4edc0; }.auth-art h1 { max-width:520px; margin:10px 0; font:3.5rem/1.05 Georgia,serif; }.auth-art>p:last-child { color:#f3f1e9; }
    .auth-panel { padding:40px; align-self:center; background:var(--surface,#fffefa); border:1px solid var(--line,#dedfd3); }.back-link { color:var(--muted,#69756c); font-size:.82rem; text-decoration:none; }.auth-panel .eyebrow { margin:32px 0 10px; }.auth-panel h2 { margin:0; font:2.3rem Georgia,serif; }.muted { color:var(--muted,#69756c); font-size:.88rem; line-height:1.55; }
    form { display:grid; gap:14px; margin-top:23px; }label { display:grid; gap:7px; color:var(--muted,#69756c); font-size:.74rem; font-weight:700; }input,select { width:100%; height:43px; padding:0 10px; border:1px solid var(--line,#dedfd3); background:transparent; color:var(--ink,#202a24); }input:focus,select:focus { outline:1px solid var(--green,#315d46); }.primary-button { min-height:47px; border:0; background:var(--green,#315d46); color:white; font-weight:700; cursor:pointer; }.primary-button:disabled { opacity:.6; cursor:wait; }.error { margin:0; color:#8b4634; font-size:.84rem; }.switch-link { margin-top:20px; color:var(--muted,#69756c); font-size:.83rem; }.switch-link a { color:var(--green,#315d46); font-weight:800; }.demo-accounts { margin-top:20px; color:var(--muted,#69756c); font-size:.76rem; }.demo-accounts summary { cursor:pointer; font-weight:700; }.demo-accounts p { margin:8px 0 0; }
    @media(max-width:780px) { .auth-page { grid-template-columns:1fr; padding:25px 16px; }.auth-art { min-height:230px; padding:24px; }.auth-art h1 { font-size:2.3rem; }.auth-panel { padding:25px 21px; }.auth-panel .eyebrow { margin-top:23px; } }
  `]
})
export class AuthPageComponent implements OnInit {
  isRegister = false;
  submitting = false;
  errorMessage = '';
  form: { name: string; email: string; password: string; role: 'student' | 'owner' } = { name: '', email: '', password: '', role: 'student' };

  constructor(
    readonly route: ActivatedRoute,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => this.isRegister = data['mode'] === 'register');
  }

  submit(): void {
    this.submitting = true;
    this.errorMessage = '';
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    const finishLogin = (role: UserRole) => {
      const destination = redirect?.startsWith('/') ? redirect : `/${role}`;
      this.notifications.show(`Welcome${this.isRegister ? '' : ' back'}.`);
      void this.router.navigateByUrl(destination);
    };

    const login = () => this.auth.login({ email: this.form.email, password: this.form.password }).subscribe({
      next: (user) => { this.submitting = false; finishLogin(user.role); },
      error: (error) => { this.submitting = false; this.errorMessage = error.error?.message || 'Unable to sign in.'; },
    });

    if (!this.isRegister) { login(); return; }
    this.auth.register(this.form).subscribe({
      next: () => login(),
      error: (error) => { this.submitting = false; this.errorMessage = error.error?.message || 'Unable to create the account.'; },
    });
  }
}
