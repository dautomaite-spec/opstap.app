import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../jobs/job_search_screen.dart';

class MotivationLetterScreen extends StatefulWidget {
  final List<JobListing> jobs;
  final VoidCallback? onSent;

  const MotivationLetterScreen({
    super.key,
    this.jobs = const [],
    this.onSent,
  });

  @override
  State<MotivationLetterScreen> createState() =>
      _MotivationLetterScreenState();
}

class _MotivationLetterScreenState extends State<MotivationLetterScreen> {
  late int _activeIndex;
  late Map<String, TextEditingController> _controllers;

  @override
  void initState() {
    super.initState();
    _activeIndex = 0;
    _controllers = {
      for (final job in widget.jobs)
        job.id: TextEditingController(text: _generateLetter(job))
    };
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  String _generateLetter(JobListing job) =>
      'Geachte heer/mevrouw,\n\nMet veel enthousiasme reageer ik op de vacature voor ${job.title} bij ${job.company}. Als ervaren professional met een passie voor mijn vakgebied ben ik ervan overtuigd dat ik een waardevolle bijdrage kan leveren aan uw team.\n\nIn mijn vorige functies heb ik ruime ervaring opgedaan die naadloos aansluit bij de vereisten van deze rol. Ik ben gedreven, resultaatgericht en werk graag samen met collega\'s om gezamenlijke doelen te bereiken.\n\nIk kijk ernaar uit om mijn motivatie in een persoonlijk gesprek nader toe te lichten.\n\nMet vriendelijke groet,\n[Jouw naam]';

  void _regenerate() {
    final job = widget.jobs[_activeIndex];
    setState(() {
      _controllers[job.id]?.text = _generateLetter(job);
    });
  }

  @override
  Widget build(BuildContext context) {
    final job = widget.jobs[_activeIndex];

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
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: OpstapColors.onSurface,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Job selector chips
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: widget.jobs.length,
                separatorBuilder: (context, _) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final isActive = i == _activeIndex;
                  final j = widget.jobs[i];
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
                      child: Text(
                        j.company,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: isActive
                              ? Colors.white
                              : OpstapColors.onSurfaceVariant,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            // Job header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                '${job.company} — ${job.title}',
                style: GoogleFonts.manrope(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: OpstapColors.onSurface,
                  letterSpacing: -0.01 * 15,
                ),
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
                        color:
                            const Color(0xFF1A1C1C).withValues(alpha: 0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controllers[job.id],
                          maxLines: null,
                          expands: true,
                          textAlignVertical: TextAlignVertical.top,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: OpstapColors.onSurface,
                            height: 1.65,
                          ),
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.all(16),
                            border: InputBorder.none,
                            hintText: 'Motivatiebrief...',
                            hintStyle: GoogleFonts.inter(
                                color: OpstapColors.onSurfaceVariant),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                        child: Row(
                          children: [
                            const Icon(Icons.auto_awesome_rounded,
                                size: 12,
                                color: OpstapColors.onSurfaceVariant),
                            const SizedBox(width: 4),
                            Text(
                              'Gegenereerd door AI · aanpasbaar',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: OpstapColors.onSurfaceVariant,
                              ),
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
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Material(
                color: OpstapColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  onTap: _regenerate,
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.refresh_rounded,
                            size: 16, color: OpstapColors.primary),
                        const SizedBox(width: 8),
                        Text(
                          'Regenereer brief',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: OpstapColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            // Send button
            _BottomBar(
              jobCount: widget.jobs.length,
              onSend: widget.onSent ?? () => context.go('/confirm'),
            ),
          ],
        ),
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final int jobCount;
  final VoidCallback onSend;

  const _BottomBar({required this.jobCount, required this.onSend});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      decoration: BoxDecoration(
        color: OpstapColors.surface,
        border: Border(
          top: BorderSide(
              color: OpstapColors.outlineVariant.withValues(alpha: 0.5)),
        ),
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [OpstapColors.primary, OpstapColors.primaryContainer],
          ),
          borderRadius: BorderRadius.circular(12),
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
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            onTap: onSend,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.send_rounded,
                      size: 18, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    'Verstuur $jobCount ${jobCount == 1 ? 'sollicitatie' : 'sollicitaties'}',
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
