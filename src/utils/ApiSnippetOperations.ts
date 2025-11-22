import axios, { AxiosInstance } from 'axios';
import { SnippetOperations } from './snippetOperations';
import { ComplianceEnum, CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet } from './snippet';
import { PaginatedUsers } from './users';
import { TestCase } from '../types/TestCase';
import { TestCaseResult } from './queries';
import { FileType } from '../types/FileType';
import { Rule } from '../types/Rule';
import { LintStatus, SnippetResponse } from '../types/SnippetResponse';
import autoBind from 'auto-bind';

const API_URL = import.meta.env.VITE_API_URL || '/api/snippet-service';

// Helper function to map backend LintStatus to frontend ComplianceEnum
function mapLintStatusToCompliance(lintStatus: LintStatus): ComplianceEnum {
  switch (lintStatus) {
    case 'PENDING':
      return 'pending';
    case 'COMPLIANT':
      return 'compliant';
    case 'NON_COMPLIANT':
      return 'not-compliant';
    case 'FAILED':
      return 'failed';
  }
}

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

  async listSnippetDescriptors(page: number, pageSize: number, snippetName?: string, language?: string, lintStatus?: string): Promise<PaginatedSnippets> {
    const params: Record<string, string | number> = { page, pageSize };
    if (snippetName) {
      params.name = snippetName;
    }
    if (language) {
      params.language = language;
    }
    if (lintStatus) {
      params.lintStatus = lintStatus;
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
      description: s.description ?? '',
      content: s.content,
      language: s.language,
      extension: s.extension,
      version: s.version,
      compliance: mapLintStatusToCompliance(s.lintStatus),
      author: s.userId,
      lintErrors: s.lintErrors ?? undefined,
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
      description: createSnippet.description,
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
      description: data.description ?? '',
      content: data.content,
      language: data.language,
      extension: data.extension,
      version: data.version,
      compliance: mapLintStatusToCompliance(data.lintStatus),
      author: data.userId,
      lintErrors: data.lintErrors ?? undefined,
    };
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    try {
      const response = await this.client.get<SnippetResponse>(`/snippets-management/${id}`);

      const data = response.data;

      return {
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        content: data.content,
        language: data.language,
        extension: data.extension,
        version: data.version,
        compliance: mapLintStatusToCompliance(data.lintStatus),
        author: data.userId,
        lintErrors: data.lintErrors ?? undefined,
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

    const hasMetadataChanges = updateSnippet.name !== undefined ||
                                updateSnippet.description !== undefined ||
                                updateSnippet.language !== undefined ||
                                updateSnippet.version !== undefined;

    let response: { data: SnippetResponse };

    if (hasMetadataChanges) { // metadata update from modal - all fields present
      const snippetData = {
        name: updateSnippet.name,
        description: updateSnippet.description,
        language: updateSnippet.language,
        version: updateSnippet.version
      };
      formData.append('data', new Blob([JSON.stringify(snippetData)], { type: 'application/json' }));
      formData.append('content', updateSnippet.content);

      response = await this.client.put<SnippetResponse>(`/snippets-management/${id}/editor`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else { // content-only update from inline editor
      formData.append('content', updateSnippet.content);

      response = await this.client.patch<SnippetResponse>(`/snippets-management/${id}/content`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    const data = response.data;

    return {
      id: data.id,
      name: data.name,
      description: data.description ?? '',
      content: data.content,
      language: data.language,
      extension: data.extension,
      version: data.version,
      compliance: mapLintStatusToCompliance(data.lintStatus),
      author: data.userId,
      lintErrors: data.lintErrors ?? undefined,
    };
  }

  async deleteSnippet(id: string): Promise<string> {
      await this.client.delete(`/snippets-management/${id}`);
      return id;
  }

  async getFormatRules(): Promise<Rule[]> {
    const response = await this.client.get<Rule[]>('/formatter');
    return response.data;
  }

  async getLintingRules(): Promise<Rule[]> {
    const response = await this.client.get<Rule[]>('/linter');
    return response.data;
  }

  async modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
      const response = await this.client.put<Rule[]>('/formatter/rules', newRules);
      return response.data;
  }

  async modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
      const response = await this.client.put<Rule[]>('/linter/rules', newRules);
      return response.data;
  }

  async formatSnippet(snippetId: string, code: string): Promise<string> {
      const response = await this.client.post<{ code: string }>(
          '/formatter/format',
          { snippetId, code } // TODO: ver si paso snippetId o version directo (id feels cleaner but is less efficient)
      );
      return response.data.code;
  }

  async getTestCases(): Promise<TestCase[]> {
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
  async testSnippet(_testCase: Partial<TestCase>): Promise<TestCaseResult> {
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

  async getFileTypes(): Promise<FileType[]> {
      const response =
          await this.client.get<FileType[]>('/snippets-management/config/filetypes');

      return response.data;
  }
}