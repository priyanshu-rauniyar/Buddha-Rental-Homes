import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		canActivate: [authGuard],
		loadComponent: () => import('./features/home/home.page').then((module) => module.HomePageComponent),
	},
	{
		path: 'rooms/:id',
		canActivate: [authGuard],
		loadComponent: () => import('./features/room-detail/room-detail.page').then((module) => module.RoomDetailPageComponent),
	},
	{
		path: 'login',
		data: { mode: 'login' },
		loadComponent: () => import('./features/auth/auth.page').then((module) => module.AuthPageComponent),
	},
	{
		path: 'register',
		data: { mode: 'register' },
		loadComponent: () => import('./features/auth/auth.page').then((module) => module.AuthPageComponent),
	},
	{
		path: 'student',
		canActivate: [roleGuard],
		data: { role: 'student' },
		loadComponent: () => import('./features/student/student-dashboard.page').then((module) => module.StudentDashboardPageComponent),
	},
	{
		path: 'owner',
		canActivate: [roleGuard],
		data: { role: 'owner' },
		loadComponent: () => import('./features/owner/owner-dashboard.page').then((module) => module.OwnerDashboardPageComponent),
	},
	{
		path: 'admin',
		canActivate: [roleGuard],
		data: { role: 'admin' },
		loadComponent: () => import('./features/admin/admin-dashboard.page').then((module) => module.AdminDashboardPageComponent),
	},
	{ path: '**', redirectTo: '' },
];
