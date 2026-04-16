import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../services/providers.dart';
import '../apply/motivation_letter_screen.dart';
import '../apply/confirmation_screen.dart';

// ─── Model ────────────────────────────────────────────────────────────────────

class JobListing {
  final String id;
  final String title;
  final String company;
  final String location;
  final String contract;
  final String salaryRange;
  final String postedAgo;
  final int matchScore;
  final Color logoColor;
  bool saved;

  JobListing({
    required this.id,
    required this.title,
    required this.company,
    required this.location,
    required this.contract,
    required this.salaryRange,
    required this.postedAgo,
    required this.matchScore,
    required this.logoColor,
    this.saved = false,
  });

  factory JobListing.fromJson(Map<String, dynamic> j) {
    // Derive a consistent logo colour from the company name
    final colours = [
      const Color(0xFF0056B3), const Color(0xFFE65100),
      const Color(0xFF2E7D32), const Color(0xFF6A1B9A),
      const Color(0xFF00695C), const Color(0xFFB71C1C),
      const Color(0xFF1565C0), const Color(0xFF4A148C),
    ];
    final idx = (j['company'] as String).codeUnits.fold(0, (a, b) => a + b) %
        colours.length;

    return JobListing(
      id: j['id']?.toString() ?? '',
      title: j['title'] ?? '',
      company: j['company'] ?? '',
      location: j['location'] ?? '',
      contract: j['contract_type'] ?? 'Onbekend',
      salaryRange: j['salary_range'] ?? '',
      postedAgo: _relativeTime(j['scraped_at']),
      matchScore: (j['match_score'] as int?) ?? 0,
      logoColor: colours[idx],
    );
  }

  static String _relativeTime(dynamic iso) {
    if (iso == null) return '';
    try {
      final dt = DateTime.parse(iso as String);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 60) return 'Zojuist';
      if (diff.inHours < 24) return '${diff.inHours} uur geleden';
      if (diff.inDays == 1) return 'Gisteren';
      if (diff.inDays < 7) return '${diff.inDays} dagen geleden';
      return '${(diff.inDays / 7).floor()} week geleden';
    } catch (_) {
      return '';
    }
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

class JobSearchScreen extends ConsumerStatefulWidget {
  final ValueChanged<List<JobListing>>? onApply;

  const JobSearchScreen({super.key, this.onApply});

  @override
  ConsumerState<JobSearchScreen> createState() => _JobSearchScreenState();
}

class _JobSearchScreenState extends ConsumerState<JobSearchScreen> {
  final _searchController = TextEditingController();
  final _selectedIds = <String>{};

