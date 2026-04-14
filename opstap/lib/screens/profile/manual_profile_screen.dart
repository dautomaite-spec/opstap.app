import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class ManualProfileScreen extends StatefulWidget {
  final VoidCallback onSaved;

  const ManualProfileScreen({super.key, required this.onSaved});

  @override
  State<ManualProfileScreen> createState() => _ManualProfileScreenState();
}

class _ManualProfileScreenState extends State<ManualProfileScreen> {
  // Personal
  final _naamController = TextEditingController();
  final _locatieController = TextEditingController();
  final _telefoonController = TextEditingController();

  // Job preferences
  final _functieController = TextEditingController();
  String _dienstverband = 'Beide';
  String _beschikbaarheid = 'Direct';
  RangeValues _salaris = const RangeValues(2500, 4000);

  // Skills
  final _skills = <String>['Communicatie'];

  bool get _canSave =>
      _naamController.text.trim().isNotEmpty &&
      _functieController.text.trim().isNotEmpty;

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
    super.dispose();
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
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Profiel invullen',
          style: GoogleFonts.manrope(
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
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 24),
                    _FormSection(
                      title: 'Persoonlijk',
                      child: Column(
                        children: [
                          _Field(label: 'Naam', controller: _naamController),
                          const SizedBox(height: 10),
                          _Field(label: 'Locatie', controller: _locatieController),
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
                    _FormSection(
                      title: 'Wat zoek je?',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Field(
                            label: 'Functietitel',
                            controller: _functieController,
                            hint: 'bijv. Software Developer',
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
                            '€${_salaris.start.toInt().toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')} – €${_salaris.end.toInt().toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')} per maand',
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
                    _FormSection(
                      title: 'Vaardigheden',
                      child: _SkillsWrap(
                        skills: _skills,
                        onAdd: () => _showAddSkillDialog(),
                        onRemove: (s) => setState(() => _skills.remove(s)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            _BottomBar(canSave: _canSave, onSaved: widget.onSaved),
          ],
        ),
      ),
    );
  }

  void _showAddSkillDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: OpstapColors.surfaceContainerLowest,
        title: Text('Vaardigheid toevoegen',
            style: GoogleFonts.manrope(fontWeight: FontWeight.w600, fontSize: 16)),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'bijv. Excel',
            hintStyle: GoogleFonts.inter(color: OpstapColors.onSurfaceVariant),
            filled: true,
            fillColor: OpstapColors.surfaceContainerLow,
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
                style: GoogleFonts.inter(color: OpstapColors.onSurfaceVariant)),
          ),
          TextButton(
            onPressed: () {
              final skill = controller.text.trim();
              if (skill.isNotEmpty) {
                setState(() => _skills.add(skill));
              }
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

// ─── Section wrapper ──────────────────────────────────────────────────────────

class _FormSection extends StatelessWidget {
  final String title;
  final Widget child;

  const _FormSection({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.manrope(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: OpstapColors.onSurface,
            letterSpacing: -0.01 * 15,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: OpstapColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(14),
          ),
          child: child,
        ),
      ],
    );
  }
}

// ─── Field label ──────────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: OpstapColors.onSurfaceVariant,
      ),
    );
  }
}

// ─── Text field ───────────────────────────────────────────────────────────────

class _Field extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController controller;
  final TextInputType keyboardType;

  const _Field({
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType = TextInputType.text,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: GoogleFonts.inter(fontSize: 14, color: OpstapColors.onSurface),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
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

// ─── Chip selector ────────────────────────────────────────────────────────────

class _ChipSelector extends StatelessWidget {
  final List<String> options;
  final String selected;
  final ValueChanged<String> onChanged;

  const _ChipSelector({
    required this.options,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: options.map((option) {
        final isSelected = option == selected;
        return Padding(
          padding: EdgeInsets.only(
              right: option == options.last ? 0 : 8),
          child: GestureDetector(
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
          ),
        );
      }).toList(),
    );
  }
}

// ─── Skills wrap ──────────────────────────────────────────────────────────────

class _SkillsWrap extends StatelessWidget {
  final List<String> skills;
  final VoidCallback onAdd;
  final ValueChanged<String> onRemove;

  const _SkillsWrap({
    required this.skills,
    required this.onAdd,
    required this.onRemove,
  });

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
          side: const BorderSide(color: OpstapColors.outlineVariant, width: 1),
        ),
      ],
    );
  }
}

// ─── Bottom bar ───────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final bool canSave;
  final VoidCallback onSaved;

  const _BottomBar({required this.canSave, required this.onSaved});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
      decoration: BoxDecoration(
        color: OpstapColors.surface,
        border: Border(
          top: BorderSide(
              color: OpstapColors.outlineVariant.withValues(alpha: 0.5)),
        ),
      ),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: canSave ? 1.0 : 0.45,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: canSave
                ? const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [OpstapColors.primary, OpstapColors.primaryContainer],
                  )
                : const LinearGradient(colors: [
                    OpstapColors.surfaceContainerHigh,
                    OpstapColors.surfaceContainerHigh
                  ]),
            borderRadius: BorderRadius.circular(12),
            boxShadow: canSave
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
              onTap: canSave ? onSaved : null,
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.save_rounded,
                        size: 18,
                        color:
                            canSave ? Colors.white : OpstapColors.outline),
                    const SizedBox(width: 8),
                    Text(
                      'Profiel opslaan',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: canSave ? Colors.white : OpstapColors.outline,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
