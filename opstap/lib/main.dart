import 'package:flutter/material.dart';
import 'core/theme.dart';
import 'screens/onboarding/welcome_screen.dart';

void main() {
  runApp(const OpstapApp());
}

class OpstapApp extends StatelessWidget {
  const OpstapApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Opstap',
      debugShowCheckedModeBanner: false,
      theme: opstapTheme(),
      home: const WelcomeScreen(),
    );
  }
}
