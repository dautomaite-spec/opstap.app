import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class ExtractedProfileScreen extends StatefulWidget {
  final VoidCallback onConfirmed;

  const ExtractedProfileScreen({super.key, required this.onConfirmed});

  @override
  State<ExtractedProfileScreen> createState() =>
      _ExtractedProfileScreenState();
}

class _ExtractedProfileScreenState extends State<ExtractedProfileScreen> {
  final _naamController = TextEditingController(text: 'Jan de Vries');
  final _locatieController = TextEditingController(text: 'Amsterdam');
  final _telefoonController = TextEditingController(text: '+31 6 12345678');

  final _jobs = [
    _JobEntry(
        title: 'Senior Developer',
        company: 'TechCo',
        period: '2021 – heden'),
    _JobEntry(
        title: 'Junior Developer',
        company: 'StartupNL',
        period: '2019 – 2021'),
  ];

  final _education = [
    _EducationEntry(
        degree: 'Bachelor Informatica',
        institution: 'Hogeschool van Amsterdam',
        year: '2017 – 2021'),
  ];

  final _skills = ['Python', 'Excel', 'Project Management', 'Communicatie'];

  @override
  void dispose() {
    _naamController.dispose();
    _locatieController.dispose();
    _telefoonController.dispose();
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
          'Jouw profiel',
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
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _SuccessBanner(),
                    const SizedBox(height: 24),
                    _ProfileSection(
                      title: 'Persoonlijk',
                      child: Column(
                        children: [
                          _EditableField(
                              label: 'Naam',
                              controller: _naamController),
                          const SizedBox(height: 10),
                          _EditableField(
                              label: 'Locatie',
                              controller: _locatieController),
                          const SizedBox(height: 10),
                          _EditableField(
                            label: 'Telefoonnummer',
                            controller: _telefoonController,
                            keyboardType: TextInputType.phone,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _ProfileSection(
                      title: 'Werkervaring',
                      child: Column(
                        children: [
                          ..._jobs.map((job) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: _EntryTile(
                                  title: job.title,
                                  subtitle: job.company,
                                  trailing: job.period,
                                  onEdit: () {},
                                ),
                              )),
                          _AddButton(label: 'Toevoegen', onTap: () {}),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _ProfileSection(
                      title: 'Opleiding',
                      child: Column(
                        children: [
                          ..._education.map((edu) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: _EntryTile(
                                  title: edu.degree,
                                  subtitle: edu.institution,
                                  trailing: edu.year,
                                  onEdit: () {},
                                ),
                              )),
                          _AddButton(label: 'Toevoegen', onTap: () {}),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _ProfileSection(
                      title: 'Vaardigheden',
                      child: _SkillsWrap(
                        skills: _skills,
                        onAdd: () {},
                        onRemove: (skill) =>
                            setState(() => _skills.remove(skill)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Alle gegevens zijn aanpasbaar voordat ze worden gebruikt.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: OpstapColors.onSurfaceVariant,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            _BottomBar(onConfirmed: widget.onConfirmed),
          ],
        ),
      ),
    );
  }
}

// ─── Data models ──────────────────────────────────────────────────────────────

class _JobEntry {
  final String title, company, period;
  _JobEntry({required this.title, required this.company, required this.period});
}

class _EducationEntry {
  final String degree, institution, year;
  _EducationEntry(
      {required this.degree, required this.institution, required this.year});
}

// ─── Success banner ───────────────────────────────────────────────────────────

class _SuccessBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      decoration: BoxDecoration(
        color: const Color(0xFF1B5E20).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF2E7D32).withValues(alpha: 0.25),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded,
              color: Color(0xFF2E7D32), size: 22),
          const SizedBox(width: 10),
          Text(
            'CV succesvol verwerkt',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2E7D32),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

class _ProfileSection extends StatelessWidget {
  final String title;
  final Widget child;

  const _ProfileSection({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: OpstapColors.onSurface,
            letterSpacing: -0.2,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: OpstapColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1C1A2E).withValues(alpha: 0.05),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: child,
        ),
      ],
    );
  }
}

// ─── Editable field ───────────────────────────────────────────────────────────

class _EditableField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final TextInputType keyboardType;

  const _EditableField({
    required this.label,
    required this.controller,
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
        labelStyle: GoogleFonts.inter(
          fontSize: 12,
          color: OpstapColors.onSurfaceVariant,
        ),
        filled: true,
        fillColor: OpstapColors.surfaceContainerLow,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: OpstapColors.primary, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }
}

// ─── Entry tile ───────────────────────────────────────────────────────────────

class _EntryTile extends StatelessWidget {
  final String title, subtitle, trailing;
  final VoidCallback onEdit;

  const _EntryTile({
    required this.title,
    required this.subtitle,
    required this.trailing,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
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
                const SizedBox(height: 2),
                Text(
                  '$subtitle · $trailing',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: OpstapColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onEdit,
            icon: const Icon(Icons.edit_rounded,
                size: 18, color: OpstapColors.primary),
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }
}

// ─── Add button ───────────────────────────────────────────────────────────────

class _AddButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _AddButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onTap,
      icon: const Icon(Icons.add_rounded, size: 16, color: OpstapColors.primary),
      label: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: OpstapColors.primary,
        ),
      ),
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        visualDensity: VisualDensity.compact,
      ),
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
                  OpstapColors.secondaryContainer.withValues(alpha: 0.6),
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
          backgroundColor: OpstapColors.surfaceContainerLow,
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
  final VoidCallback onConfirmed;

  const _BottomBar({required this.onConfirmed});

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
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [OpstapColors.primary, OpstapColors.primaryContainer],
          ),
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: OpstapColors.primary.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(30),
          child: InkWell(
            onTap: onConfirmed,
            borderRadius: BorderRadius.circular(30),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_rounded,
                      size: 18, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    'Profiel bevestigen',
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
      ),
    );
  }
}
