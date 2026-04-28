import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../screens/onboarding/intro_screen.dart';
import '../screens/onboarding/welcome_screen.dart';
import '../screens/onboarding/avg_consent_screen.dart';
import '../screens/onboarding/cv_upload_screen.dart';
import '../screens/profile/manual_profile_screen.dart';
import '../screens/profile/extracted_profile_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/main_shell.dart';
import '../screens/account/account_screen.dart';

class _AuthNotifier extends ChangeNotifier {
  _AuthNotifier() {
    Supabase.instance.client.auth.onAuthStateChange.listen((_) {
      notifyListeners();
    });
  }
}

final _authNotifier = _AuthNotifier();

final routerProvider = Provider.family<GoRouter, String>((ref, initialLocation) {
  return GoRouter(
    initialLocation: initialLocation,
    refreshListenable: _authNotifier,
    redirect: (context, state) {
      final session = Supabase.instance.client.auth.currentSession;
      final isLoggedIn = session != null;
      final loc = state.matchedLocation;

      final onAuthRoute = loc == '/login' ||
          loc == '/register' ||
          loc == '/forgot-password';
      final protectedPrefixes = ['/app', '/account', '/avg-consent', '/cv-upload', '/profile', '/apply', '/confirm'];
      final goingProtected = protectedPrefixes.any((r) => loc.startsWith(r));

      if (!isLoggedIn && goingProtected) return '/login';
      if (isLoggedIn && onAuthRoute) return '/app';
      return null;
    },
    routes: [
      // Public
      GoRoute(path: '/intro', builder: (_, __) => const IntroScreen()),
      GoRoute(path: '/', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),

      // Onboarding (auth required)
      GoRoute(path: '/avg-consent', builder: (_, __) => const AvgConsentScreen()),
      GoRoute(path: '/cv-upload', builder: (_, __) => const CvUploadScreen()),
      GoRoute(path: '/profile/manual', builder: (_, __) => const ManualProfileScreen()),
      GoRoute(path: '/profile/extracted', builder: (_, __) => const ExtractedProfileScreen()),

      // Account overview
      GoRoute(path: '/account', builder: (_, __) => const AccountScreen()),

      // Main shell — bottom nav (jobs / applications / settings)
      GoRoute(path: '/app', builder: (_, __) => const MainShell()),
    ],
  );
});
