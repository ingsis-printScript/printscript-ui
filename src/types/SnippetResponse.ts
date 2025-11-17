export type LintStatus = 'PENDING' | 'COMPLIANT' | 'NON_COMPLIANT' | 'FAILED';

export type SnippetResponse = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  language: string;
  extension: string;
  version: string;
  content: string;
  lintStatus: LintStatus;
  lintErrors: string[] | null;
};