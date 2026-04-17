import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Opstap Design System — based on Style Guide (Application Design Ideas)
abstract class OpstapColors {
  // Primary — deep indigo
  static const primary = Color(0xFF3D3A8C);
  static const primaryContainer = Color(0xFF5B57B5);
  static const onPrimary = Color(0xFFFFFFFF);

  // Secondary — muted purple
  static const secondary = Color(0xFF6B6B8A);
  static const secondaryContainer = Color(0xFFEEE9F8);
  static const onSecondary = Color(0xFFFFFFFF);

  // Accent — warm yellow
  static const accent = Color(0xFFF5C842);
  static const onAccent = Color(0xFF1A1A2E);

  // Tertiary — soft pink (decorative circles)
  static const tertiary = Color(0xFFF48FB1);
  static const tertiaryContainer = Color(0xFFFCE4EC);
  static const onTertiary = Color(0xFFFFFFFF);
  static const onTertiaryContainer = Color(0xFF880E4F);

  // Surfaces
  static const surface = Color(0xFFEEE9F8);           // lavender mist — page bg
  static const surfaceContainerLowest = Color(0xFFFFFFFF);  // white cards
  static const surfaceContainerLow = Color(0xFFFFF0E6);     // peach cards
  static const surfaceContainer = Color(0xFFE8E3F4);
  static const surfaceContainerHigh = Color(0xFFDED8F0);
  static const surfaceContainerHighest = Color(0xFFD4CEEC);
  static const surfaceDim = Color(0xFFC8C2E0);

  // Text
  static const onSurface = Color(0xFF1A1A2E);
  static const onSurfaceVariant = Color(0xFF6B6B8A);

  // Borders
  static const outline = Color(0xFF9090AA);
  static const outlineVariant = Color(0xFFD8D8E8);

  // Inverse
  static const inverseSurface = Color(0xFF1A1A2E);
  static const inverseOnSurface = Color(0xFFEEE9F8);
  static const inversePrimary = Color(0xFFB8B5FF);

  // Error
  static const error = Color(0xFFE53935);

  // Gradient for hero sections and primary buttons
  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryContainer],
  );

  // Accent gradient (yellow, used sparingly for highlights)
  static const accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF5C842), Color(0xFFFFD966)],
  );
}

abstract class OpstapTextStyles {
  static TextStyle displayLg(BuildContext context) => GoogleFonts.poppins(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: OpstapColors.onSurface,
      );

  static TextStyle headlineMd(BuildContext context) => GoogleFonts.poppins(
        fontSize: 24,
        fontWeight: FontWeight.w600,
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
        fontSize: 13,
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
      onPrimaryContainer: Color(0xFFE0DEFF),
      secondary: OpstapColors.secondary,
      onSecondary: OpstapColors.onSecondary,
      secondaryContainer: OpstapColors.secondaryContainer,
      onSecondaryContainer: Color(0xFF3D3A8C),
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
    cardTheme: CardThemeData(
      color: OpstapColors.surfaceContainerLowest,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: OpstapColors.primary,
        foregroundColor: OpstapColors.onPrimary,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
        elevation: 0,
        textStyle: GoogleFonts.poppins(
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: OpstapColors.primary,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
        side: const BorderSide(color: OpstapColors.outlineVariant),
        textStyle: GoogleFonts.poppins(
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: OpstapColors.surfaceContainerLowest,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: OpstapColors.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: OpstapColors.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: OpstapColors.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: OpstapColors.surfaceContainerLowest,
      selectedColor: OpstapColors.primary,
      labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      side: const BorderSide(color: OpstapColors.outlineVariant),
    ),
  );
}
