import {Pagination} from "./pagination.ts";

export type PaginatedUsers = Pagination & {
  users: User[]
}

export type User = {
  name: string,
  id: string
}

type BackendUser = {
    id: string;
    displayName: string;
    email: string;
};

export type BackendPaginatedUsers = {
    users: BackendUser[];
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
};
