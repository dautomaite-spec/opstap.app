import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Opstap Design System — "Joyful Career"
// Reference: Human input/Application Design Ideas.jpeg
// Background: lavender · Cards: white · Primary: indigo · Active: yellow
abstract class OpstapColors {
  // Primary — deep indigo-violet
  static const primary = Color(0xFF3E3CB6);
  static const primaryContainer = Color(0xFF5653CA);
  static const onPrimary = Color(0xFFFFFFFF);

  // Secondary — muted purple-gray (used for chips, skill tags)
  static const secondary = Color(0xFF6B6887);
  static const secondaryContainer = Color(0xFFE8E4FA);
  static const onSecondary = Color(0xFFFFFFFF);
  static const onSecondaryContainer = Color(0xFF3E3B62);

  // Tertiary → Yellow: active/selected states, match score chips
  static const tertiary = Color(0xFF8B5000);
  static const tertiaryContainer = Color(0xFFFFD55A);
  static const onTertiary = Color(0xFFFFFFFF);
  static const onTertiaryContainer = Color(0xFF1C1A2E);

  // Error
  static const error = Color(0xFFBA1A1A);

  // Surfaces — lavender hierarchy
  static const surface = Color(0xFFEAE7F5);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerLow = Color(0xFFF4F2FB);
  static const surfaceContainer = Color(0xFFEEEBF7);
  static const surfaceContainerHigh = Color(0xFFE5E2F2);
  static const surfaceContainerHighest = Color(0xFFDDD9EC);
  static const surfaceDim = Color(0xFFD1CDE8);

  // Content
  static const onSurface = Color(0xFF1C1A2E);
  static const onSurfaceVariant = Color(0xFF6B6880);

  // Borders
  static const outline = Color(0xFFA8A4BC);
  static const outlineVariant = Color(0xFFCCCAE0);

  // Inverse
  static const inverseSurface = Color(0xFF302F44);
  static const inverseOnSurface = Color(0xFFF2EFF8);
  static const inversePrimary = Color(0xFFBEB9FF);

  // Extended accents — decorative circles, hero highlights
  static const warmAccent = Color(0xFFF8D8B0);
  static const pinkAccent = Color(0xFFFFAAC4);

  // Gradient shorthand
  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryContainer],
  );
}

abstract class OpstapTextStyles {
  static TextStyle displayLg(BuildContext context) => GoogleFonts.poppins(
        fontSize: 34,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: OpstapColors.onSurface,
      );

  static TextStyle headlineMd(BuildContext context) => GoogleFonts.poppins(
        fontSize: 26,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: OpstapColors.onSurface,
      );

  static TextStyle titleMd(BuildContext context) => GoogleFonts.poppins(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: OpstapColors.onSurface,
      );

  static TextStyle bodyMd(BuildContext context) => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: OpstapColors.onSurface,
      );

  static TextStyle bodySm(BuildContext context) => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: OpstapColors.onSurfaceVariant,
      );

  static TextStyle labelMd(BuildContext context) => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: OpstapColors.onSurface,
      );
}

ThemeData opstapTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme(
      brightness: Brightness.light,
      primary: OpstapColors.primary,
      onPrimary: OpstapColors.onPrimary,
      primaryContainer: OpstapColors.primaryContainer,
      onPrimaryContainer: Color(0xFFBEB9FF),
      secondary: OpstapColors.secondary,
      onSecondary: OpstapColors.onSecondary,
      secondaryContainer: OpstapColors.secondaryContainer,
      onSecondaryContainer: OpstapColors.onSecondaryContainer,
      tertiary: OpstapColors.tertiary,
      onTertiary: OpstapColors.onTertiary,
      tertiaryContainer: OpstapColors.tertiaryContainer,
      onTertiaryContainer: OpstapColors.onTertiaryContainer,
      error: OpstapColors.error,
      onError: Colors.white,
      errorContainer: Color(0xFFFFDAD6),
      onErrorContainer: Color(0xFF93000A),
      surface: OpstapColors.surface,
      onSurface: OpstapColors.onSurface,
      onSurfaceVariant: OpstapColors.onSurfaceVariant,
      outline: OpstapColors.outline,
      outlineVariant: OpstapColors.outlineVariant,
      inverseSurface: OpstapColors.inverseSurface,
      onInverseSurface: OpstapColors.inverseOnSurface,
      inversePrimary: OpstapColors.inversePrimary,
    ),
    textTheme: GoogleFonts.interTextTheme(),
    scaffoldBackgroundColor: OpstapColors.surface,
    splashFactory: InkSparkle.splashFactory,
  );
}
