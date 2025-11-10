import axios, { AxiosInstance } from 'axios';
import { SnippetOperations } from './snippetOperations';
import { CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet } from './snippet';
import { PaginatedUsers } from './users';
import { TestCase } from '../types/TestCase';
import { TestCaseResult } from './queries';
import { FileType } from '../types/FileType';
import { Rule } from '../types/Rule';
import { SnippetResponse } from '../types/SnippetResponse';
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
      content: SnippetResponse[];
      page: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    }>('/snippets-management', { params });

    const data = response.data;

    const snippets = data.content.map((s) => ({
      id: s.id,
      name: s.name,
      content: s.content, // TODO: If content is never used, remove from backend dto for efficiency
      language: s.language,
      extension: s.extension,
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

  async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    const formData = new FormData();

    const snippetData = {
      name: createSnippet.name,
      description: '', // UI doesn't have description field yet
      language: createSnippet.language,
      version: createSnippet.version
    };
    formData.append('data', new Blob([JSON.stringify(snippetData)], { type: 'application/json' }));

    formData.append('content', createSnippet.content);

    const response = await this.client.post<SnippetResponse>('/snippets-management/editor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;

    return {
      id: data.id,
      name: data.name,
      content: data.content,
      language: data.language,
      extension: data.extension,
      compliance: 'pending' as const, // TODO
      author: data.userId,
    };
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    try {
      const response = await this.client.get<SnippetResponse>(`/snippets-management/${id}`);

      const data = response.data;

      return {
        id: data.id,
        name: data.name,
        content: data.content,
        language: data.language,
        extension: data.extension,
        compliance: 'pending' as const, // TODO
        author: data.userId,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
    const formData = new FormData();
    formData.append('content', updateSnippet.content);

    const response = await this.client.patch<SnippetResponse>(`/snippets-management/${id}/content`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;

    return {
      id: data.id,
      name: data.name,
      content: data.content,
      language: data.language,
      extension: data.extension,
      compliance: 'pending' as const, // TODO
      author: data.userId,
    };
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

  async deleteSnippet(id: string): Promise<string> {
    await this.client.delete(`/snippets-management/${id}`);
    return id;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async testSnippet(_testCase: Partial<TestCase>): Promise<TestCaseResult> {
    throw new Error('Not implemented yet');
  }

  async getFileTypes(): Promise<FileType[]> {
    const response = await this.client.get<FileType[]>('/snippets-management/config/filetypes');

    return response.data;
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