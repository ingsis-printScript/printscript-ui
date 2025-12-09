import {useMutation, UseMutationResult, useQuery} from 'react-query';
import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from '../types/snippet.ts';
import {SnippetOperations} from "./snippetOperations.ts";
import {PaginatedUsers} from "../types/users.ts";
import {ApiSnippetOperations} from "./ApiSnippetOperations.ts";
import {TestCase} from "../types/TestCase.ts";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";
import {useAuth0} from "@auth0/auth0-react";
import {useEffect} from "react";
import { RelationshipType } from "../types/Relationship.ts";


export const useSnippetsOperations = () => {
  const {getAccessTokenSilently} = useAuth0()

  useEffect(() => {
      getAccessTokenSilently()
          .then(token => {
              console.log(token)
          })
          .catch(error => console.error(error));
  });

  const snippetOperations: SnippetOperations = new ApiSnippetOperations(getAccessTokenSilently);

  return snippetOperations
}

export const useGetSnippets = (
            page: number = 0, pageSize: number = 10,
            snippetName?: string, language?: string, lintStatus?: string,
            sortBy?: string, sortOrder?: string, relationshipType: RelationshipType = "both"
  ) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<PaginatedSnippets, 
                  Error>(['listSnippets', page,pageSize,snippetName,language,lintStatus,sortBy,sortOrder, relationshipType], () =>
                            snippetOperations.listSnippetDescriptors(page, pageSize,snippetName,language,lintStatus,sortBy,sortOrder, relationshipType));
};

export const useGetSnippetById = (id: string) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Snippet | undefined, Error>(['snippet', id], () => snippetOperations.getSnippetById(id), {
    enabled: !!id, // This query will not execute until the id is provided
  });
};

export const useCreateSnippet = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, CreateSnippet> => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, CreateSnippet>(createSnippet => snippetOperations.createSnippet(createSnippet), {onSuccess});
};

export const useUpdateSnippetById = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, {
  id: string;
  updateSnippet: UpdateSnippet
}> => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, { id: string; updateSnippet: UpdateSnippet }>(
      ({id, updateSnippet}) => snippetOperations.updateSnippetById(id, updateSnippet),{
        onSuccess,
    }
  );
};

export const useGetUsers = (name: string = "", page: number = 0, pageSize: number = 10) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<PaginatedUsers, Error>(['users',name,page,pageSize], () => snippetOperations.getUserFriends(name,page, pageSize));
};

export const useShareSnippet = () => {
  const snippetOperations = useSnippetsOperations()

    return useMutation<
        void,
        Error,
        { snippetId: string; userId: string; permissions: { read: boolean; write: boolean } }
    >(({ snippetId, userId, permissions }) =>
        snippetOperations.shareSnippet(snippetId, userId, permissions)
    );
};


export const useGetTestCases = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<TestCase[] | undefined, Error>(['testCases', snippetId], () => snippetOperations.getTestCases(snippetId), {
    enabled: !!snippetId
  });
};


export const usePostTestCase = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<TestCase, Error, { snippetId: string; testCase: Partial<TestCase> }>(
      ({ snippetId, testCase }) => snippetOperations.postTestCase(snippetId, testCase),
      { onSuccess }
  );
};


export const useUpdateTestCase = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<TestCase, Error, { snippetId: string; testCase: Partial<TestCase> }>(
      ({ snippetId, testCase }) => snippetOperations.updateTestCase(snippetId, testCase.id!, testCase),
      { onSuccess }
  );
};


export const useRemoveTestCase = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<string, Error, { snippetId: string; testId: string }>(
      ({ snippetId, testId }) => snippetOperations.removeTestCase(snippetId, testId),
      {
        onSuccess,
      }
  );
};

export type TestCaseResult = "success" | "fail"

export const useTestSnippet = ({onSuccess}: {onSuccess?: (variables: { snippetId: string; testId: string }) => void} = {}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<TestCaseResult, Error, { snippetId: string; testId: string }>(
      ({ snippetId, testId }) => snippetOperations.testSnippet(snippetId, testId),
      {
        onSuccess: (_, variables) => {
          onSuccess?.(variables)
        }
      }
  )
}



export const useGetFormatRules = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Rule[], Error>('formatRules', () => snippetOperations.getFormatRules());
}

export const useModifyFormatRules = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Rule[], Error, Rule[]>(
      rule => snippetOperations.modifyFormatRule(rule),
      {onSuccess}
  );
}


export const useGetLintingRules = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Rule[], Error>('lintingRules', () => snippetOperations.getLintingRules());
}


export const useModifyLintingRules = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Rule[], Error, Rule[]>(
      rule => snippetOperations.modifyLintingRule(rule),
      {onSuccess}
  );
}

export const useFormatSnippet = () => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<string, Error, { snippetId: string; code: string }>(
      ({ snippetId, code }) => snippetOperations.formatSnippet(snippetId, code)
  );
}

export const useDeleteSnippet = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<string, Error, string>(
      id => snippetOperations.deleteSnippet(id),
      {
        onSuccess,
      }
  );
}

export const useGetFileTypes = () => {
  const snippetOperations = useSnippetsOperations()
  const {isAuthenticated} = useAuth0()

  return useQuery<FileType[], Error>('fileTypes', () => snippetOperations.getFileTypes(), {
    enabled: isAuthenticated
  });
}
