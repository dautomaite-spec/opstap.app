import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
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
}

// ─── Screen ───────────────────────────────────────────────────────────────────

class JobSearchScreen extends StatefulWidget {
  final ValueChanged<List<JobListing>> onApply;

  const JobSearchScreen({super.key, required this.onApply});

  @override
  State<JobSearchScreen> createState() => _JobSearchScreenState();
}

class _JobSearchScreenState extends State<JobSearchScreen> {
  final _searchController = TextEditingController();
  final _selectedIds = <String>{};

  final _activeFilters = ['Amsterdam', 'Fulltime', '€3.000+'];

  final _jobs = [
    JobListing(
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'Coolblue',
      location: 'Amsterdam',
      contract: 'Fulltime',
      salaryRange: '€4.500 – €5.500',
      postedAgo: '2 dagen geleden',
      matchScore: 92,
      logoColor: const Color(0xFF3E3CB6),
    ),
    JobListing(
      id: '2',
      title: 'UX Designer',
      company: 'Bol.com',
      location: 'Utrecht',
      contract: 'Fulltime',
      salaryRange: '€3.800 – €4.800',
      postedAgo: '3 dagen geleden',
      matchScore: 88,
      logoColor: const Color(0xFFE65100),
    ),
    JobListing(
      id: '3',
      title: 'Product Manager',
      company: 'Adyen',
      location: 'Amsterdam',
      contract: 'Fulltime',
      salaryRange: '€5.000 – €6.500',
      postedAgo: '5 dagen geleden',
      matchScore: 85,
      logoColor: const Color(0xFF2E7D32),
    ),
    JobListing(
      id: '4',
      title: 'Backend Developer',
      company: 'Picnic',
      location: 'Amsterdam',
      contract: 'Fulltime',
      salaryRange: '€4.000 – €5.200',
      postedAgo: '1 week geleden',
      matchScore: 79,
      logoColor: const Color(0xFF6A1B9A),
    ),
    JobListing(
      id: '5',
      title: 'Data Analyst',
      company: 'NS',
      location: 'Utrecht',
      contract: 'Parttime',
      salaryRange: '€3.200 – €4.000',
      postedAgo: '1 week geleden',
      matchScore: 74,
      logoColor: const Color(0xFF00695C),
    ),
  ];

  List<JobListing> get _filtered {
    final query = _searchController.text.toLowerCase();
    if (query.isEmpty) return _jobs;
    return _jobs
        .where((j) =>
            j.title.toLowerCase().contains(query) ||
            j.company.toLowerCase().contains(query))
        .toList();
  }

  void _toggleSelect(String id) =>
      setState(() => _selectedIds.contains(id)
          ? _selectedIds.remove(id)
          : _selectedIds.add(id));

  void _removeFilter(String filter) =>
      setState(() => _activeFilters.remove(filter));

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final selected =
        _jobs.where((j) => _selectedIds.contains(j.id)).toList();

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
            color: OpstapColors.onSurface,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: OpstapColors.primary),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Search bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (_) => setState(() {}),
                    style: GoogleFonts.inter(
                        fontSize: 14, color: OpstapColors.onSurface),
                    decoration: InputDecoration(
                      hintText: 'Zoek functie of bedrijf...',
                      hintStyle: GoogleFonts.inter(
                          fontSize: 14,
                          color: OpstapColors.onSurfaceVariant),
                      prefixIcon: const Icon(Icons.search_rounded,
                          color: OpstapColors.onSurfaceVariant, size: 20),
                      filled: true,
                      fillColor: OpstapColors.surfaceContainerLowest,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                    ),
                  ),
                ),
                // Filter chips
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _FilterChip(
                        label: 'Filters',
                        icon: Icons.tune_rounded,
                        onTap: () {},
                      ),
                      const SizedBox(width: 8),
                      ..._activeFilters.map((f) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: _ActiveFilterChip(
                              label: f,
                              onRemove: () => _removeFilter(f),
                            ),
                          )),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Result count
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    '${filtered.length} vacatures gevonden',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: OpstapColors.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                // Job list
                Expanded(
                  child: ListView.separated(
                    padding: EdgeInsets.fromLTRB(
                        16, 0, 16, selected.isEmpty ? 16 : 88),
                    itemCount: filtered.length,
                    separatorBuilder: (context, _) =>
                        const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final job = filtered[i];
                      return _JobCard(
                        job: job,
                        isSelected: _selectedIds.contains(job.id),
                        onTap: () => _toggleSelect(job.id),
                        onSave: () =>
                            setState(() => job.saved = !job.saved),
                      );
                    },
                  ),
                ),
              ],
            ),
            // Floating apply button
            if (selected.isNotEmpty)
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: _ApplyButton(
                  count: selected.length,
                  onPressed: () {
                    widget.onApply(selected);
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
                                onSearchMore: () => Navigator.popUntil(
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
        ),
      ),
    );
  }
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _FilterChip(
      {required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: OpstapColors.primary,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: Colors.white),
            const SizedBox(width: 6),
            Text(label,
                style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.white)),
          ],
        ),
      ),
    );
  }
}

class _ActiveFilterChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;

  const _ActiveFilterChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: OpstapColors.outlineVariant, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: OpstapColors.primary)),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close_rounded,
                size: 14, color: OpstapColors.primary),
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
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? OpstapColors.tertiaryContainer.withValues(alpha: 0.25)
              : OpstapColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? OpstapColors.tertiaryContainer
                : Colors.transparent,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1C1A2E).withValues(alpha: 0.05),
              blurRadius: 14,
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
                // Company logo
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: job.logoColor,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      job.company[0],
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
                      Text(
                        job.title,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: OpstapColors.onSurface,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        job.company,
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            color: OpstapColors.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                // Match score chip
                _MatchChip(score: job.matchScore),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.location_on_outlined,
                    size: 13, color: OpstapColors.onSurfaceVariant),
                const SizedBox(width: 3),
                Text(
                  '${job.location} · ${job.contract}',
                  style: GoogleFonts.inter(
                      fontSize: 12, color: OpstapColors.onSurfaceVariant),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  job.salaryRange,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: OpstapColors.onSurface,
                  ),
                ),
                const Spacer(),
                Text(
                  job.postedAgo,
                  style: GoogleFonts.inter(
                      fontSize: 11,
                      color: OpstapColors.onSurfaceVariant),
                ),
                const SizedBox(width: 4),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: OpstapColors.tertiaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$score%',
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: OpstapColors.onTertiaryContainer,
        ),
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
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [OpstapColors.primary, OpstapColors.primaryContainer],
        ),
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
    );
  }
}
