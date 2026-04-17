import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../screens/onboarding/welcome_screen.dart';
import '../screens/onboarding/avg_consent_screen.dart';
import '../screens/onboarding/cv_upload_screen.dart';
import '../screens/profile/manual_profile_screen.dart';
import '../screens/profile/extracted_profile_screen.dart';
import '../screens/jobs/job_search_screen.dart';
import '../screens/apply/motivation_letter_screen.dart';
import '../screens/apply/confirmation_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/settings/settings_screen.dart';

// Notifier that rebuilds GoRouter whenever Supabase auth state changes
class _AuthNotifier extends ChangeNotifier {
  _AuthNotifier() {
    Supabase.instance.client.auth.onAuthStateChange.listen((_) {
      notifyListeners();
    });
  }
}

final _authNotifier = _AuthNotifier();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: _authNotifier,
    redirect: (context, state) {
      final session = Supabase.instance.client.auth.currentSession;
      final isLoggedIn = session != null;
      final loc = state.matchedLocation;

      final onAuthRoute =
          loc == '/login' || loc == '/register' || loc == '/forgot-password';
      final protectedRoutes = ['/profile', '/jobs', '/apply', '/confirm', '/settings'];
      final goingProtected = protectedRoutes.any((r) => loc.startsWith(r));

      if (!isLoggedIn && goingProtected) return '/login';
      if (isLoggedIn && onAuthRoute) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(path: '/avg-consent', builder: (_, __) => const AvgConsentScreen()),
      GoRoute(path: '/cv-upload', builder: (_, __) => const CvUploadScreen()),
      GoRoute(path: '/profile/manual', builder: (_, __) => const ManualProfileScreen()),
      GoRoute(path: '/profile/extracted', builder: (_, __) => const ExtractedProfileScreen()),
      GoRoute(path: '/jobs', builder: (_, __) => const JobSearchScreen()),
      GoRoute(path: '/apply', builder: (_, __) => const MotivationLetterScreen()),
      GoRoute(path: '/confirm', builder: (_, __) => const ConfirmationScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
    ],
  );
});