  @override
  void initState() {
    super.initState();
    // Trigger initial search using profile's job preference if available
    WidgetsBinding.instance.addPostFrameCallback((_) => _triggerSearch());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _triggerSearch() {
    final q = _searchController.text.trim();
    ref.read(jobSearchParamsProvider.notifier).state =
        JobSearchParams(keywords: q);
  }

  void _toggleSelect(String id) => setState(() => _selectedIds.contains(id)
      ? _selectedIds.remove(id)
      : _selectedIds.add(id));

  @override
  Widget build(BuildContext context) {
    final jobsAsync = ref.watch(jobsProvider);

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
          'Vacatures',
          style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: OpstapColors.onSurface),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded,
                color: OpstapColors.primary),
            onPressed: () => ref.invalidate(jobsProvider),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: TextField(
                controller: _searchController,
                onSubmitted: (_) => _triggerSearch(),
                textInputAction: TextInputAction.search,
                style: GoogleFonts.inter(
                    fontSize: 14, color: OpstapColors.onSurface),
                decoration: InputDecoration(
                  hintText: 'Zoek functie of stad...',
                  hintStyle: GoogleFonts.inter(
                      fontSize: 14, color: OpstapColors.onSurfaceVariant),
                  prefixIcon: const Icon(Icons.search_rounded,
                      color: OpstapColors.onSurfaceVariant, size: 20),
                  suffixIcon: jobsAsync.isLoading
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: OpstapColors.primary),
                          ),
                        )
                      : null,
                  filled: true,
                  fillColor: OpstapColors.surfaceContainerLowest,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                ),
              ),
            ),

            // Body — loading / error / list
            Expanded(
              child: jobsAsync.when(
                loading: () => const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(color: OpstapColors.primary),
                      SizedBox(height: 16),
                      Text('Vacatures ophalen…'),
                    ],
                  ),
                ),
                error: (err, _) => _ErrorState(
                  onRetry: () => ref.invalidate(jobsProvider),
                ),
                data: (raw) {
                  final jobs =
                      raw.map(JobListing.fromJson).toList();

                  // Client-side text filter on top of API results
                  final query = _searchController.text.toLowerCase();
                  final filtered = query.isEmpty
                      ? jobs
                      : jobs
                          .where((j) =>
                              j.title.toLowerCase().contains(query) ||
                              j.company.toLowerCase().contains(query))
                          .toList();

                  final selected = jobs
                      .where((j) => _selectedIds.contains(j.id))
                      .toList();

                  if (filtered.isEmpty) {
                    return _EmptyState(
                        onRetry: () => ref.invalidate(jobsProvider));
                  }

                  return Stack(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              '${filtered.length} vacatures gevonden',
                              style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: OpstapColors.onSurfaceVariant),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Expanded(
                            child: ListView.separated(
                              padding: EdgeInsets.fromLTRB(
                                  16, 0, 16, selected.isEmpty ? 16 : 96),
                              itemCount: filtered.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 10),
                              itemBuilder: (_, i) {
                                final job = filtered[i];
                                return _JobCard(
                                  job: job,
                                  isSelected:
                                      _selectedIds.contains(job.id),
                                  onTap: () => _toggleSelect(job.id),
                                  onSave: () =>
                                      setState(() => job.saved = !job.saved),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                      if (selected.isNotEmpty)
                        Positioned(
                          bottom: 16,
                          left: 16,
                          right: 16,
                          child: _ApplyButton(
                            count: selected.length,
                            onPressed: () {
                              widget.onApply?.call(selected);
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => MotivationLetterScreen(
                                    jobs: selected,
                                    onSent: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => ConfirmationScreen(
                                          appliedJobs: selected,
                                          onSearchMore: () =>
                                              Navigator.popUntil(
                                                  context, (r) => r.isFirst),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Error / empty states ─────────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded,
                size: 48, color: OpstapColors.onSurfaceVariant),
            const SizedBox(height: 16),
            Text('Kan geen vacatures laden',
                style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: OpstapColors.onSurface)),
            const SizedBox(height: 8),
            Text('Controleer je verbinding en probeer opnieuw.',
                style: GoogleFonts.inter(
                    fontSize: 13, color: OpstapColors.onSurfaceVariant),
                textAlign: TextAlign.center),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
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

class _EmptyState extends StatelessWidget {
  final VoidCallback onRetry;
  const _EmptyState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off_rounded,
              size: 48, color: OpstapColors.onSurfaceVariant),
          const SizedBox(height: 16),
          Text('Geen vacatures gevonden',
              style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: OpstapColors.onSurface)),
          const SizedBox(height: 8),
          Text('Pas je zoekopdracht aan of probeer opnieuw.',
              style: GoogleFonts.inter(
                  fontSize: 13, color: OpstapColors.onSurfaceVariant)),
          const SizedBox(height: 24),
          TextButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Opnieuw zoeken'),
          ),
        ],
      ),
    );
  }
}

// ─── Job card ─────────────────────────────────────────────────────────────────

class _JobCard extends StatelessWidget {
  final JobListing job;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback onSave;

  const _JobCard({
    required this.job,
    required this.isSelected,
    required this.onTap,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected
              ? OpstapColors.secondaryContainer.withValues(alpha: 0.3)
              : OpstapColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color:
                isSelected ? OpstapColors.primary : Colors.transparent,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1A1C1C).withValues(alpha: 0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: job.logoColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      job.company.isNotEmpty ? job.company[0] : '?',
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
                      Text(job.title,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: OpstapColors.onSurface,
                          )),
                      const SizedBox(height: 2),
                      Text(job.company,
                          style: GoogleFonts.inter(
                              fontSize: 12,
                              color: OpstapColors.onSurfaceVariant)),
                    ],
                  ),
                ),
                if (job.matchScore > 0) _MatchChip(score: job.matchScore),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.location_on_outlined,
                    size: 13, color: OpstapColors.onSurfaceVariant),
                const SizedBox(width: 3),
                Text(
                  [job.location, job.contract]
                      .where((s) => s.isNotEmpty)
                      .join(' · '),
                  style: GoogleFonts.inter(
                      fontSize: 12,
                      color: OpstapColors.onSurfaceVariant),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                if (job.salaryRange.isNotEmpty)
                  Text(job.salaryRange,
                      style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: OpstapColors.onSurface)),
                const Spacer(),
                if (job.postedAgo.isNotEmpty)
                  Text(job.postedAgo,
                      style: GoogleFonts.inter(
                          fontSize: 11,
                          color: OpstapColors.onSurfaceVariant)),
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: onSave,
                  child: Icon(
                    job.saved
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_outline_rounded,
                    size: 18,
                    color: job.saved
                        ? OpstapColors.primary
                        : OpstapColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MatchChip extends StatelessWidget {
  final int score;
  const _MatchChip({required this.score});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: OpstapColors.secondaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$score%',
        style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: OpstapColors.primary),
      ),
    );
  }
}

// ─── Apply button ─────────────────────────────────────────────────────────────

class _ApplyButton extends StatelessWidget {
  final int count;
  final VoidCallback onPressed;

  const _ApplyButton({required this.count, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: OpstapColors.heroGradient,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: OpstapColors.primary.withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(30),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(30),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.send_rounded, size: 18, color: Colors.white),
                const SizedBox(width: 8),
                Text(
                  'Solliciteer op $count ${count == 1 ? 'vacature' : 'vacatures'}',
                  style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
