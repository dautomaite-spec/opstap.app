import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import 'avg_consent_screen.dart';
import 'cv_upload_screen.dart';
import '../profile/extracted_profile_screen.dart';
import '../profile/manual_profile_screen.dart';
import '../jobs/job_search_screen.dart';

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
                style: GoogleFonts.poppins(
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
                style: GoogleFonts.poppins(
                  fontSize: 34,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: -0.5,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 14),
              // Subtitle
              Text(
                'Slimmer solliciteren.\nJij aan het stuur.',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: Colors.white.withValues(alpha: 0.82),
                  height: 1.55,
                ),
              ),
              const SizedBox(height: 4),
            ],
          ),
        ),
        // Organic circles decoration
        Positioned.fill(
          child: ClipRRect(
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(28),
              bottomRight: Radius.circular(28),
            ),
            child: CustomPaint(
              painter: _OrganicCirclesPainter(),
            ),
          ),
        ),
      ],
    );
  }
}

class _OrganicCirclesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Large white — upper right, partially off-canvas
    canvas.drawCircle(
      Offset(size.width * 1.08, size.height * 0.08),
      size.width * 0.45,
      Paint()..color = Colors.white.withValues(alpha: 0.10),
    );
    // Mid white — right edge
    canvas.drawCircle(
      Offset(size.width * 0.88, size.height * 0.62),
      size.width * 0.26,
      Paint()..color = Colors.white.withValues(alpha: 0.07),
    );
    // Yellow accent — upper left, partially off-canvas
    canvas.drawCircle(
      Offset(size.width * -0.06, size.height * 0.22),
      size.width * 0.26,
      Paint()..color = const Color(0xFFFFD55A).withValues(alpha: 0.30),
    );
    // Pink accent — lower right
    canvas.drawCircle(
      Offset(size.width * 0.94, size.height * 0.88),
      size.width * 0.18,
      Paint()..color = const Color(0xFFFFAAC4).withValues(alpha: 0.38),
    );
    // Peach accent — lower left
    canvas.drawCircle(
      Offset(size.width * 0.08, size.height * 0.92),
      size.width * 0.12,
      Paint()..color = const Color(0xFFF8D8B0).withValues(alpha: 0.40),
    );
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
          // Benefits
          _BenefitsList(),
          const SizedBox(height: 32),
          // CTA header
          Text(
            'Hoe wil je beginnen?',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: OpstapColors.onSurface,
              letterSpacing: -0.3,
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
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => AvgConsentScreen(
                    onAccepted: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => CvUploadScreen(
                            onUploaded: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ExtractedProfileScreen(
                                    onConfirmed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => JobSearchScreen(
                                            onApply: (_) {},
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      );
                    },
                    onDeclined: () => Navigator.pop(context),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          // Secondary button
          _SecondaryButton(
            label: 'Handmatig invullen',
            icon: Icons.edit_note_rounded,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ManualProfileScreen(
                    onSaved: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => JobSearchScreen(
                            onApply: (_) {},
                          ),
                        ),
                      );
                    },
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _BenefitsList extends StatelessWidget {
  static const _benefits = [
    (
      Icons.visibility_off_rounded,
      'Jij bepaalt wie jouw CV ziet',
      'Je deelt je gegevens alleen met werkgevers die jij kiest — nooit automatisch.',
    ),
    (
      Icons.auto_awesome_rounded,
      'Op maat gemaakte motivatiebrieven',
      'AI schrijft voor elke vacature een unieke, gepersonaliseerde brief in het Nederlands.',
    ),
    (
      Icons.search_rounded,
      'Vacatures van alle grote NL-boards',
      'Indeed, LinkedIn, Jobbird en Nationale Vacaturebank in één overzicht.',
    ),
    (
      Icons.send_rounded,
      'Solliciteer op meerdere vacatures tegelijk',
      'Selecteer vacatures en solliciteer met één druk op de knop.',
    ),
    (
      Icons.lock_rounded,
      'Jouw data wordt niet gedeeld met derden',
      'Je gegevens blijven van jou. Altijd inzichtelijk, altijd verwijderbaar.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1C1A2E).withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: _benefits.map((b) {
          final isLast = b == _benefits.last;
          return Column(
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: OpstapColors.secondaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(b.$1,
                          size: 18, color: OpstapColors.primary),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            b.$2,
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: OpstapColors.onSurface,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            b.$3,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: OpstapColors.onSurfaceVariant,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (!isLast)
                Divider(
                  height: 1,
                  indent: 68,
                  endIndent: 16,
                  color: OpstapColors.outlineVariant.withValues(alpha: 0.5),
                ),
            ],
          );
        }).toList(),
      ),
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
        borderRadius: BorderRadius.circular(30),
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
        borderRadius: BorderRadius.circular(30),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(30),
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
      color: OpstapColors.surfaceContainerLowest,
      borderRadius: BorderRadius.circular(30),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(30),
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
        'Door verder te gaan ga je akkoord met ons\nPrivacybeleid.',
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
