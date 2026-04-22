import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme.dart';
import '../../services/api_client.dart';
import '../../services/providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = Supabase.instance.client.auth.currentUser;
    final profileAsync = ref.watch(profileNotifierProvider);

    return Scaffold(
      backgroundColor: OpstapColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(
          'Instellingen',
          style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: OpstapColors.onSurface),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        children: [
          // ── Account ──────────────────────────────────────────────────────
          _SectionHeader('Account'),
          _SettingsCard(children: [
            _AccountTile(
              email: user?.email ?? '',
              name: profileAsync.valueOrNull?['naam'] as String? ?? '',
            ),
            const _Divider(),
            _ActionTile(
              icon: Icons.logout_rounded,
              label: 'Uitloggen',
              onTap: () => _confirmLogout(context, ref),
            ),
          ]),

          // ── Privacy & data ───────────────────────────────────────────────
          _SectionHeader('Privacy & gegevens'),
          _SettingsCard(children: [
            _InfoTile(
              icon: Icons.storage_rounded,
              label: 'CV-opslag',
              subtitle: 'Je CV wordt versleuteld opgeslagen op EU-servers',
            ),
            const _Divider(),
            _ActionTile(
              icon: Icons.delete_outline_rounded,
              label: 'CV verwijderen',
              subtitle: 'Verwijder je opgeslagen CV direct',
              onTap: () => _confirmDeleteCv(context, ref),
            ),
            const _Divider(),
            _ActionTile(
              icon: Icons.download_rounded,
              label: 'Mijn gegevens exporteren',
              subtitle: 'Download al je opgeslagen data als JSON',
              onTap: () => _exportData(context, ref),
            ),
            const _Divider(),
            _ActionTile(
              icon: Icons.delete_forever_rounded,
              label: 'Account verwijderen',
              subtitle: 'Verwijdert al je gegevens permanent',
              destructive: true,
              onTap: () => _confirmDeleteAccount(context, ref),
            ),
          ]),

          // ── Notifications ─────────────────────────────────────────────────
          _SectionHeader('Meldingen'),
          _SettingsCard(children: [
            _SwitchTile(
              icon: Icons.notifications_outlined,
              label: 'Vacaturemeldingen',
              subtitle: 'Ontvang een melding bij nieuwe passende vacatures',
              value: true,
              onChanged: (_) {},   // TODO: persist preference
            ),
            const _Divider(),
            _SwitchTile(
              icon: Icons.mark_email_read_outlined,
              label: 'CV-verloop herinnering',
              subtitle: '7 dagen voor automatische verwijdering',
              value: true,
              onChanged: (_) {},
            ),
          ]),

          // ── About ─────────────────────────────────────────────────────────
          _SectionHeader('Over Opstap'),
          _SettingsCard(children: [
            _InfoTile(
              icon: Icons.info_outline_rounded,
              label: 'Versie',
              subtitle: '1.0.0 (MVP)',
            ),
            const _Divider(),
            _ActionTile(
              icon: Icons.privacy_tip_outlined,
              label: 'Privacybeleid',
              onTap: () {},   // TODO: open in-app WebView
            ),
            const _Divider(),
            _ActionTile(
              icon: Icons.gavel_rounded,
              label: 'Algemene voorwaarden',
              onTap: () {},
            ),
          ]),

          const SizedBox(height: 32),
          Center(
            child: Text(
              'Jouw data wordt niet gedeeld met derden.\nOpgeslagen op EU-servers.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                  fontSize: 11,
                  color: OpstapColors.onSurfaceVariant,
                  height: 1.6),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  Future<void> _confirmLogout(
      BuildContext context, WidgetRef ref) async {
    final ok = await _confirm(
      context,
      title: 'Uitloggen',
      body: 'Weet je zeker dat je wilt uitloggen?',
      confirmLabel: 'Uitloggen',
    );
    if (!ok || !context.mounted) return;
    await Supabase.instance.client.auth.signOut();
    if (context.mounted) context.go('/');
  }

  Future<void> _confirmDeleteCv(
      BuildContext context, WidgetRef ref) async {
    final ok = await _confirm(
      context,
      title: 'CV verwijderen',
      body: 'Je CV wordt direct en permanent verwijderd van onze servers.',
      confirmLabel: 'Verwijderen',
      destructive: true,
    );
    if (!ok || !context.mounted) return;
    try {
      await ApiClient.instance.deleteCv();
      ref.invalidate(profileNotifierProvider);
      if (context.mounted) {
        _snack(context, 'CV verwijderd', success: true);
      }
    } on ApiException catch (_) {
      if (context.mounted) {
        _snack(context, 'Verwijderen mislukt. Probeer het opnieuw');
      }
    }
  }

  Future<void> _exportData(
      BuildContext context, WidgetRef ref) async {
    // For MVP: show a dialog explaining what data we hold
    // Full export (downloadable JSON) is a v2 feature
    if (!context.mounted) return;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: OpstapColors.surfaceContainerLowest,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20)),
        title: Text('Jouw gegevens',
            style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600, fontSize: 16)),
        content: Text(
          'Opstap slaat op:\n'
          '• Je profiel (naam, woonplaats, functievoorkeur)\n'
          '• Je CV-bestand (versleuteld, EU-servers)\n'
          '• Verzonden sollicitaties\n\n'
          'Snel beschikbaar: je kunt je gegevens straks downloaden als JSON',
          style: GoogleFonts.inter(fontSize: 13, height: 1.6),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Sluiten',
                style: GoogleFonts.inter(color: OpstapColors.primary)),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDeleteAccount(
      BuildContext context, WidgetRef ref) async {
    final ok = await _confirm(
      context,
      title: 'Account verwijderen',
      body: 'Dit verwijdert je profiel, CV, en alle sollicitaties permanent. '
          'Deze actie kan niet ongedaan worden gemaakt.',
      confirmLabel: 'Permanent verwijderen',
      destructive: true,
    );
    if (!ok || !context.mounted) return;

    try {
      final res = await Supabase.instance.client.functions
          .invoke('delete-account', method: HttpMethod.post);
      if (res.status != 200) throw Exception('status ${res.status}');
      if (context.mounted) context.go('/');
    } catch (e) {
      if (context.mounted) {
        _snack(context,
            'Verwijderen mislukt. Neem contact op via privacy@opstap.nl');
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  Future<bool> _confirm(
    BuildContext context, {
    required String title,
    required String body,
    required String confirmLabel,
    bool destructive = false,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: OpstapColors.surfaceContainerLowest,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20)),
        title: Text(title,
            style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600, fontSize: 16)),
        content: Text(body,
            style: GoogleFonts.inter(fontSize: 13, height: 1.6)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Annuleren',
                style: GoogleFonts.inter(
                    color: OpstapColors.onSurfaceVariant)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              confirmLabel,
              style: GoogleFonts.inter(
                color: destructive
                    ? OpstapColors.error
                    : OpstapColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  void _snack(BuildContext context, String msg, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: success ? const Color(0xFF16A34A) : OpstapColors.error,
    ));
  }
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 20, 0, 8),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: OpstapColors.onSurfaceVariant,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  const _SettingsCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: OpstapColors.onSurface.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) => Divider(
        height: 1,
        indent: 54,
        color: OpstapColors.outlineVariant.withValues(alpha: 0.4),
      );
}

