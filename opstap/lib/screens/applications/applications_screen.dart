import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../services/providers.dart';

class ApplicationsScreen extends ConsumerWidget {
  const ApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appsAsync = ref.watch(applicationHistoryProvider);

    return Scaffold(
      backgroundColor: OpstapColors.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              child: Text(
                'Sollicitaties',
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: OpstapColors.onSurface,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Text(
                'Overzicht van verstuurde brieven.',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: OpstapColors.onSurfaceVariant,
                ),
              ),
            ),
            Expanded(
              child: appsAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(color: OpstapColors.primary),
                ),
                error: (_, __) => _EmptyState(
                  icon: Icons.wifi_off_rounded,
                  title: 'Kan niet laden',
                  subtitle: 'Controleer je verbinding en probeer opnieuw.',
                  onRetry: () => ref.invalidate(applicationHistoryProvider),
                ),
                data: (apps) {
                  if (apps.isEmpty) {
                    return const _EmptyState(
                      icon: Icons.send_outlined,
                      title: 'Nog geen sollicitaties',
                      subtitle: 'Zodra je solliciteert vind je je verstuurde brieven hier terug.',
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    itemCount: apps.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _ApplicationCard(app: apps[i]),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  final Map<String, dynamic> app;
  const _ApplicationCard({required this.app});

  @override
  Widget build(BuildContext context) {
    final status = app['status'] as String? ?? 'sent';
    final sentAt = app['sent_at'] as String?;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(color: Color(0x0F000000), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          _StatusDot(status: status),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  app['job_title'] as String? ?? 'Onbekende functie',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: OpstapColors.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  app['company'] as String? ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: OpstapColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (sentAt != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    _formatDate(sentAt),
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: OpstapColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
          _StatusChip(status: status),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.day}-${dt.month}-${dt.year}';
    } catch (_) {
      return '';
    }
  }
}

class _StatusDot extends StatelessWidget {
  final String status;
  const _StatusDot({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'sent' => OpstapColors.primary,
      'failed' => OpstapColors.error,
      _ => OpstapColors.onSurfaceVariant,
    };
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final label = switch (status) {
      'sent' => 'Verstuurd',
      'failed' => 'Mislukt',
      _ => 'In behandeling',
    };
    final color = switch (status) {
      'sent' => OpstapColors.primary,
      'failed' => OpstapColors.error,
      _ => OpstapColors.onSurfaceVariant,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onRetry;
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 52, color: OpstapColors.onSurfaceVariant),
            const SizedBox(height: 16),
            Text(
              title,
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: OpstapColors.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: OpstapColors.onSurfaceVariant,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Opnieuw proberen'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: OpstapColors.primary,
                  side: const BorderSide(color: OpstapColors.primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
