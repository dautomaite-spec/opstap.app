import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

// ─── Profile ──────────────────────────────────────────────────────────────────

final profileProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ApiClient.instance.getProfile();
});

// Notifier for profile mutations (create / update)
class ProfileNotifier extends AsyncNotifier<Map<String, dynamic>?> {
  @override
  Future<Map<String, dynamic>?> build() async {
    try {
      return await ApiClient.instance.getProfile();
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null; // no profile yet
      rethrow;
    }
  }

  Future<void> save(Map<String, dynamic> data) async {
    final current = state.valueOrNull;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      if (current == null) {
        return ApiClient.instance.createProfile(data);
      } else {
        return ApiClient.instance.updateProfile(data);
      }
    });
  }
}

final profileNotifierProvider =
    AsyncNotifierProvider<ProfileNotifier, Map<String, dynamic>?>(
        ProfileNotifier.new);

// ─── Jobs ─────────────────────────────────────────────────────────────────────

class JobSearchParams {
  final String keywords;
  final String location;
  const JobSearchParams({this.keywords = '', this.location = ''});
}

final jobSearchParamsProvider =
    StateProvider<JobSearchParams>((ref) => const JobSearchParams());

final jobsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final params = ref.watch(jobSearchParamsProvider);
  return ApiClient.instance.searchJobs(
    keywords: params.keywords.isEmpty ? null : params.keywords,
    location: params.location.isEmpty ? null : params.location,
  );
});

// ─── Applications ─────────────────────────────────────────────────────────────

final applicationHistoryProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ApiClient.instance.getApplicationHistory();
});
