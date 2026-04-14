import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Opstap Design System — "Career Architect"
// Sourced from Google Stitch design: projects/4148466425856813163
abstract class OpstapColors {
  static const primary = Color(0xFF003F87);
  static const primaryContainer = Color(0xFF0056B3);
  static const onPrimary = Color(0xFFFFFFFF);
  static const secondary = Color(0xFF4C5E84);
  static const secondaryContainer = Color(0xFFBFD2FD);
  static const onSecondary = Color(0xFFFFFFFF);
  static const tertiary = Color(0xFF722B00);
  static const tertiaryContainer = Color(0xFF983C00);
  static const onTertiary = Color(0xFFFFFFFF);
  static const onTertiaryContainer = Color(0xFFFFC2A7);
  static const error = Color(0xFFBA1A1A);
  static const surface = Color(0xFFF9F9F9);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerLow = Color(0xFFF3F3F4);
  static const surfaceContainer = Color(0xFFEEEEEE);
  static const surfaceContainerHigh = Color(0xFFE8E8E8);
  static const surfaceContainerHighest = Color(0xFFE2E2E2);
  static const surfaceDim = Color(0xFFDADADA);
  static const onSurface = Color(0xFF1A1C1C);
  static const onSurfaceVariant = Color(0xFF424752);
  static const outline = Color(0xFF727784);
  static const outlineVariant = Color(0xFFC2C6D4);
  static const inverseSurface = Color(0xFF2F3131);
  static const inverseOnSurface = Color(0xFFF0F1F1);
  static const inversePrimary = Color(0xFFACC7FF);

  // Gradient used for hero sections and primary buttons
  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    transform: GradientRotation(135 * 3.14159 / 180),
    colors: [primary, primaryContainer],
  );
}

abstract class OpstapTextStyles {
  static TextStyle displayLg(BuildContext context) => GoogleFonts.manrope(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.02 * 32,
        color: OpstapColors.onSurface,
      );

  static TextStyle headlineMd(BuildContext context) => GoogleFonts.manrope(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.02 * 24,
        color: OpstapColors.onSurface,
      );

  static TextStyle titleMd(BuildContext context) => GoogleFonts.manrope(
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
      onPrimaryContainer: Color(0xFFBBD0FF),
      secondary: OpstapColors.secondary,
      onSecondary: OpstapColors.onSecondary,
      secondaryContainer: OpstapColors.secondaryContainer,
      onSecondaryContainer: Color(0xFF475A7F),
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
