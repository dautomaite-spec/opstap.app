import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/theme.dart';
import '../../services/providers.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = Supabase.instance.client.auth.currentUser;
    final profileAsync = ref.watch(profileNotifierProvider);
    final applicationsAsync = ref.watch(applicationHistoryProvider);

    return Scaffold(
      backgroundColor: OpstapColors.surface,
      appBar: AppBar(
        backgroundColor: OpstapColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          color: OpstapColors.onSurface,
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Mijn account',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: OpstapColors.onSurface,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ── Avatar + email ───────────────────────────────────────────────
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: OpstapColors.primaryContainer,
                  child: Text(
                    _initials(user),
                    style: GoogleFonts.poppins(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: OpstapColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user?.email ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: OpstapColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 28),

          // ── Section 1: Personal information ─────────────────────────────
          _SectionHeader(title: 'Persoonlijke gegevens'),
          const SizedBox(height: 12),
          profileAsync.when(
            loading: () => const _LoadingCard(),
            error: (_, __) => _InfoCard(
              items: const [_InfoRow(label: 'Status', value: 'Geen profiel aangemaakt')],
            ),
            data: (profile) {
              if (profile == null) {
                return _EmptyCard(
                  message: 'Nog geen profiel ingevuld.',
                  actionLabel: 'Profiel aanmaken',
                  onAction: () => context.push('/profile/manual'),
                );
              }
              return _InfoCard(items: [
                if (profile['full_name'] != null)
                  _InfoRow(label: 'Naam', value: profile['full_name'] as String),
                if (profile['location'] != null)
                  _InfoRow(label: 'Locatie', value: profile['location'] as String),
                if (profile['job_title'] != null)
                  _InfoRow(label: 'Functie', value: profile['job_title'] as String),
                if (profile['availability'] != null)
                  _InfoRow(label: 'Beschikbaarheid', value: profile['availability'] as String),
              ]);
            },
          ),

          const SizedBox(height: 24),

          // ── Section 2: Applied jobs ──────────────────────────────────────
          _SectionHeader(title: 'Sollicitaties'),
          const SizedBox(height: 12),
          applicationsAsync.when(
            loading: () => const _LoadingCard(),
            error: (_, __) => const _InfoCard(
              items: [_InfoRow(label: 'Status', value: 'Kon sollicitaties niet laden')],
            ),
            data: (apps) {
              if (apps.isEmpty) {
                return const _EmptyCard(message: 'Je hebt nog niet gesolliciteerd.');
              }
              return _ApplicationsList(applications: apps);
            },
          ),

          const SizedBox(height: 24),

          // ── Section 3: Preferences ───────────────────────────────────────
          _SectionHeader(title: 'Voorkeuren'),
          const SizedBox(height: 12),
          const _EmptyCard(message: 'Voorkeuren komen binnenkort.'),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _initials(User? user) {
    final email = user?.email ?? '';
    if (email.isEmpty) return '?';
    return email[0].toUpperCase();
  }
}

// ─── Section header ──────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: OpstapColors.onSurface,
      ),
    );
  }
}

// ─── Info card ───────────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  final List<_InfoRow> items;
  const _InfoCard({required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const _EmptyCard(message: 'Geen gegevens beschikbaar.');
    }
    return Container(
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: OpstapColors.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: items
            .map((row) => _InfoRowWidget(label: row.label, value: row.value))
            .toList(),
      ),
    );
  }
}

class _InfoRow {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});
}

class _InfoRowWidget extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRowWidget({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 13, color: OpstapColors.onSurfaceVariant)),
          Text(value,
              style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: OpstapColors.onSurface)),
        ],
      ),
    );
  }
}

// ─── Empty card ──────────────────────────────────────────────────────────────

class _EmptyCard extends StatelessWidget {
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  const _EmptyCard({required this.message, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: OpstapColors.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(message,
              style: GoogleFonts.inter(
                  fontSize: 13, color: OpstapColors.onSurfaceVariant)),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 12),
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  foregroundColor: OpstapColors.primary),
              child: Text(actionLabel!,
                  style: GoogleFonts.poppins(
                      fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Loading card ─────────────────────────────────────────────────────────────

class _LoadingCard extends StatelessWidget {
  const _LoadingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }
}

// ─── Applications list ───────────────────────────────────────────────────────

class _ApplicationsList extends StatelessWidget {
  final List<Map<String, dynamic>> applications;
  const _ApplicationsList({required this.applications});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: OpstapColors.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: applications.take(10).map((app) {
          final title = app['job_title'] as String? ?? app['title'] as String? ?? 'Vacature';
          final company = app['company'] as String? ?? '';
          final status = app['status'] as String? ?? 'Verzonden';
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: OpstapColors.onSurface)),
                      if (company.isNotEmpty)
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
          );
        }).toList(),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: OpstapColors.primaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: OpstapColors.primary,
        ),
      ),
    );
  }
}
