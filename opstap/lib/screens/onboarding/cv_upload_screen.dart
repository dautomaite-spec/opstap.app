import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/theme.dart';
import '../../services/api_client.dart';

class CvUploadScreen extends StatefulWidget {
  final VoidCallback? onUploaded;

  const CvUploadScreen({super.key, this.onUploaded});

  @override
  State<CvUploadScreen> createState() => _CvUploadScreenState();
}

class _CvUploadScreenState extends State<CvUploadScreen> {
  PlatformFile? _pickedFile;
  int _retentionDays = 30;
  bool _uploading = false;
  String? _errorMessage;

  bool get _fileSelected => _pickedFile != null;

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'docx'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      final file = result.files.first;
      final maxBytes = 10 * 1024 * 1024;
      if ((file.size) > maxBytes) {
        setState(() => _errorMessage = 'Bestand is te groot. Maximaal 10 MB.');
        return;
      }
      setState(() {
        _pickedFile = file;
        _errorMessage = null;
      });
    }
  }

  void _clearFile() => setState(() {
        _pickedFile = null;
        _errorMessage = null;
      });

  Future<void> _upload() async {
    if (_pickedFile == null) return;
    setState(() {
      _uploading = true;
      _errorMessage = null;
    });

    try {
      await ApiClient.instance.uploadCv(
        fileBytes: _pickedFile!.bytes!,
        fileName: _pickedFile!.name,
        retentionDays: _retentionDays,
      );
      if (mounted) {
        (widget.onUploaded ?? () => context.go('/profile/extracted'))();
      }
    } catch (e) {
      setState(() => _errorMessage = 'Upload mislukt. Controleer je verbinding en probeer opnieuw.');
    } finally {
      if (mounted) setState(() => _uploading = false);
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
          icon: const Icon(Icons.arrow_back_rounded, color: OpstapColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'CV uploaden',
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
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _UploadZone(
                      pickedFile: _pickedFile,
                      onTap: _pickFile,
                      onClear: _clearFile,
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 12),
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
                              child: Text(
                                _errorMessage!,
                                style: GoogleFonts.inter(
                                    fontSize: 13, color: OpstapColors.error),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 32),
                    _RetentionSelector(
                      selected: _retentionDays,
                      onChanged: (days) => setState(() => _retentionDays = days),
                    ),
                  ],
                ),
              ),
            ),
            _BottomBar(
              fileSelected: _fileSelected,
              uploading: _uploading,
              onUpload: _upload,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

class _UploadZone extends StatelessWidget {
  final PlatformFile? pickedFile;
  final VoidCallback onTap;
  final VoidCallback onClear;

  const _UploadZone({
    required this.pickedFile,
    required this.onTap,
    required this.onClear,
  });

  bool get _hasFile => pickedFile != null;

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
            color: _hasFile ? OpstapColors.primary : OpstapColors.outlineVariant,
            width: 1.5,
          ),
        ),
        child: _hasFile
            ? _FileSelected(file: pickedFile!, onClear: onClear)
            : _EmptyState(),
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
          child: const Icon(Icons.upload_file_rounded,
              size: 32, color: OpstapColors.primary),
        ),
        const SizedBox(height: 16),
        Text(
          'Tik om je CV te uploaden',
          style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: OpstapColors.onSurface),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        Text(
          'PDF of Word-bestand, max. 10 MB',
          style: GoogleFonts.inter(
              fontSize: 13, color: OpstapColors.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _FileSelected extends StatelessWidget {
  final PlatformFile file;
  final VoidCallback onClear;

  const _FileSelected({required this.file, required this.onClear});

  String _formatSize(int bytes) {
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

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
                file.name,
                style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: OpstapColors.onSurface),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                _formatSize(file.size),
                style: GoogleFonts.inter(
                    fontSize: 12, color: OpstapColors.primary),
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

  const _RetentionSelector(
      {required this.selected, required this.onChanged});

  static const _options = [7, 30, 90];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Bewaartermijn',
          style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: OpstapColors.onSurface),
        ),
        const SizedBox(height: 4),
        Text(
          'Je CV wordt na deze periode automatisch verwijderd.',
          style: GoogleFonts.inter(
              fontSize: 13, color: OpstapColors.onSurfaceVariant),
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
                      right: days == _options.last ? 0 : 8),
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
      ],
    );
  }
}

// ─── Bottom bar ───────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final bool fileSelected;
  final bool uploading;
  final VoidCallback onUpload;

  const _BottomBar({
    required this.fileSelected,
    required this.uploading,
    required this.onUpload,
  });

  @override
  Widget build(BuildContext context) {
    final active = fileSelected && !uploading;
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
      decoration: BoxDecoration(
        color: OpstapColors.surface,
        border: Border(
          top: BorderSide(
              color: OpstapColors.outlineVariant.withValues(alpha: 0.5)),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedOpacity(
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
                          OpstapColors.surfaceContainerHigh,
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
                  onPressed: active ? onUpload : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30)),
                  ),
                  child: uploading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2.5),
                        )
                      : Text(
                          'CV uploaden',
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: active
                                ? Colors.white
                                : OpstapColors.outline,
                          ),
                        ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Je kunt je CV op elk moment verwijderen via Instellingen.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
                fontSize: 11,
                color: OpstapColors.onSurfaceVariant,
                height: 1.5),
          ),
        ],
      ),
    );
  }
}
