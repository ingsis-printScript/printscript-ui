import axios, { AxiosInstance } from 'axios';
import { SnippetOperations } from './snippetOperations';
import { CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet } from './snippet';
import { PaginatedUsers } from './users';
import { TestCase } from '../types/TestCase';
import { TestCaseResult } from './queries';
import { FileType } from '../types/FileType';
import { Rule } from '../types/Rule';
import autoBind from 'auto-bind';

const API_URL = import.meta.env.VITE_API_URL || '/api/snippet-service';

export class ApiSnippetOperations implements SnippetOperations {
  private readonly client: AxiosInstance;
  private getToken: () => Promise<string>;

  constructor(getAccessTokenSilently: () => Promise<string>) {
    this.getToken = getAccessTokenSilently;

    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      try {
        const token = await this.getToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting access token:', error);
      }
      return config;
    });

    autoBind(this);
  }

  async listSnippetDescriptors(page: number, pageSize: number, snippetName?: string): Promise<PaginatedSnippets> {
    const params: Record<string, string | number> = { page, pageSize };
    if (snippetName) {
      params.name = snippetName;
    }

    const response = await this.client.get<{
      content: Array<{
        id: string;
        userId: string;
        name: string;
        description: string;
        language: string;
        version: string;
        contentReference: string;
      }>;
      page: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    }>('/snippets-management', { params });

    const data = response.data;

    const snippets = data.content.map((s) => ({
      id: s.id,
      name: s.name,
      content: '', // Content not included in list endpoint
      language: s.language,
      extension: 'ps', // Default PrintScript extension
      compliance: 'pending' as const, // TODO: Get actual compliance status
      author: s.userId,
    }));

    return {
      page: data.page,
      page_size: data.pageSize,
      count: data.totalElements,
      snippets,
    };
  }

  // TODO: al hacer lo de abajo, sacar el eslint-disable y los underscores (son por issues de unused vars)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createSnippet(_createSnippet: CreateSnippet): Promise<Snippet> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSnippetById(_id: string): Promise<Snippet | undefined> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateSnippetById(_id: string, _updateSnippet: UpdateSnippet): Promise<Snippet> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUserFriends(_name?: string, _page?: number, _pageSize?: number): Promise<PaginatedUsers> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async shareSnippet(_snippetId: string, _userId: string): Promise<Snippet> {
    throw new Error('Not implemented yet');
  }

  async getFormatRules(): Promise<Rule[]> {
    throw new Error('Not implemented yet');
  }

  async getLintingRules(): Promise<Rule[]> {
    throw new Error('Not implemented yet');
  }

  async getTestCases(): Promise<TestCase[]> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async formatSnippet(_snippet: string): Promise<string> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async postTestCase(_testCase: Partial<TestCase>): Promise<TestCase> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeTestCase(_id: string): Promise<string> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteSnippet(_id: string): Promise<string> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async testSnippet(_testCase: Partial<TestCase>): Promise<TestCaseResult> {
    throw new Error('Not implemented yet');
  }

  async getFileTypes(): Promise<FileType[]> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async modifyFormatRule(_newRules: Rule[]): Promise<Rule[]> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async modifyLintingRule(_newRules: Rule[]): Promise<Rule[]> {
    throw new Error('Not implemented yet');
  }
}