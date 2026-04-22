import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/theme.dart';
import 'core/router.dart';
import 'core/env.dart';
import 'screens/onboarding/intro_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );

  final showIntro = !(await hasSeenIntro());

  runApp(ProviderScope(child: OpstapApp(initialLocation: showIntro ? '/intro' : '/')));
}

class OpstapApp extends ConsumerWidget {
  final String initialLocation;
  const OpstapApp({super.key, required this.initialLocation});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider(initialLocation));
    return MaterialApp.router(
      title: 'Opstap',
      debugShowCheckedModeBanner: false,
      theme: opstapTheme(),
      routerConfig: router,
    );
  }
}
