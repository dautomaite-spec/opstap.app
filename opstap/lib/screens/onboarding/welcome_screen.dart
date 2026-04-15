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
      body: SafeArea(
        child: Column(
          children: [
            _HeroSection(),
            Expanded(
              child: SingleChildScrollView(
                child: _BodySection(),
              ),
            ),
            _FooterSection(),
          ],
        ),
      ),
    );
  }
}

// ─── Hero ────────────────────────────────────────────────────────────────────

class _HeroSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Gradient background
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(28, 44, 28, 44),
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [OpstapColors.primary, OpstapColors.primaryContainer],
            ),
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(28),
              bottomRight: Radius.circular(28),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Text(
                'Opstap',
                style: GoogleFonts.manrope(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 36),
              // Headline
              Text(
                'Jouw volgende\nstap begint hier.',
                style: GoogleFonts.manrope(
                  fontSize: 34,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: -0.02 * 34,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 14),
              // Subtitle
              Text(
                'De slimste manier om je carrière\nnaar een hoger niveau te tillen.',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: Colors.white.withValues(alpha: 0.8),
                  height: 1.55,
                ),
              ),
              const SizedBox(height: 4),
            ],
          ),
        ),
        // Decorative geometric pattern (career path lines)
        Positioned.fill(
          child: ClipRRect(
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(28),
              bottomRight: Radius.circular(28),
            ),
            child: CustomPaint(
              painter: _GeometricPatternPainter(),
            ),
          ),
        ),
      ],
    );
  }
}

class _GeometricPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    // Overlapping circles suggesting upward movement
    canvas.drawCircle(
      Offset(size.width * 0.85, size.height * 0.15),
      size.width * 0.35,
      paint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.75, size.height * 0.6),
      size.width * 0.25,
      paint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.95, size.height * 0.5),
      size.width * 0.4,
      paint,
    );

    // Diagonal lines suggesting progress/path
    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.06)
      ..strokeWidth = 1.0;

    for (int i = 0; i < 6; i++) {
      final offset = i * size.width * 0.18;
      canvas.drawLine(
        Offset(size.width * 0.4 + offset, 0),
        Offset(size.width * 0.4 + offset - size.height * 0.5,
            size.height),
        linePaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ─── Body ─────────────────────────────────────────────────────────────────────

class _BodySection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Feature chips
          _FeatureChipsRow(),
          const SizedBox(height: 32),
          // CTA header
          Text(
            'Hoe wil je beginnen?',
            style: GoogleFonts.manrope(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: OpstapColors.onSurface,
              letterSpacing: -0.02 * 20,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Je kunt altijd stoppen of van aanpak wisselen.',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: OpstapColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),
          // Primary button
          _GradientButton(
            label: 'CV uploaden',
            icon: Icons.upload_file_rounded,
            onPressed: () {
              final session = Supabase.instance.client.auth.currentSession;
              if (session == null) {
                context.push('/login');
              } else {
                context.push('/avg-consent');
              }
            },
          ),
          const SizedBox(height: 12),
          // Secondary button
          _SecondaryButton(
            label: 'Handmatig invullen',
            icon: Icons.edit_note_rounded,
            onPressed: () {
              final session = Supabase.instance.client.auth.currentSession;
              if (session == null) {
                context.push('/login');
              } else {
                context.push('/profile/manual');
              }
            },
          ),
        ],
      ),
    );
  }
}

class _FeatureChipsRow extends StatelessWidget {
  final _features = const [
    (Icons.description_outlined, 'CV uploaden'),
    (Icons.search_rounded, 'Vacatures'),
    (Icons.send_rounded, 'Auto-solliciteren'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _features.map((f) {
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(
              right: f == _features.last ? 0 : 8,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
            decoration: BoxDecoration(
              color: OpstapColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Icon(f.$1, size: 20, color: OpstapColors.primary),
                const SizedBox(height: 5),
                Text(
                  f.$2,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: OpstapColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

class _GradientButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  const _GradientButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [OpstapColors.primary, OpstapColors.primaryContainer],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: OpstapColors.primary.withValues(alpha: 0.28),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  const _SecondaryButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: OpstapColors.surfaceContainerHigh,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: OpstapColors.primary, size: 20),
              const SizedBox(width: 10),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: OpstapColors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Footer ───────────────────────────────────────────────────────────────────

class _FooterSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
      child: Text(
        'Door verder te gaan ga je akkoord met ons\nPrivacybeleid en de AVG-regels.',
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(
          fontSize: 11,
          color: OpstapColors.onSurfaceVariant,
          height: 1.6,
        ),
      ),
    );
  }
}
