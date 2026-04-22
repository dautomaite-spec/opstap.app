import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: OpstapColors.surface,
      body: Stack(
        children: [
          // ── Decorative circles ──────────────────────────────────────────
          // Top-right: large indigo
          Positioned(
            top: -40,
            right: -40,
            child: _Circle(size: 160, color: OpstapColors.primary),
          ),
          // Top-right: small yellow
          Positioned(
            top: 60,
            right: 80,
            child: _Circle(size: 52, color: OpstapColors.accent),
          ),
          // Bottom-left: medium pink
          Positioned(
            bottom: 120,
            left: -30,
            child: _Circle(size: 100, color: OpstapColors.tertiary),
          ),
          // Bottom-left: small indigo
          Positioned(
            bottom: 80,
            left: 60,
            child: _Circle(size: 36, color: OpstapColors.primary),
          ),

          // ── Content ─────────────────────────────────────────────────────
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Logo bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                  child: Text(
                    'Opstap',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: OpstapColors.onSurface,
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Headline
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    'Meer kansen.\nMinder moeite.',
                    style: GoogleFonts.poppins(
                      fontSize: 36,
                      fontWeight: FontWeight.w700,
                      color: OpstapColors.onSurface,
                      height: 1.15,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    'Automatisch solliciteren op Nederlandse vacatures.\nJij beheert alles.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: OpstapColors.onSurfaceVariant,
                      height: 1.6,
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Feature chips row
                SizedBox(
                  height: 80,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    children: const [
                      _FeatureChip(icon: Icons.description_outlined, label: 'CV uploaden'),
                      SizedBox(width: 12),
                      _FeatureChip(icon: Icons.search_rounded, label: 'Vacatures'),
                      SizedBox(width: 12),
                      _FeatureChip(icon: Icons.send_rounded, label: 'Auto-solliciteren'),
                    ],
                  ),
                ),

                const Spacer(),

                // CTA card
                Container(
                  margin: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: OpstapColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: OpstapColors.primary.withValues(alpha: 0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Hoe wil je beginnen?',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: OpstapColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Je kunt altijd stoppen of van aanpak wisselen.',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: OpstapColors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Primary button — indigo pill
                      _PrimaryButton(
                        label: 'CV uploaden',
                        icon: Icons.upload_file_rounded,
                        onPressed: () {
                          final session =
                              Supabase.instance.client.auth.currentSession;
                          if (session == null) {
                            context.push('/login');
                          } else {
                            context.push('/avg-consent');
                          }
                        },
                      ),
                      const SizedBox(height: 12),

                      // Secondary button — outline pill
                      _OutlineButton(
                        label: 'Handmatig invullen',
                        icon: Icons.edit_note_rounded,
                        onPressed: () {
                          final session =
                              Supabase.instance.client.auth.currentSession;
                          if (session == null) {
                            context.push('/login');
                          } else {
                            context.push('/profile/manual');
                          }
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Footer
                Center(
                  child: Text(
                    'Door verder te gaan ga je akkoord met ons Privacybeleid.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: OpstapColors.onSurfaceVariant,
                    ),
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Decorative circle ────────────────────────────────────────────────────────

class _Circle extends StatelessWidget {
  final double size;
  final Color color;
  const _Circle({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

// ─── Feature chip ─────────────────────────────────────────────────────────────

class _FeatureChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _FeatureChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: OpstapColors.primary.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 22, color: OpstapColors.primary),
          const SizedBox(height: 6),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: OpstapColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

class _PrimaryButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  const _PrimaryButton(
      {required this.label, required this.icon, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 18),
        label: Text(label),
        style: ElevatedButton.styleFrom(
          backgroundColor: OpstapColors.primary,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          elevation: 0,
          textStyle:
              GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _OutlineButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  const _OutlineButton(
      {required this.label, required this.icon, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 18),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: OpstapColors.primary,
          side: const BorderSide(color: OpstapColors.outlineVariant, width: 1.5),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          textStyle:
              GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}
