import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/env.dart';

/// Central HTTP client for the Opstap FastAPI backend.
///
/// Every request attaches the current Supabase JWT so the backend can
/// identify the user. Call [ApiClient.instance] from anywhere.
class ApiClient {
  ApiClient._();
  static final instance = ApiClient._();

  String get _base => Env.apiBaseUrl;

  String? get _token =>
      Supabase.instance.client.auth.currentSession?.accessToken;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  String get _userId =>
      Supabase.instance.client.auth.currentUser?.id ?? '';

  // ─── Profile ──────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getProfile() async {
    final res = await http.get(
      Uri.parse('$_base/api/v1/profile/me?user_id=$_userId'),
      headers: _headers,
    );
    _check(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createProfile(
      Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$_base/api/v1/profile/?user_id=$_userId'),
      headers: _headers,
      body: jsonEncode(body),
    );
    _check(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(
      Map<String, dynamic> body) async {
    final res = await http.patch(
      Uri.parse('$_base/api/v1/profile/me?user_id=$_userId'),
      headers: _headers,
      body: jsonEncode(body),
    );
    _check(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<void> uploadCv({
    required Uint8List fileBytes,
    required String fileName,
    required int retentionDays,
  }) async {
    final uri = Uri.parse(
        '$_base/api/v1/profile/cv?user_id=$_userId&retention_days=$retentionDays');
    final request = http.MultipartRequest('POST', uri)
      ..headers.addAll({
        if (_token != null) 'Authorization': 'Bearer $_token',
      })
      ..files.add(http.MultipartFile.fromBytes(
        'file',
        fileBytes,
        filename: fileName,
      ));
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    _check(res);
  }

  Future<void> deleteCv() async {
    final res = await http.delete(
      Uri.parse('$_base/api/v1/profile/cv?user_id=$_userId'),
      headers: _headers,
    );
    _check(res);
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> searchJobs({
    String? keywords,
    String? location,
    int limit = 20,
  }) async {
    final body = {
      if (keywords != null) 'keywords': keywords,
      if (location != null) 'location': location,
      'limit': limit,
    };
    final res = await http.post(
      Uri.parse('$_base/api/v1/jobs/search?user_id=$_userId'),
      headers: _headers,
      body: jsonEncode(body),
    );
    _check(res);
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  // ─── Apply ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> generateLetter({
    required String jobId,
    required String profileId,
    String? customNotes,
    String writingStyle = 'formeel',
  }) async {
    final res = await http.post(
      Uri.parse('$_base/api/v1/apply/letter?user_id=$_userId'),
      headers: _headers,
      body: jsonEncode({
        'job_id': jobId,
        'profile_id': profileId,
        if (customNotes != null) 'custom_notes': customNotes,
        'writing_style': writingStyle,
      }),
    );
    _check(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> sendApplication({
    required String jobId,
    required String profileId,
    required String letterNl,
    String sendMethod = 'email',
  }) async {
    final res = await http.post(
      Uri.parse('$_base/api/v1/apply/send?user_id=$_userId'),
      headers: _headers,
      body: jsonEncode({
        'job_id': jobId,
        'profile_id': profileId,
        'letter_nl': letterNl,
        'send_method': sendMethod,
      }),
    );
    _check(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> getApplicationHistory() async {
    final res = await http.get(
      Uri.parse('$_base/api/v1/apply/history?user_id=$_userId'),
      headers: _headers,
    );
    _check(res);
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  void _check(http.Response res) {
    if (res.statusCode >= 400) {
      String detail = res.body;
      try {
        final decoded = jsonDecode(res.body);
        detail = decoded['detail']?.toString() ?? res.body;
      } catch (_) {}
      throw ApiException(res.statusCode, detail);
    }
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String detail;
  const ApiException(this.statusCode, this.detail);

  @override
  String toString() => 'ApiException($statusCode): $detail';
}
