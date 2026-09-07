/** Shared shape for the rendered legal documents (Terms, Ambassador Agreement). */
export interface LegalSection {
  /** Section number as shown to the reader, e.g. "6". */
  n: string;
  h: string;
  /** Paragraphs. */
  body?: string[];
  /** Bulleted items rendered after the paragraphs. */
  list?: string[];
  /** Paragraphs rendered after the list. */
  after?: string[];
  /** Renders the section in the warning treatment. */
  emphasis?: boolean;
}

/** One clause shown in an acceptance dialog before the checkbox. */
export interface LegalKeyPoint {
  title: string;
  text: string;
}
