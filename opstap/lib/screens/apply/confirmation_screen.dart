import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../services/providers.dart';
import '../jobs/job_search_screen.dart';

class ConfirmationScreen extends ConsumerStatefulWidget {
  final List<JobListing> appliedJobs;
  final VoidCallback? onSearchMore;

  const ConfirmationScreen({
    super.key,
    this.appliedJobs = const [],
    this.onSearchMore,
  });

  @override
  ConsumerState<ConfirmationScreen> createState() =>
      _ConfirmationScreenState();
}

class _ConfirmationScreenState extends ConsumerState<ConfirmationScreen>
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
    _scaleAnim =
        CurvedAnimation(parent: _controller, curve: Curves.elasticOut);
    _fadeAnim =
        CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Use passed jobs if available, otherwise fall back to history from API
    final historyAsync = ref.watch(applicationHistoryProvider);

    final jobs = widget.appliedJobs;
    final count = jobs.isNotEmpty
        ? jobs.length
        : historyAsync.valueOrNull?.length ?? 0;

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
                    child: const _SuccessIcon(),
                  ),
                ),
                const SizedBox(height: 28),

                Text(
                  'Gefeliciteerd!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
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
                      height: 1.5),
                ),
                const SizedBox(height: 36),

                // Applied jobs list — use passed jobs, else API history
                _SectionLabel('Overzicht van je sollicitaties'),
                const SizedBox(height: 12),
                if (jobs.isNotEmpty)
                  _JobsList(jobs: jobs)
                else
                  historyAsync.when(
                    loading: () => const Center(
                        child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(
                          color: OpstapColors.primary),
                    )),
                    error: (_, __) => const SizedBox.shrink(),
                    data: (history) => _HistoryList(history: history),
                  ),

                const SizedBox(height: 36),
                _SectionLabel('Wat nu?'),
                const SizedBox(height: 12),
                _NextStepCard(
                  icon: Icons.search_rounded,
                  title: 'Meer vacatures zoeken',
                  subtitle: 'Vind nog meer passende vacatures',
                  onTap: widget.onSearchMore ?? () => context.go('/app'),
                ),
                const SizedBox(height: 10),
                _NextStepCard(
                  icon: Icons.assignment_rounded,
                  title: 'Jouw sollicitaties bekijken',
                  subtitle: 'Bekijk de status van je sollicitaties',
                  onTap: () => context.go('/app'),
                ),
                const SizedBox(height: 10),
                _NextStepCard(
                  icon: Icons.settings_rounded,
                  title: 'Instellingen',
                  subtitle: 'Privacy, account en gegevensbeheer',
                  onTap: () => context.go('/settings'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Job lists ────────────────────────────────────────────────────────────────

class _JobsList extends StatelessWidget {
  final List<JobListing> jobs;
  const _JobsList({required this.jobs});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: OpstapColors.onSurface.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 3),
          )
        ],
      ),
      child: Column(
        children: jobs.mapIndexed((i, job) => Column(
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
                            job.company.isNotEmpty
                                ? job.company[0]
                                : '?',
                            style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Colors.white),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(job.title,
                                style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: OpstapColors.onSurface)),
                            Text(job.company,
                                style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: OpstapColors.onSurfaceVariant)),
                          ],
                        ),
                      ),
                      const Icon(Icons.check_circle_rounded,
                          size: 18, color: Color(0xFF16A34A)),
                    ],
                  ),
                ),
                if (i < jobs.length - 1)
                  Divider(
                      height: 1,
                      indent: 62,
                      color: OpstapColors.outlineVariant
                          .withValues(alpha: 0.4)),
              ],
            )).toList(),
      ),
    );
  }
}

class _HistoryList extends StatelessWidget {
  final List<Map<String, dynamic>> history;
  const _HistoryList({required this.history});

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) return const SizedBox.shrink();
    final recent = history.take(5).toList();

    return Container(
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: OpstapColors.onSurface.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 3),
          )
        ],
      ),
      child: Column(
        children: recent.mapIndexed((i, app) {
          final company = app['company'] as String? ?? '';
          final title = app['job_title'] as String? ?? '';
          final status = app['status'] as String? ?? 'pending';
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
                        color: _colorFor(company),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          company.isNotEmpty ? company[0] : '?',
                          style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title,
                              style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: OpstapColors.onSurface)),
                          Text(company,
                              style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: OpstapColors.onSurfaceVariant)),
                        ],
                      ),
                    ),
                    _StatusBadge(status: status),
                  ],
                ),
              ),
              if (i < recent.length - 1)
                Divider(
                    height: 1,
                    indent: 62,
                    color: OpstapColors.outlineVariant
                        .withValues(alpha: 0.4)),
            ],
          );
        }).toList(),
      ),
    );
  }

  static Color _colorFor(String company) {
    const colours = [
      Color(0xFF0056B3), Color(0xFFE65100), Color(0xFF2E7D32),
      Color(0xFF6A1B9A), Color(0xFF00695C), Color(0xFF1565C0),
    ];
    if (company.isEmpty) return colours[0];
    return colours[company.codeUnits.fold(0, (a, b) => a + b) % colours.length];
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'sent' => ('Verstuurd', const Color(0xFF16A34A)),
      'failed' => ('Mislukt', OpstapColors.error),
      _ => ('In behandeling', OpstapColors.onSurfaceVariant),
    };
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label,
            style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: color)),
      ],
    );
  }
}

// ─── Shared widgets ───────────────────────────────────────────────────────────

class _SuccessIcon extends StatelessWidget {
  const _SuccessIcon();

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: OpstapColors.primary.withValues(alpha: 0.08),
          ),
        ),
        Container(
          width: 88,
          height: 88,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: OpstapColors.heroGradient,
          ),
          child: const Icon(Icons.check_rounded,
              color: Colors.white, size: 44),
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
      style: GoogleFonts.poppins(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: OpstapColors.onSurface),
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
                child:
                    Icon(icon, color: OpstapColors.primary, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: OpstapColors.onSurface)),
                    Text(subtitle,
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            color: OpstapColors.onSurfaceVariant)),
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

// Dart doesn't have Iterable.mapIndexed built-in before 3.x extensions
extension _IndexedMap<T> on List<T> {
  List<R> mapIndexed<R>(R Function(int i, T e) f) =>
      List.generate(length, (i) => f(i, this[i]));
}
