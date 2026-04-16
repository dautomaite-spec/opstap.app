import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme.dart';
import 'login_screen.dart' show _OrDivider, _GoogleButton, _oauthRedirect;

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _loadingGoogle = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _avgAccepted = false;
  String? _errorMessage;
  bool _registered = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _registerWithGoogle() async {
    setState(() {
      _loadingGoogle = true;
      _errorMessage = null;
    });
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: _oauthRedirect,
      );
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = 'Google aanmelden mislukt. Probeer het opnieuw.');
      }
    } finally {
      if (mounted) setState(() => _loadingGoogle = false);
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_avgAccepted) {
      setState(() => _errorMessage = 'Accepteer de privacyvoorwaarden om door te gaan.');
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      await Supabase.instance.client.auth.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (mounted) setState(() => _registered = true);
    } on AuthException catch (e) {
      setState(() => _errorMessage = _translateError(e.message));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _translateError(String message) {
    if (message.toLowerCase().contains('already registered')) {
      return 'Dit e-mailadres is al in gebruik. Probeer in te loggen.';
    }
    if (message.toLowerCase().contains('password')) {
      return 'Wachtwoord voldoet niet aan de vereisten.';
    }
    return 'Er is iets misgegaan. Probeer het opnieuw.';
  }

  static String? _validatePassword(String? v) {
    if (v == null || v.isEmpty) return 'Vul een wachtwoord in';
    if (v.length < 10) return 'Minimaal 10 tekens';
    if (!v.contains(RegExp(r'[A-Z]'))) return 'Minimaal één hoofdletter (A–Z)';
    if (!v.contains(RegExp(r'[0-9]'))) return 'Minimaal één cijfer (0–9)';
    if (!v.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>_\-]')))
      return 'Minimaal één speciaal teken (!@#\$%...)';
    return null;
  }

  static int _passwordStrength(String v) {
    if (v.isEmpty) return 0;
    int score = 0;
    if (v.length >= 10) score++;
    if (v.length >= 14) score++;
    if (v.contains(RegExp(r'[A-Z]'))) score++;
    if (v.contains(RegExp(r'[0-9]'))) score++;
    if (v.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>_\-]'))) score++;
    return score; // 0–5
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: OpstapColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: _registered ? _ConfirmationView(email: _emailController.text.trim()) : _buildForm(),
      ),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 8),
          _Header(),
          const SizedBox(height: 32),
          _RegisterForm(
            formKey: _formKey,
            emailController: _emailController,
            passwordController: _passwordController,
            confirmController: _confirmController,
            obscurePassword: _obscurePassword,
            obscureConfirm: _obscureConfirm,
            onTogglePassword: () => setState(() => _obscurePassword = !_obscurePassword),
            onToggleConfirm: () => setState(() => _obscureConfirm = !_obscureConfirm),
            errorMessage: _errorMessage,
            passwordValidator: _validatePassword,
            passwordStrength: _passwordStrength(_passwordController.text),
            onPasswordChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          _AvgCheckbox(
            value: _avgAccepted,
            onChanged: (v) => setState(() => _avgAccepted = v ?? false),
          ),
          const SizedBox(height: 24),
          _RegisterButton(loading: _loading, onPressed: _register),
          const SizedBox(height: 16),
          _OrDivider(),
          const SizedBox(height: 16),
          _GoogleButton(loading: _loadingGoogle, onPressed: _registerWithGoogle),
          const SizedBox(height: 16),
          _LoginLink(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          'Account aanmaken',
          style: GoogleFonts.poppins(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: OpstapColors.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Gratis. Jij bepaalt altijd wat er met je data gebeurt.',
          style: GoogleFonts.inter(
            fontSize: 15,
            color: OpstapColors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _RegisterForm extends StatelessWidget {
  const _RegisterForm({
    required this.formKey,
    required this.emailController,
    required this.passwordController,
    required this.confirmController,
    required this.obscurePassword,
    required this.obscureConfirm,
    required this.onTogglePassword,
    required this.onToggleConfirm,
    required this.passwordValidator,
    required this.passwordStrength,
    required this.onPasswordChanged,
    this.errorMessage,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController confirmController;
  final bool obscurePassword;
  final bool obscureConfirm;
  final VoidCallback onTogglePassword;
  final VoidCallback onToggleConfirm;
  final String? Function(String?) passwordValidator;
  final int passwordStrength; // 0–5
  final ValueChanged<String> onPasswordChanged;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: OpstapColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: OpstapColors.onSurface.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Form(
        key: formKey,
        child: Column(
          children: [
            TextFormField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              decoration: _inputDecoration('E-mailadres', Icons.email_outlined),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Vul je e-mailadres in';
                if (!v.contains('@')) return 'Voer een geldig e-mailadres in';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: passwordController,
              obscureText: obscurePassword,
              textInputAction: TextInputAction.next,
              onChanged: onPasswordChanged,
              decoration: _inputDecoration('Wachtwoord', Icons.lock_outline_rounded).copyWith(
                helperText: 'Min. 10 tekens, hoofdletter, cijfer, speciaal teken',
                suffixIcon: IconButton(
                  icon: Icon(
                    obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: OpstapColors.onSurfaceVariant,
                  ),
                  onPressed: onTogglePassword,
                ),
              ),
              validator: passwordValidator,
            ),
            const SizedBox(height: 8),
            _PasswordStrengthBar(strength: passwordStrength),
            const SizedBox(height: 16),
            TextFormField(
              controller: confirmController,
              obscureText: obscureConfirm,
              textInputAction: TextInputAction.done,
              decoration: _inputDecoration('Wachtwoord herhalen', Icons.lock_outline_rounded).copyWith(
                suffixIcon: IconButton(
                  icon: Icon(
                    obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: OpstapColors.onSurfaceVariant,
                  ),
                  onPressed: onToggleConfirm,
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Herhaal je wachtwoord';
                if (v != passwordController.text) return 'Wachtwoorden komen niet overeen';
                return null;
              },
            ),
            if (errorMessage != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFDAD6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: OpstapColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        errorMessage!,
                        style: GoogleFonts.inter(fontSize: 13, color: OpstapColors.error),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: OpstapColors.onSurfaceVariant, size: 20),
      filled: true,
      fillColor: OpstapColors.surfaceContainerLowest,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: OpstapColors.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: OpstapColors.primary, width: 2),
      ),
    );
  }
}

class _AvgCheckbox extends StatelessWidget {
  const _AvgCheckbox({required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: OpstapColors.primary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 12),
              child: RichText(
                text: TextSpan(
                  style: GoogleFonts.inter(fontSize: 13, color: OpstapColors.onSurfaceVariant),
                  children: const [
                    TextSpan(text: 'Ik ga akkoord met de '),
                    TextSpan(
                      text: 'privacyvoorwaarden',
                      style: TextStyle(
                        color: OpstapColors.primary,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                    TextSpan(text: '. Jouw data wordt niet gedeeld met derden.'),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RegisterButton extends StatelessWidget {
  const _RegisterButton({required this.loading, required this.onPressed});

  final bool loading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: OpstapColors.heroGradient,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: OpstapColors.primary.withValues(alpha: 0.35),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: loading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          ),
          child: loading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                )
              : Text(
                  'Account aanmaken',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
        ),
      ),
    );
  }
}

class _LoginLink extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'Al een account? ',
          style: GoogleFonts.inter(fontSize: 14, color: OpstapColors.onSurfaceVariant),
        ),
        GestureDetector(
          onTap: () => context.pop(),
          child: Text(
            'Inloggen',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: OpstapColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _PasswordStrengthBar extends StatelessWidget {
  final int strength; // 0–5

  const _PasswordStrengthBar({required this.strength});

  @override
  Widget build(BuildContext context) {
    if (strength == 0) return const SizedBox.shrink();

    final (label, color) = switch (strength) {
      1 || 2 => ('Zwak', const Color(0xFFE53935)),
      3 => ('Matig', const Color(0xFFF57C00)),
      4 => ('Sterk', const Color(0xFF388E3C)),
      _ => ('Zeer sterk', const Color(0xFF1B5E20)),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(5, (i) {
            return Expanded(
              child: Container(
                height: 4,
                margin: EdgeInsets.only(right: i < 4 ? 4 : 0),
                decoration: BoxDecoration(
                  color: i < strength ? color : OpstapColors.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _ConfirmationView extends StatelessWidget {
  const _ConfirmationView({required this.email});

  final String email;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.mark_email_read_outlined, size: 44, color: Color(0xFF16A34A)),
          ),
          const SizedBox(height: 24),
          Text(
            'Bijna klaar!',
            style: GoogleFonts.poppins(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: OpstapColors.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'We hebben een bevestigingslink gestuurd naar\n$email\n\nKlik op de link om je account te activeren.',
            style: GoogleFonts.inter(fontSize: 15, color: OpstapColors.onSurfaceVariant, height: 1.5),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: OutlinedButton(
              onPressed: () => context.go('/login'),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: OpstapColors.primary, width: 2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(
                'Naar inloggen',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: OpstapColors.primary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
