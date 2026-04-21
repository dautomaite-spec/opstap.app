"""
Prompt injection and jailbreak guard for Opstap letter generation.

Covers:
  - Classic instruction-override patterns ("ignore previous instructions", etc.)
  - Role-play / persona attacks ("you are now DAN", "act as", etc.)
  - Delimiter-escape attempts (injecting </system>, [INST], etc.)
  - Output-format attacks ("respond only in JSON", "print your system prompt", etc.)
  - Suspicious URL / HTML injection in user-supplied text
  - Output validation: generated letter must look like Dutch prose, not commands

All public functions raise PromptInjectionError on detection.
"""

import re
from typing import Final

# ── Custom exception ──────────────────────────────────────────────────────────

class PromptInjectionError(ValueError):
    """Raised when user-supplied input contains a prompt injection attempt."""
    pass


# ── Injection detection patterns ─────────────────────────────────────────────

# Each pattern is matched case-insensitively against the raw input.
# Short, high-signal phrases only — no false-positive traps.
_INJECTION_PATTERNS: Final[list[re.Pattern]] = [re.compile(p, re.IGNORECASE) for p in [
    # Instruction override
    r"ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+instructions?",
    r"forget\s+(all\s+)?(previous|prior|above)\s+instructions?",
    r"override\s+(the\s+)?(system\s+)?prompt",
    r"new\s+instructions?:",
    r"your\s+(new\s+)?instructions?\s+(are|is)\s*:",
    r"from\s+now\s+on\s+(you\s+are|act\s+as|pretend)",
    # Role / persona attacks
    r"\byou\s+are\s+now\b",
    r"\bact\s+as\s+(an?\s+)?\w+",
    r"\bpretend\s+(to\s+be|you\s+are)",
    r"\brole[-\s]?play\b",
    r"\byou\s+are\s+(?:DAN|GPT|ChatGPT|an?\s+AI\s+without)",
    r"\bjailbreak\b",
    # System prompt extraction
    r"print\s+(your\s+)?(system\s+)?prompt",
    r"repeat\s+(your\s+)?(system\s+)?instructions?",
    r"reveal\s+(your\s+)?(system\s+)?prompt",
    r"what\s+(are\s+)?your\s+instructions?",
    r"show\s+me\s+your\s+(system\s+)?prompt",
    # Delimiter injection — attempts to break out of XML-wrapped user block
    r"</?(system|user|assistant|prompt|instruction|context)\s*>",
    r"\[INST\]|\[/INST\]|<\|im_start\|>|<\|im_end\|>",
    # Output-format hijacking
    r"respond\s+(only\s+)?(in|as)\s+(json|yaml|xml|code|english|a\s+different)",
    r"output\s+(only|just|in)\s+(json|yaml|xml|plain\s+text|english)",
    r"translate\s+(this\s+)?(letter\s+)?to\s+english",
    r"switch\s+(to\s+)?english",
    # Prompt chaining / indirect injection
    r"the\s+following\s+is\s+(a\s+)?(new\s+)?(task|instruction|command)",
    r"execute\s+the\s+following",
    r"run\s+the\s+following\s+(command|instruction|code)",
]]

# Patterns that are suspicious only in the `extra_info` / free-text fields,
# not in job descriptions scraped from job boards.
_FREE_TEXT_EXTRA_PATTERNS: Final[list[re.Pattern]] = [re.compile(p, re.IGNORECASE) for p in [
    # Raw URLs in user-supplied profile text are unusual and high-risk
    r"https?://\S+",
    # HTML / markdown that could render as a link
    r"<a\s+href",
    r"\[.+?\]\(https?://",
]]


def _detect_injection(text: str, field_name: str, *, strict: bool = False) -> None:
    """
    Raise PromptInjectionError if `text` contains injection patterns.
    `strict=True` also checks free-text-only patterns (for profile fields).
    """
    if not text:
        return
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            raise PromptInjectionError(
                f"Prompt injection detected in field '{field_name}': "
                f"matched pattern /{pattern.pattern}/"
            )
    if strict:
        for pattern in _FREE_TEXT_EXTRA_PATTERNS:
            if pattern.search(text):
                raise PromptInjectionError(
                    f"Suspicious content in field '{field_name}': "
                    f"matched pattern /{pattern.pattern}/"
                )


