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
      content: '',
      language: s.language,
      extension: 'ps',
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
            description: '',
            language: createSnippet.language,
            version: '1.1'
        };
        formData.append('data', new Blob([JSON.stringify(snippetData)], { type: 'application/json' }));

        formData.append('content', createSnippet.content);

        const response = await this.client.post<{
            id: string;
            userId: string;
            name: string;
            description: string;
            language: string;
            version: string;
            contentReference: string;
        }>('/snippets-management/editor', formData);

        const data = response.data;

        return {
            id: data.id,
            name: data.name,
            content: createSnippet.content,
            language: data.language,
            extension: 'ps',
            compliance: 'pending' as const,
            author: data.userId,
        };
    }



    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getSnippetById(id: string): Promise<Snippet & { tests: TestCase[] }> {
        const response = await this.client.get(`/snippets-management/${id}`);
        const data = response.data;

        return {
            id: data.snippet.id,
            name: data.snippet.name,
            content: data.snippet.content,
            language: data.snippet.language,
            extension: data.snippet.extension,
            compliance: data.snippet.lintStatus,
            author: data.snippet.userId,
            tests: data.tests.map((t: any) => ({
                id: t.id,
                name: t.name,
                input: t.inputs ?? [],
                output: t.expectedOutputs ?? []
            }))
        };
    }



    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
        const formData = new FormData();
        formData.append(
            'content',
            new Blob([updateSnippet.content], { type: 'text/plain' }),
            'snippet.ps'
        );

        const res = await this.client.patch(`/snippets-management/${id}/content`, formData);

        return {
            id: res.data.id,
            name: res.data.name,
            content: updateSnippet.content,
            language: res.data.language,
            extension: 'ps',
            compliance: 'pending',
            author: res.data.userId,
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
        try {
            const allSnippets = await this.listSnippetDescriptors(0, 1000);

            const testCasesArrays = await Promise.all(
                allSnippets.snippets.map(async (snippet) => {
                    const response = await this.client.get(`/snippets-management/${snippet.id}`);
                    const tests = response.data.tests ?? [];

                    return tests.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        input: t.inputs ?? [],
                        output: t.expectedOutputs ?? []
                    })) as TestCase[];
                })
            );

            return testCasesArrays.flat();
        } catch (err) {
            console.error('Error fetching test cases:', err);
            return [];
        }
    }




    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async formatSnippet(_snippet: string): Promise<string> {
    throw new Error('Not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async postTestCase(testCase: Partial<TestCase>): Promise<TestCase> {
        const all = await this.listSnippetDescriptors(0, 9999);

        let snippetId: string | undefined;

        for (const s of all.snippets) {
            const full = await this.getSnippetById(s.id);

            if (full.id === testCase.id) {
            }

            if (full.tests.some(t => t.id === testCase.id)) {
                snippetId = s.id;
                break;
            }
        }

        if (!snippetId) {
            throw new Error("Cannot determine snippetId for this test case");
        }

        const response = await this.client.post(
            `/snippets-test/${snippetId}/tests`,
            {
                name: testCase.name,
                inputs: testCase.input ?? [],
                expectedOutputs: testCase.output ?? []
            }
        );

        const data = response.data;

        return {
            id: data.id,
            name: data.name,
            input: data.inputs,
            output: data.expectedOutputs
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async removeTestCase(id: string): Promise<string> {
        const all = await this.listSnippetDescriptors(0, 9999);

        let snippetId: string | undefined;

        for (const s of all.snippets) {
            const full = await this.getSnippetById(s.id);

            if (full.tests.some(t => t.id === id)) {
                snippetId = s.id;
                break;
            }
        }

        if (!snippetId) {
            throw new Error(`Test case ${id} not found in any snippet`);
        }

        await this.client.delete(`/snippets-test/${snippetId}/tests/${id}`);

        return id;
    }



    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async deleteSnippet(id: string): Promise<string> {
        await this.client.delete(`/snippets-management/${id}`);
        return id;
    }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async testSnippet(testCase: Partial<TestCase>): Promise<TestCaseResult> {
        const all = await this.listSnippetDescriptors(0, 9999);

        let snippetId: string | undefined;

        for (const s of all.snippets) {
            const full = await this.getSnippetById(s.id);
            if (full.tests.some(t => t.id === testCase.id)) {
                snippetId = s.id;
                break;
            }
        }

        if (!snippetId) {
            throw new Error(`Cannot find snippet for test ${testCase.id}`);
        }

        const response = await this.client.post(
            `/snippets-test/${snippetId}/tests/${testCase.id}/run`
        );

        const data = response.data;

        return data.valid ? "success" : "fail";
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