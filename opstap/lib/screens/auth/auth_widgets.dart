import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

/// Returns the correct OAuth redirect URL depending on platform.
String get oauthRedirect {
  if (kIsWeb) return Uri.base.origin;
  return 'opstap://callback';
}

class OrDivider extends StatelessWidget {
  const OrDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: OpstapColors.outlineVariant)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'of',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: OpstapColors.onSurfaceVariant,
            ),
          ),
        ),
        const Expanded(child: Divider(color: OpstapColors.outlineVariant)),
      ],
    );
  }
}

class GoogleSignInButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onPressed;
  const GoogleSignInButton({super.key, required this.loading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: OutlinedButton(
        onPressed: loading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: OpstapColors.surfaceContainerLowest,
          side: const BorderSide(color: OpstapColors.outlineVariant),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: OpstapColors.primary),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'G',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF4285F4),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Doorgaan met Google',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: OpstapColors.onSurface,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
