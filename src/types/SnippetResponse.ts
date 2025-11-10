export type SnippetResponse = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  language: string;
  extension: string;
  version: string;
  content: string;
};