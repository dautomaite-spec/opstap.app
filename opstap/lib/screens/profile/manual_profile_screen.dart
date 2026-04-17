import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../services/providers.dart';

class ManualProfileScreen extends ConsumerStatefulWidget {
  final VoidCallback? onSaved;

  const ManualProfileScreen({super.key, this.onSaved});

  @override
  ConsumerState<ManualProfileScreen> createState() =>
      _ManualProfileScreenState();
}

class _ManualProfileScreenState extends ConsumerState<ManualProfileScreen> {
  // Personal
  final _naamController = TextEditingController();
  final _locatieController = TextEditingController();
  final _telefoonController = TextEditingController();

  // Job preferences
  final _functieController = TextEditingController();
  bool _openVoorAlles = false;
  String _dienstverband = 'Beide';
  String _beschikbaarheid = 'Direct';
  RangeValues _salaris = const RangeValues(2500, 4000);
  String _werklocatie = 'Beide';

  // Extra
  final _extraController = TextEditingController();
  final _skills = <String>['Communicatie'];

  bool _saving = false;
  String? _errorMessage;

  bool get _canSave =>
      _naamController.text.trim().isNotEmpty &&
      (_openVoorAlles || _functieController.text.trim().isNotEmpty);

  @override
  void initState() {
    super.initState();
    _naamController.addListener(() => setState(() {}));
    _functieController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _naamController.dispose();
    _locatieController.dispose();
    _telefoonController.dispose();
    _functieController.dispose();
    _extraController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_canSave) return;
    setState(() {
      _saving = true;
      _errorMessage = null;
    });

