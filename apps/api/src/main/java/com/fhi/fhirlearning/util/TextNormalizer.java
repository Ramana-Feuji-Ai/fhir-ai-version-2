package com.fhi.fhirlearning.util;

/**
 * Fixes UTF-8 punctuation that was corrupted during SPA → JSON export
 * (e.g. en-dash U+2013 became {@code â€“} when UTF-8 was misread as Windows-1252).
 */
public final class TextNormalizer {

    private TextNormalizer() {}

    public static String clean(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        return value
                // mojibake sequences (UTF-8 bytes interpreted as Latin-1/CP1252)
                .replace("â€“", "-")   // en dash
                .replace("â€”", "-")   // em dash
                .replace("â€˜", "'")   // left single quote
                .replace("â€™", "'")   // right single quote / apostrophe
                .replace("â€œ", "\"")  // left double quote
                .replace("â€", "\"")  // right double quote
                .replace("â€¢", "-")   // bullet
                .replace("â€¦", "...") // ellipsis
                .replace("â†’", "->")  // right arrow
                .replace("Ã§", "c")    // ç in façade etc. (approx)
                .replace("Ã©", "e")
                .replace("Ã¨", "e")
                .replace("Ã ", "a")
                // real unicode punctuation → ASCII-safe for UI consistency
                .replace("–", "-")
                .replace("—", "-")
                .replace("‘", "'")
                .replace("’", "'")
                .replace("“", "\"")
                .replace("”", "\"")
                .replace("•", "-")
                .replace("…", "...")
                .replace("→", "->");
    }
}