class _AccountTile extends StatelessWidget {
  final String email;
  final String name;
  const _AccountTile({required this.email, required this.name});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: OpstapColors.heroGradient,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                name.isNotEmpty
                    ? name[0].toUpperCase()
                    : email.isNotEmpty
                        ? email[0].toUpperCase()
                        : '?',
                style: GoogleFonts.poppins(
                    fontSize: 18,
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
                if (name.isNotEmpty)
                  Text(name,
                      style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: OpstapColors.onSurface)),
                Text(email,
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        color: OpstapColors.onSurfaceVariant)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  const _InfoTile(
      {required this.icon, required this.label, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      child: Row(
        children: [
          Icon(icon, size: 20, color: OpstapColors.onSurfaceVariant),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.inter(
                        fontSize: 14, color: OpstapColors.onSurface)),
                Text(subtitle,
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        color: OpstapColors.onSurfaceVariant,
                        height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final bool destructive;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.subtitle,
    this.destructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = destructive ? OpstapColors.error : OpstapColors.onSurface;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Icon(icon,
                size: 20,
                color: destructive
                    ? OpstapColors.error
                    : OpstapColors.onSurfaceVariant),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: GoogleFonts.inter(
                          fontSize: 14,
                          color: color,
                          fontWeight: destructive
                              ? FontWeight.w500
                              : FontWeight.w400)),
                  if (subtitle != null)
                    Text(subtitle!,
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            color: OpstapColors.onSurfaceVariant,
                            height: 1.4)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded,
                size: 13,
                color: destructive
                    ? OpstapColors.error.withValues(alpha: 0.5)
                    : OpstapColors.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: OpstapColors.onSurfaceVariant),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.inter(
                        fontSize: 14, color: OpstapColors.onSurface)),
                Text(subtitle,
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        color: OpstapColors.onSurfaceVariant,
                        height: 1.4)),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: OpstapColors.primary,
          ),
        ],
      ),
    );
  }
}
