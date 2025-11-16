/**
 * Auto-detect programming language from content
 * Uses pattern matching and heuristics
 */
export function detectLanguage(content) {
  if (!content || typeof content !== 'string') {
    return 'plaintext';
  }

  const sample = content.substring(0, 1000).toLowerCase();

  // JavaScript/TypeScript
  if (
    /\b(const|let|var|function|=>|import\s+.*from|export\s+(default|const)|require\()/i.test(content) &&
    /[{};]/.test(content)
  ) {
    if (/:\s*(string|number|boolean|any|interface|type\s+\w+\s*=)/i.test(content)) {
      if (/<[A-Z][\w]*/.test(content)) return 'tsx';
      return 'typescript';
    }
    if (/<[A-Z][\w]*/.test(content) && /className=|onClick=/.test(content)) {
      return 'jsx';
    }
    return 'javascript';
  }

  // Python
  if (
    /\b(def|class|import|from|if __name__|print\(|range\()/i.test(content) &&
    /:[\s]*\n/.test(content)
  ) {
    return 'python';
  }

  // Java
  if (
    /\b(public|private|protected)\s+(static\s+)?(class|void|int|String)/i.test(content) &&
    /System\.(out|err)\.print/.test(content)
  ) {
    return 'java';
  }

  // C/C++
  if (
    /#include\s*[<"]/.test(content) ||
    /\b(printf|scanf|cout|cin|std::)/.test(content)
  ) {
    if (/\b(cout|cin|std::|namespace|template|class)/.test(content)) {
      return 'cpp';
    }
    return 'c';
  }

  // C#
  if (
    /\b(using|namespace)\s+[A-Z]/.test(content) &&
    /\b(public|private|protected)\s+(static\s+)?(class|void|int|string)/i.test(content) &&
    /Console\.Write/.test(content)
  ) {
    return 'csharp';
  }

  // Go
  if (
    /\bpackage\s+\w+/.test(content) &&
    /\bfunc\s+/.test(content) &&
    /\bfmt\.Print/.test(content)
  ) {
    return 'go';
  }

  // Rust
  if (
    /\b(fn|let|mut|pub|use|impl|trait)\b/.test(content) &&
    /println!|vec!/.test(content)
  ) {
    return 'rust';
  }

  // PHP
  if (/<\?php/.test(content) || /\$\w+\s*=/.test(sample)) {
    return 'php';
  }

  // Ruby
  if (
    /\b(def|end|class|module|require|puts|attr_accessor)\b/.test(content) &&
    /@\w+/.test(content)
  ) {
    return 'ruby';
  }

  // SQL
  if (
    /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|FROM|WHERE|JOIN)\b/i.test(content) &&
    /;[\s]*$|;[\s]*\n/m.test(content)
  ) {
    return 'sql';
  }

  // JSON
  if (
    /^\s*[\[{]/.test(content) &&
    /"[^"]+"\s*:\s*/.test(content) &&
    /[\]}]\s*$/.test(content.trim())
  ) {
    return 'json';
  }

  // YAML
  if (
    /^[\s]*[\w-]+:\s*[\w]/.test(content) &&
    !/[{}\[\]]/.test(sample) &&
    /^\s*-\s+/m.test(content)
  ) {
    return 'yaml';
  }

  // Markdown
  if (
    /^#+\s+/.test(content) ||
    /\[.*\]\(.*\)/.test(content) ||
    /^[\s]*[-*]\s+/.test(content)
  ) {
    return 'markdown';
  }

  // Bash/Shell
  if (
    /^#!\/bin\/(bash|sh)/.test(content) ||
    /\b(echo|export|source|chmod|sudo|apt-get|npm|yarn)\b/.test(content)
  ) {
    return 'bash';
  }

  // CSS
  if (
    /\{[^}]*[a-z-]+:\s*[^;]+;/.test(content) &&
    /[.#][\w-]+\s*\{/.test(content)
  ) {
    return 'css';
  }

  // HTML
  if (
    /<(!DOCTYPE|html|head|body|div|span|p|a|img|script|style|link)/i.test(content) &&
    /<\/\w+>/.test(content)
  ) {
    return 'html';
  }

  return 'plaintext';
}
