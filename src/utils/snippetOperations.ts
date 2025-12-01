import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from '../types/snippet.ts'
import {PaginatedUsers} from "../types/users.ts";
import {TestCase} from "../types/TestCase.ts";
import {TestCaseResult} from "./queries.tsx";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";
import { RelationshipType } from "../types/Relationship.ts";
import {UserSnippetPermissions} from "../types/Permission.ts";

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

  getUserSnippetPermissions(snippetId: string, userId: string): Promise<UserSnippetPermissions>;

  shareSnippet(snippetId: string, userId: string, permissions: { read: boolean; write: boolean }): Promise<void>

  getFormatRules(): Promise<Rule[]>

  getLintingRules(): Promise<Rule[]>

  getTestCases(snippetId: string): Promise<TestCase[]>

  formatSnippet(snippetId: string, code: string): Promise<string>

  postTestCase(snippetId: string, testCase: Partial<TestCase>): Promise<TestCase>
  updateTestCase(snippetId: string, testId: string, testCase: Partial<TestCase>): Promise<TestCase>

  removeTestCase(snippetId: string, testId: string): Promise<string>

  deleteSnippet(id: string): Promise<string>

  testSnippet(snippetId: string, testId: string): Promise<TestCaseResult>

  getFileTypes(): Promise<FileType[]>

  modifyFormatRule(newRules: Rule[]): Promise<Rule[]>

  modifyLintingRule(newRules: Rule[]): Promise<Rule[]>
}
