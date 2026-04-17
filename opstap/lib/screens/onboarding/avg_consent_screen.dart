import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class AvgConsentScreen extends StatefulWidget {
  final VoidCallback? onAccepted;
  final VoidCallback? onDeclined;

  const AvgConsentScreen({
    super.key,
    this.onAccepted,
    this.onDeclined,
  });

  @override
  State<AvgConsentScreen> createState() => _AvgConsentScreenState();
}

class _AvgConsentScreenState extends State<AvgConsentScreen> {
  bool _consentStorage = false;
  bool _consentAiProcessing = false;
  bool _consentAutoDelete = false;

  bool get _allAccepted =>
      _consentStorage && _consentAiProcessing && _consentAutoDelete;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: OpstapColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: OpstapColors.onSurface),
          onPressed: widget.onDeclined ?? () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Header(),
                    const SizedBox(height: 28),
                    _PrivacyPoints(),
                    const SizedBox(height: 32),
                    _SectionLabel('Geef toestemming'),
                    const SizedBox(height: 12),
                    _ConsentTile(
                      value: _consentStorage,
                      onChanged: (v) =>
                          setState(() => _consentStorage = v ?? false),
                      title: 'Gegevensopslag in de EU',
                      subtitle:
                          'Ik ga akkoord dat mijn gegevens worden opgeslagen op beveiligde EU-servers.',
                    ),
                    const SizedBox(height: 10),
                    _ConsentTile(
                      value: _consentAiProcessing,
                      onChanged: (v) =>
                          setState(() => _consentAiProcessing = v ?? false),
                      title: 'Verwerking door AI',
                      subtitle:
                          'Ik begrijp dat mijn CV verwerkt wordt door de Claude API (Anthropic) voor profielextractie. Mijn gegevens worden niet gebruikt voor AI-training.',
                    ),
                    const SizedBox(height: 10),
                    _ConsentTile(
                      value: _consentAutoDelete,
                      onChanged: (v) =>
                          setState(() => _consentAutoDelete = v ?? false),
                      title: 'Automatisch verwijderen',
                      subtitle:
                          'Ik ga akkoord dat mijn CV automatisch wordt verwijderd na mijn gekozen bewaartermijn (standaard 30 dagen). Ik kan mijn gegevens altijd eerder zelf verwijderen.',
                    ),
                    const SizedBox(height: 24),
                    _PrivacyNote(),
                  ],
                ),
              ),
            ),
            _BottomBar(
              allAccepted: _allAccepted,
              onAccepted: widget.onAccepted ?? () => context.go('/cv-upload'),
              onDeclined: widget.onDeclined ?? () => context.pop(),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Header ───────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: OpstapColors.secondaryContainer,
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Icon(
            Icons.shield_rounded,
            color: OpstapColors.primary,
            size: 26,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Jouw privacy,\nonze verantwoordelijkheid.',
          style: GoogleFonts.manrope(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            color: OpstapColors.onSurface,
            letterSpacing: -0.02 * 26,
            height: 1.15,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Voordat je verder gaat, leggen we uit hoe we met jouw gegevens omgaan.',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: OpstapColors.onSurfaceVariant,
            height: 1.55,
          ),
        ),
      ],
    );
  }
}

// ─── Privacy points ───────────────────────────────────────────────────────────

class _PrivacyPoints extends StatelessWidget {
  static const _points = [
    (
      Icons.location_on_rounded,
      'EU-servers',
      'Al jouw gegevens blijven op Europese servers. Niets verlaat de EU.'
    ),
    (
      Icons.lock_rounded,
      'Versleuteld opgeslagen',
      'Je CV wordt versleuteld opgeslagen en alleen voor sollicitaties gebruikt.'
    ),
    (
      Icons.delete_forever_rounded,
      'Zelf verwijderen',
      'Je kunt je gegevens op elk moment verwijderen via Instellingen → Privacy.'
    ),
    (
      Icons.visibility_rounded,
      'Altijd inzichtelijk',
      'Elke AI-beslissing is zichtbaar en aanpasbaar. Geen verborgen acties.'
    ),
    (
      Icons.timer_rounded,
      'Automatisch gewist',
      'Je CV wordt automatisch verwijderd na jouw gekozen termijn (7, 30 of 90 dagen).'
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: _points.map((p) {
          final isLast = p == _points.last;
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(p.$1, size: 20, color: OpstapColors.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p.$2,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: OpstapColors.onSurface,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            p.$3,
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
                  color: OpstapColors.outlineVariant.withValues(alpha: 0.5),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

// ─── Section label ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: OpstapColors.onSurface,
        letterSpacing: -0.01 * 16,
      ),
    );
  }
}

// ─── Consent tile ─────────────────────────────────────────────────────────────

class _ConsentTile extends StatelessWidget {
  final bool value;
  final ValueChanged<bool?> onChanged;
  final String title;
  final String subtitle;

  const _ConsentTile({
    required this.value,
    required this.onChanged,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: value
              ? OpstapColors.secondaryContainer.withValues(alpha: 0.45)
              : OpstapColors.surfaceContainer,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: value ? OpstapColors.primary : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: value,
              onChanged: onChanged,
              activeColor: OpstapColors.primary,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: OpstapColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
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
    );
  }
}

// ─── Privacy note ─────────────────────────────────────────────────────────────

class _PrivacyNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Text(
      'Lees ons volledige privacybeleid voor alle details. '
      'Je kunt je toestemming op elk moment intrekken via Instellingen.',
      style: GoogleFonts.inter(
        fontSize: 11,
        color: OpstapColors.onSurfaceVariant,
        height: 1.6,
      ),
      textAlign: TextAlign.center,
    );
  }
}

// ─── Bottom bar ───────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final bool allAccepted;
  final VoidCallback onAccepted;
  final VoidCallback onDeclined;

  const _BottomBar({
    required this.allAccepted,
    required this.onAccepted,
    required this.onDeclined,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
      decoration: BoxDecoration(
        color: OpstapColors.surface,
        border: Border(
          top: BorderSide(
            color: OpstapColors.outlineVariant.withValues(alpha: 0.5),
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Accept button
          AnimatedOpacity(
            duration: const Duration(milliseconds: 200),
            opacity: allAccepted ? 1.0 : 0.45,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: allAccepted
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          OpstapColors.primary,
                          OpstapColors.primaryContainer
                        ],
                      )
                    : const LinearGradient(
                        colors: [
                          OpstapColors.surfaceContainerHigh,
                          OpstapColors.surfaceContainerHigh,
                        ],
                      ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: allAccepted
                    ? [
                        BoxShadow(
                          color: OpstapColors.primary.withValues(alpha: 0.25),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        )
                      ]
                    : [],
              ),
              child: Material(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  onTap: allAccepted ? onAccepted : null,
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_rounded,
                          size: 18,
                          color:
                              allAccepted ? Colors.white : OpstapColors.outline,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Akkoord & doorgaan',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: allAccepted
                                ? Colors.white
                                : OpstapColors.outline,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Decline button
          TextButton(
            onPressed: onDeclined,
            child: Text(
              'Niet akkoord',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: OpstapColors.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
