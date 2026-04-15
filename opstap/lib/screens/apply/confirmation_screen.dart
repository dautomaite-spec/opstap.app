import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../jobs/job_search_screen.dart';

class ConfirmationScreen extends StatefulWidget {
  final List<JobListing> appliedJobs;
  final VoidCallback? onSearchMore;

  const ConfirmationScreen({
    super.key,
    this.appliedJobs = const [],
    this.onSearchMore,
  });

  @override
  State<ConfirmationScreen> createState() => _ConfirmationScreenState();
}

class _ConfirmationScreenState extends State<ConfirmationScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnim = CurvedAnimation(parent: _controller, curve: Curves.elasticOut);
    _fadeAnim = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final count = widget.appliedJobs.length;

    return Scaffold(
      backgroundColor: OpstapColors.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 32),
          child: FadeTransition(
            opacity: _fadeAnim,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Success icon
                Center(
                  child: ScaleTransition(
                    scale: _scaleAnim,
                    child: _SuccessIcon(),
                  ),
                ),
                const SizedBox(height: 28),
                // Headline
                Text(
                  'Gefeliciteerd!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.manrope(
                    fontSize: 32,
                    fontWeight: FontWeight.w700,
                    color: OpstapColors.onSurface,
                    letterSpacing: -0.02 * 32,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Je hebt succesvol gesolliciteerd op '
                  '$count ${count == 1 ? 'vacature' : 'vacatures'}.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    color: OpstapColors.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 36),
                // Applied jobs summary
                _SectionLabel('Overzicht van je sollicitaties'),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: OpstapColors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: widget.appliedJobs.map((job) {
                      final isLast = job == widget.appliedJobs.last;
                      return Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 12),
                            child: Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: job.logoColor,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Center(
                                    child: Text(
                                      job.company[0],
                                      style: GoogleFonts.manrope(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        job.title,
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: OpstapColors.onSurface,
                                        ),
                                      ),
                                      Text(
                                        job.company,
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: OpstapColors.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.check_circle_rounded,
                                    size: 18, color: Color(0xFF2E7D32)),
                              ],
                            ),
                          ),
                          if (!isLast)
                            Divider(
                              height: 1,
                              indent: 62,
                              color: OpstapColors.outlineVariant
                                  .withValues(alpha: 0.4),
                            ),
                        ],
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 36),
                // What now
                _SectionLabel('Wat nu?'),
                const SizedBox(height: 12),
                _NextStepCard(
                  icon: Icons.search_rounded,
                  title: 'Meer vacatures zoeken',
                  subtitle: 'Vind nog meer passende vacatures',
                  onTap: widget.onSearchMore ?? () => context.go('/jobs'),
                ),
                const SizedBox(height: 10),
                _NextStepCard(
                  icon: Icons.assignment_rounded,
                  title: 'Jouw sollicitaties bekijken',
                  subtitle: 'Bekijk de status van je sollicitaties',
                  onTap: () {
                    // TODO: navigate to applications list
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SuccessIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Outer glow ring
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: OpstapColors.primary.withValues(alpha: 0.08),
          ),
        ),
        // Inner circle
        Container(
          width: 88,
          height: 88,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [OpstapColors.primary, OpstapColors.primaryContainer],
            ),
          ),
          child: const Icon(Icons.check_rounded, color: Colors.white, size: 44),
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.manrope(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: OpstapColors.onSurface,
        letterSpacing: -0.01 * 15,
      ),
    );
  }
}

class _NextStepCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _NextStepCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: OpstapColors.surfaceContainerLowest,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: OpstapColors.secondaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: OpstapColors.primary, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: OpstapColors.onSurface,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: OpstapColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded,
                  size: 14, color: OpstapColors.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}
