import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../services/api_client.dart';
import '../../services/providers.dart';
import '../jobs/job_search_screen.dart';

class MotivationLetterScreen extends ConsumerStatefulWidget {
  final List<JobListing> jobs;
  final VoidCallback? onSent;

  const MotivationLetterScreen({
    super.key,
    this.jobs = const [],
    this.onSent,
  });

  @override
  ConsumerState<MotivationLetterScreen> createState() =>
      _MotivationLetterScreenState();
}

class _MotivationLetterScreenState
    extends ConsumerState<MotivationLetterScreen> {
  int _activeIndex = 0;

  // letter text per job id
  final Map<String, TextEditingController> _controllers = {};
  // loading state per job id
  final Map<String, bool> _generating = {};
  // error per job id
  final Map<String, String?> _errors = {};

  bool _sending = false;

  @override
  void initState() {
    super.initState();
    for (final job in widget.jobs) {
      _controllers[job.id] = TextEditingController();
      _generating[job.id] = true;
      _errors[job.id] = null;
    }
    // Kick off generation for all jobs in parallel
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _generateAll());
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _generateAll() async {
    await Future.wait(widget.jobs.map(_generateForJob));
  }

  Future<void> _generateForJob(JobListing job) async {
    setState(() {
      _generating[job.id] = true;
      _errors[job.id] = null;
    });

    try {
      final profile =
          await ref.read(profileNotifierProvider.future);
      final profileId = (profile?['id'] as String?) ?? '';

      final result = await ApiClient.instance.generateLetter(
        jobId: job.id,
        profileId: profileId,
      );
      if (mounted) {
        _controllers[job.id]?.text =
            result['letter_nl'] as String? ?? '';
      }
    } on ApiException catch (e) {
      if (mounted) {
        _errors[job.id] =
            'Kon brief niet genereren (${e.statusCode}). Probeer opnieuw.';
      }
    } catch (_) {
      if (mounted) {
        _errors[job.id] = 'Kon brief niet genereren. Probeer opnieuw.';
      }
    } finally {
      if (mounted) setState(() => _generating[job.id] = false);
    }
  }

  Future<void> _sendAll() async {
    setState(() => _sending = true);
    try {
      final profile = await ref.read(profileNotifierProvider.future);
      final profileId = (profile?['id'] as String?) ?? '';

      for (final job in widget.jobs) {
        final letter = _controllers[job.id]?.text.trim() ?? '';
        if (letter.isEmpty) continue;
        await ApiClient.instance.sendApplication(
          jobId: job.id,
          profileId: profileId,
          letterNl: letter,
          sendMethod: 'email',
        );
      }
      // Invalidate history so it refreshes
      ref.invalidate(applicationHistoryProvider);

      if (mounted) {
        (widget.onSent ?? () => context.go('/confirm'))();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Versturen mislukt (${e.statusCode}): ${e.detail}'),
          backgroundColor: OpstapColors.error,
        ));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.jobs.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: const Center(child: Text('Geen vacatures geselecteerd.')),
      );
    }

    final job = widget.jobs[_activeIndex];
    final isGenerating = _generating[job.id] ?? false;
    final error = _errors[job.id];

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
          'Motivatiebrief',
          style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: OpstapColors.onSurface),
        ),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Job selector chips (only shown when multiple jobs)
            if (widget.jobs.length > 1) ...[
              SizedBox(
                height: 44,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: widget.jobs.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final isActive = i == _activeIndex;
                    final j = widget.jobs[i];
                    final done = !(_generating[j.id] ?? true) &&
                        (_controllers[j.id]?.text.isNotEmpty ?? false);
                    return GestureDetector(
                      onTap: () => setState(() => _activeIndex = i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isActive
                              ? OpstapColors.primary
                              : OpstapColors.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            if (done && !isActive)
                              const Padding(
                                padding: EdgeInsets.only(right: 4),
                                child: Icon(Icons.check_circle_rounded,
                                    size: 13, color: Color(0xFF16A34A)),
                              ),
                            Text(
                              j.company,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: isActive
                                    ? Colors.white
                                    : OpstapColors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Job header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                '${job.company} — ${job.title}',
                style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: OpstapColors.onSurface),
              ),
            ),
            const SizedBox(height: 12),

            // Letter card
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  decoration: BoxDecoration(
                    color: OpstapColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1A1C1C)
                            .withValues(alpha: 0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: isGenerating
                      ? _GeneratingPlaceholder()
                      : error != null
                          ? _ErrorCard(
                              message: error,
                              onRetry: () => _generateForJob(job),
                            )
                          : Column(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _controllers[job.id],
                                    maxLines: null,
                                    expands: true,
                                    textAlignVertical:
                                        TextAlignVertical.top,
                                    style: GoogleFonts.inter(
                                        fontSize: 13,
                                        color: OpstapColors.onSurface,
                                        height: 1.65),
                                    decoration: InputDecoration(
                                      contentPadding:
                                          const EdgeInsets.all(16),
                                      border: InputBorder.none,
                                      hintText: 'Motivatiebrief...',
                                      hintStyle: GoogleFonts.inter(
                                          color: OpstapColors
                                              .onSurfaceVariant),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(
                                      16, 0, 16, 12),
                                  child: Row(
                                    children: [
                                      const Icon(
                                          Icons.auto_awesome_rounded,
                                          size: 12,
                                          color: OpstapColors
                                              .onSurfaceVariant),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Gegenereerd door Claude · aanpasbaar',
                                        style: GoogleFonts.inter(
                                            fontSize: 11,
                                            color: OpstapColors
                                                .onSurfaceVariant),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Regenerate button
            if (!isGenerating)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: OutlinedButton.icon(
                  onPressed: () => _generateForJob(job),
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: const Text('Regenereer brief'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: OpstapColors.primary,
                    side: const BorderSide(color: OpstapColors.outlineVariant),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20)),
                    minimumSize: const Size(double.infinity, 44),
                  ),
                ),
              ),

            // Send button
            _BottomBar(
              jobCount: widget.jobs.length,
              sending: _sending,
              canSend: widget.jobs.every(
                  (j) => !(_generating[j.id] ?? true)),
              onSend: _sendAll,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Placeholders ─────────────────────────────────────────────────────────────

class _GeneratingPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: OpstapColors.primary),
            const SizedBox(height: 20),
            Text(
              'Brief wordt geschreven…',
              style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: OpstapColors.onSurface),
            ),
            const SizedBox(height: 8),
            Text(
              'Claude schrijft een brief op basis van jouw profiel en de vacature.',
              style: GoogleFonts.inter(
                  fontSize: 13,
                  color: OpstapColors.onSurfaceVariant,
                  height: 1.5),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorCard({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline,
                size: 40, color: OpstapColors.error),
            const SizedBox(height: 12),
            Text(message,
                style: GoogleFonts.inter(
                    fontSize: 13, color: OpstapColors.onSurfaceVariant),
                textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Opnieuw proberen'),
              style: OutlinedButton.styleFrom(
                foregroundColor: OpstapColors.primary,
                side: const BorderSide(color: OpstapColors.primary),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Bottom bar ───────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final int jobCount;
  final bool sending;
  final bool canSend;
  final VoidCallback onSend;

  const _BottomBar({
    required this.jobCount,
    required this.sending,
    required this.canSend,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    final active = canSend && !sending;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      decoration: BoxDecoration(
        color: OpstapColors.surface,
        border: Border(
            top: BorderSide(
                color: OpstapColors.outlineVariant.withValues(alpha: 0.5))),
      ),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: active ? 1.0 : 0.5,
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
              onPressed: active ? onSend : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30)),
              ),
              child: sending
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5),
                    )
                  : Text(
                      'Verstuur $jobCount ${jobCount == 1 ? 'sollicitatie' : 'sollicitaties'}',
                      style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: active ? Colors.white : OpstapColors.outline),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
