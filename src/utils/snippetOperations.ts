import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from '../types/snippet.ts'
import {PaginatedUsers} from "../types/users.ts";
import {TestCase} from "../types/TestCase.ts";
import {TestCaseResult} from "./queries.tsx";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";
import { RelationshipType } from "../types/Relationship.ts";

export interface SnippetOperations {
  listSnippetDescriptors(
                            page: number, pageSize: number,
                            snippetName?: string, language?: string, lintStatus?: string, 
                            sortBy?: string, sortOrder?: string, relationshipType?: RelationshipType
                        ): Promise<PaginatedSnippets>

  createSnippet(createSnippet: CreateSnippet): Promise<Snippet>

  getSnippetById(id: string): Promise<Snippet | undefined>

  updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet>

  getUserFriends(name?: string,page?: number,pageSize?: number): Promise<PaginatedUsers>

  shareSnippet(snippetId: string, userId: string, permissions: { read: boolean; write: boolean }): Promise<void>

  getFormatRules(): Promise<Rule[]>

  getLintingRules(): Promise<Rule[]>

  getTestCases(): Promise<TestCase[]>

  formatSnippet(snippetId: string, code: string): Promise<string>

  postTestCase(testCase: Partial<TestCase>): Promise<TestCase>

  removeTestCase(id: string): Promise<string>

  deleteSnippet(id: string): Promise<string>

  testSnippet(testCase: Partial<TestCase>): Promise<TestCaseResult>

  getFileTypes(): Promise<FileType[]>

  modifyFormatRule(newRules: Rule[]): Promise<Rule[]>

  modifyLintingRule(newRules: Rule[]): Promise<Rule[]>
}
