export type TestCase = {
    id: string;
    name: string;
    input?: string[];
    output?: string[];
    status?: 'PENDING' | 'PASS' | 'FAIL';
};