    try {
      await ref.read(profileNotifierProvider.notifier).save({
        'naam': _naamController.text.trim(),
        'woonplaats': _locatieController.text.trim(),
        'functietitel': _openVoorAlles ? null : _functieController.text.trim(),
        'open_voor_alles': _openVoorAlles,
        'beschikbaarheid': _dienstverband.toLowerCase(),
        'werklocatie': _werklocatie.toLowerCase(),
        'salaris_min': _salaris.start.toInt(),
        'salaris_max': _salaris.end.toInt(),
        'extra_info': [
          if (_skills.isNotEmpty) 'Vaardigheden: ${_skills.join(', ')}',
          if (_telefoonController.text.trim().isNotEmpty)
            'Telefoon: ${_telefoonController.text.trim()}',
          if (_extraController.text.trim().isNotEmpty)
            _extraController.text.trim(),
        ].join('\n'),
      });

      if (mounted) {
        (widget.onSaved ?? () => context.go('/jobs'))();
      }
    } catch (e) {
      setState(() => _errorMessage = 'Opslaan mislukt. Controleer je verbinding.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

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
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Profiel invullen',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: OpstapColors.onSurface,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 4, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Vul je gegevens in. Je kunt alles later aanpassen.',
                      style: GoogleFonts.inter(
                          fontSize: 13,
                          color: OpstapColors.onSurfaceVariant,
                          height: 1.5),
                    ),
                    const SizedBox(height: 24),

                    // ── Personal ──
                    _FormSection(
                      title: 'Persoonlijk',
                      child: Column(
                        children: [
                          _Field(
                              label: 'Naam *',
                              controller: _naamController),
                          const SizedBox(height: 10),
                          _Field(
                              label: 'Woonplaats',
                              controller: _locatieController),
                          const SizedBox(height: 10),
                          _Field(
                            label: 'Telefoonnummer',
                            controller: _telefoonController,
                            keyboardType: TextInputType.phone,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Job preferences ──
                    _FormSection(
                      title: 'Wat zoek je?',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Functietitel + open voor alles toggle
                          AnimatedOpacity(
                            duration: const Duration(milliseconds: 200),
                            opacity: _openVoorAlles ? 0.4 : 1.0,
                            child: IgnorePointer(
                              ignoring: _openVoorAlles,
                              child: _Field(
                                label: 'Functietitel',
                                controller: _functieController,
                                hint: 'bijv. Software Developer',
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          GestureDetector(
                            onTap: () => setState(() {
                              _openVoorAlles = !_openVoorAlles;
                              if (_openVoorAlles) _functieController.clear();
                            }),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: _openVoorAlles
                                    ? OpstapColors.secondaryContainer
                                    : OpstapColors.surfaceContainerHigh,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    _openVoorAlles
                                        ? Icons.check_circle_rounded
                                        : Icons.radio_button_unchecked_rounded,
                                    size: 18,
                                    color: _openVoorAlles
                                        ? OpstapColors.primary
                                        : OpstapColors.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Open voor alles',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                      color: _openVoorAlles
                                          ? OpstapColors.primary
                                          : OpstapColors.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                          _FieldLabel('Dienstverband'),
                          const SizedBox(height: 8),
                          _ChipSelector(
                            options: const ['Fulltime', 'Parttime', 'Beide'],
                            selected: _dienstverband,
                            onChanged: (v) =>
                                setState(() => _dienstverband = v),
                          ),
                          const SizedBox(height: 18),
                          _FieldLabel('Werklocatie'),
                          const SizedBox(height: 8),
                          _ChipSelector(
                            options: const ['Op locatie', 'Hybrid', 'Beide'],
                            selected: _werklocatie,
                            onChanged: (v) =>
                                setState(() => _werklocatie = v),
                          ),
                          const SizedBox(height: 18),
                          _FieldLabel('Beschikbaarheid'),
                          const SizedBox(height: 8),
                          _ChipSelector(
                            options: const ['Direct', '1 maand', '3 maanden'],
                            selected: _beschikbaarheid,
                            onChanged: (v) =>
                                setState(() => _beschikbaarheid = v),
                          ),
                          const SizedBox(height: 18),
                          _FieldLabel('Salarisindicatie'),
                          const SizedBox(height: 4),
                          Text(
                            '€${_fmt(_salaris.start.toInt())} – €${_fmt(_salaris.end.toInt())} per maand',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: OpstapColors.primary,
                            ),
                          ),
                          RangeSlider(
                            values: _salaris,
                            min: 1500,
                            max: 8000,
                            divisions: 130,
                            activeColor: OpstapColors.primary,
                            inactiveColor: OpstapColors.outlineVariant,
                            onChanged: (v) => setState(() => _salaris = v),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Skills ──
                    _FormSection(
                      title: 'Vaardigheden',
                      child: _SkillsWrap(
                        skills: _skills,
                        onAdd: _showAddSkillDialog,
                        onRemove: (s) => setState(() => _skills.remove(s)),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Extra info ──
                    _FormSection(
                      title: 'Extra informatie',
                      child: _Field(
                        label: 'Achtergrond, werkervaring, opmerkingen',
                        controller: _extraController,
                        maxLines: 4,
                        hint:
                            'bijv. 3 jaar ervaring als magazijnmedewerker, rijbewijs B, heftruck certificaat',
                      ),
                    ),

                    if (_errorMessage != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFDAD6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline,
                                color: OpstapColors.error, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(_errorMessage!,
                                  style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: OpstapColors.error)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            _BottomBar(
              canSave: _canSave,
              saving: _saving,
              onSaved: _save,
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(int n) =>
      n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.');

  void _showAddSkillDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: OpstapColors.surfaceContainerLowest,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20)),
        title: Text('Vaardigheid toevoegen',
            style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600, fontSize: 16)),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'bijv. Excel',
            hintStyle: GoogleFonts.inter(
                color: OpstapColors.onSurfaceVariant),
            filled: true,
            fillColor: OpstapColors.surfaceContainerLowest,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Annuleren',
                style: GoogleFonts.inter(
                    color: OpstapColors.onSurfaceVariant)),
          ),
          TextButton(
            onPressed: () {
              final skill = controller.text.trim();
              if (skill.isNotEmpty) setState(() => _skills.add(skill));
              Navigator.pop(ctx);
            },
            child: Text('Toevoegen',
                style: GoogleFonts.inter(
                    color: OpstapColors.primary,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

// ─── Widgets ──────────────────────────────────────────────────────────────────

class _FormSection extends StatelessWidget {
  final String title;
  final Widget child;
  const _FormSection({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: OpstapColors.onSurface)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: OpstapColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: OpstapColors.onSurface.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: child,
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: OpstapColors.onSurfaceVariant));
}

class _Field extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final int maxLines;

  const _Field({
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType = TextInputType.text,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: GoogleFonts.inter(fontSize: 14, color: OpstapColors.onSurface),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        alignLabelWithHint: maxLines > 1,
        labelStyle: GoogleFonts.inter(
            fontSize: 12, color: OpstapColors.onSurfaceVariant),
        hintStyle: GoogleFonts.inter(
            fontSize: 13, color: OpstapColors.onSurfaceVariant),
        filled: true,
        fillColor: OpstapColors.surfaceContainerLowest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide:
              const BorderSide(color: OpstapColors.primary, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }
}

class _ChipSelector extends StatelessWidget {
  final List<String> options;
  final String selected;
  final ValueChanged<String> onChanged;

  const _ChipSelector(
      {required this.options,
      required this.selected,
      required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((option) {
        final isSelected = option == selected;
        return GestureDetector(
          onTap: () => onChanged(option),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected
                  ? OpstapColors.primary
                  : OpstapColors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              option,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isSelected
                    ? Colors.white
                    : OpstapColors.onSurfaceVariant,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _SkillsWrap extends StatelessWidget {
  final List<String> skills;
  final VoidCallback onAdd;
  final ValueChanged<String> onRemove;

  const _SkillsWrap(
      {required this.skills,
      required this.onAdd,
      required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        ...skills.map((skill) => InputChip(
              label: Text(skill,
                  style: GoogleFonts.inter(
                      fontSize: 12, color: OpstapColors.primary)),
              backgroundColor:
                  OpstapColors.secondaryContainer.withValues(alpha: 0.5),
              deleteIconColor: OpstapColors.primary,
              onDeleted: () => onRemove(skill),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
              side: BorderSide.none,
            )),
        ActionChip(
          label: Text('+ Toevoegen',
              style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: OpstapColors.primary)),
          backgroundColor: OpstapColors.surfaceContainerLowest,
          onPressed: onAdd,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          visualDensity: VisualDensity.compact,
          side: const BorderSide(
              color: OpstapColors.outlineVariant, width: 1),
        ),
      ],
    );
  }
}

class _BottomBar extends StatelessWidget {
  final bool canSave;
  final bool saving;
  final VoidCallback onSaved;

  const _BottomBar(
      {required this.canSave,
      required this.saving,
      required this.onSaved});

  @override
  Widget build(BuildContext context) {
    final active = canSave && !saving;
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
      decoration: BoxDecoration(
        color: OpstapColors.surface,
        border: Border(
            top: BorderSide(
                color: OpstapColors.outlineVariant.withValues(alpha: 0.5))),
      ),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: active ? 1.0 : 0.45,
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: active
                  ? OpstapColors.heroGradient
                  : const LinearGradient(colors: [
                      OpstapColors.surfaceContainerHigh,
                      OpstapColors.surfaceContainerHigh
                    ]),
              borderRadius: BorderRadius.circular(30),
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: OpstapColors.primary.withValues(alpha: 0.25),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      )
                    ]
                  : [],
            ),
            child: ElevatedButton(
              onPressed: active ? onSaved : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30)),
              ),
              child: saving
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5),
                    )
                  : Text(
                      'Profiel opslaan',
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: active ? Colors.white : OpstapColors.outline,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