# ── Input sanitisation ────────────────────────────────────────────────────────

def sanitize_and_check_job_text(text: str, field_name: str, max_len: int) -> str:
    """
    Strip HTML, collapse whitespace, truncate, then scan for injection.
    Used for scraped content (job title, company, description).
    """
    text = re.sub(r"<[^>]+>", " ", text)       # strip HTML tags
    text = re.sub(r"\s+", " ", text).strip()    # collapse whitespace
    text = text[:max_len]
    _detect_injection(text, field_name, strict=False)
    return text


def sanitize_and_check_profile_text(text: str, field_name: str, max_len: int) -> str:
    """
    Sanitize and strictly scan user-supplied profile free-text fields.
    URLs and HTML in profile text are treated as injection attempts.
    """
    text = re.sub(r"<[^>]+>", " ", text)       # strip any HTML
    text = re.sub(r"\s+", " ", text).strip()
    text = text[:max_len]
    _detect_injection(text, field_name, strict=True)
    return text


# ── Output validation ─────────────────────────────────────────────────────────

# These patterns in the generated output indicate the model was manipulated
# into producing something other than a Dutch motivation letter.
_OUTPUT_INJECTION_PATTERNS: Final[list[re.Pattern]] = [re.compile(p, re.IGNORECASE) for p in [
    # Model revealing its system prompt
    r"system\s+prompt",
    r"my\s+instructions?\s+(are|say|state)",
    # Model adopting a persona
    r"\bI\s+am\s+(DAN|GPT|ChatGPT|an?\s+AI\s+without)",
    # Output looks like commands / code
    r"```",
    r"<script",
    r"<\?php",
    # Prompt chaining artifacts
    r"\[INST\]|\[/INST\]",
    r"<\|im_start\|>",
    # Suspicious URLs in generated letter
    r"https?://(?!opstap\.nl)\S+",
    # HTML injection
    r"<a\s+href",
    r"<img\s+src",
    r"javascript:",
    # English-only output (letter must contain Dutch words)
    # Checked separately in validate_letter_output below
]]

# Minimum Dutch signal: at least one of these common Dutch words must appear.
_DUTCH_SIGNAL_WORDS: Final[list[str]] = [
    "de", "het", "een", "en", "van", "voor", "ik", "mijn", "met",
    "bij", "op", "als", "zijn", "heeft", "dat", "dit", "we", "u",
    "uw", "naar", "aan", "ook", "niet", "ze", "door", "meer",
]

_DUTCH_RE: Final[re.Pattern] = re.compile(
    r"\b(" + "|".join(_DUTCH_SIGNAL_WORDS) + r")\b",
    re.IGNORECASE,
)


def validate_letter_output(letter: str) -> None:
    """
    Validate that the model output looks like a Dutch motivation letter.
    Raises PromptInjectionError if:
      - The output contains obvious injection artefacts
      - The output contains no Dutch signal words (language hijack)
      - The output is suspiciously short (< 100 chars) or long (> 4000 chars)
    """
    if len(letter) < 100:
        raise PromptInjectionError(
            "Generated letter is suspiciously short — possible prompt manipulation."
        )
    if len(letter) > 4000:
        raise PromptInjectionError(
            "Generated letter exceeds maximum length — possible prompt manipulation."
        )

    for pattern in _OUTPUT_INJECTION_PATTERNS:
        if pattern.search(letter):
            raise PromptInjectionError(
                f"Generated letter contains suspicious content matching /{pattern.pattern}/"
            )

    # Must contain at least 5 Dutch signal word occurrences
    dutch_hits = len(_DUTCH_RE.findall(letter))
    if dutch_hits < 5:
        raise PromptInjectionError(
            f"Generated letter does not appear to be in Dutch "
            f"(only {dutch_hits} Dutch signal words found)."
        )
