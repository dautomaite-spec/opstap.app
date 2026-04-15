import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class CvUploadScreen extends StatefulWidget {
  final VoidCallback? onUploaded;

  const CvUploadScreen({super.key, this.onUploaded});

  @override
  State<CvUploadScreen> createState() => _CvUploadScreenState();
}

class _CvUploadScreenState extends State<CvUploadScreen> {
  String? _selectedFileName;
  int _retentionDays = 30; // default

  bool get _fileSelected => _selectedFileName != null;

  void _pickFile() {
    // TODO: integrate file_picker package
    setState(() => _selectedFileName = 'mijn_cv.pdf');
  }

  void _clearFile() {
    setState(() => _selectedFileName = null);
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
          'CV uploaden',
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
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _UploadZone(
                      selectedFileName: _selectedFileName,
                      onTap: _pickFile,
                      onClear: _clearFile,
                    ),
                    const SizedBox(height: 32),
                    _RetentionSelector(
                      selected: _retentionDays,
                      onChanged: (days) =>
                          setState(() => _retentionDays = days),
                    ),
                  ],
                ),
              ),
            ),
            _BottomBar(
              fileSelected: _fileSelected,
              onUpload: widget.onUploaded ?? () => context.go('/profile/extracted'),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

class _UploadZone extends StatelessWidget {
  final String? selectedFileName;
  final VoidCallback onTap;
  final VoidCallback onClear;

  const _UploadZone({
    required this.selectedFileName,
    required this.onTap,
    required this.onClear,
  });

  bool get _hasFile => selectedFileName != null;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _hasFile ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        decoration: BoxDecoration(
          color: _hasFile
              ? OpstapColors.secondaryContainer.withValues(alpha: 0.3)
              : OpstapColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _hasFile
                ? OpstapColors.primary
                : OpstapColors.outlineVariant,
            width: 1.5,
            // Dashed border via custom painter below
          ),
        ),
        child: _hasFile ? _FileSelected(fileName: selectedFileName!, onClear: onClear) : _EmptyState(),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: OpstapColors.secondaryContainer,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(
            Icons.upload_file_rounded,
            size: 32,
            color: OpstapColors.primary,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Tik om je CV te uploaden',
          style: GoogleFonts.manrope(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: OpstapColors.onSurface,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        Text(
          'PDF of Word-bestand, max. 10 MB',
          style: GoogleFonts.inter(
            fontSize: 13,
            color: OpstapColors.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _FileSelected extends StatelessWidget {
  final String fileName;
  final VoidCallback onClear;

  const _FileSelected({required this.fileName, required this.onClear});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: OpstapColors.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.description_rounded,
              size: 26, color: OpstapColors.primary),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                fileName,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: OpstapColors.onSurface,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                'Klaar om te uploaden',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: OpstapColors.primary,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: onClear,
          icon: const Icon(Icons.close_rounded,
              size: 20, color: OpstapColors.onSurfaceVariant),
          visualDensity: VisualDensity.compact,
        ),
      ],
    );
  }
}

// ─── Retention selector ───────────────────────────────────────────────────────

class _RetentionSelector extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onChanged;

  const _RetentionSelector({
    required this.selected,
    required this.onChanged,
  });

  static const _options = [7, 30, 90];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Bewaartermijn',
          style: GoogleFonts.manrope(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: OpstapColors.onSurface,
            letterSpacing: -0.01 * 16,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: _options.map((days) {
            final isSelected = days == selected;
            return Expanded(
              child: GestureDetector(
                onTap: () => onChanged(days),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: EdgeInsets.only(
                    right: days == _options.last ? 0 : 8,
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? OpstapColors.primary
                        : OpstapColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$days dagen',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? Colors.white
                          : OpstapColors.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 10),
        Text(
          'Je CV wordt automatisch verwijderd na deze periode.',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: OpstapColors.onSurfaceVariant,
            height: 1.5,
          ),
        ),
      ],
    );
  }
}

// ─── Bottom bar ───────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final bool fileSelected;
  final VoidCallback onUpload;

  const _BottomBar({required this.fileSelected, required this.onUpload});

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
          AnimatedOpacity(
            duration: const Duration(milliseconds: 200),
            opacity: fileSelected ? 1.0 : 0.45,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: fileSelected
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
                boxShadow: fileSelected
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
                  onTap: fileSelected ? onUpload : null,
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.upload_rounded,
                          size: 18,
                          color: fileSelected
                              ? Colors.white
                              : OpstapColors.outline,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'CV uploaden',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: fileSelected
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
          const SizedBox(height: 12),
          Text(
            'Je kunt je CV op elk moment verwijderen via Instellingen.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: OpstapColors.onSurfaceVariant,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
