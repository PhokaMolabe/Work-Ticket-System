export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
}

export const getPagination = (rawPage?: string, rawPageSize?: string): Pagination => {
  const page = Math.max(1, Number(rawPage || 1));
  const pageSize = Math.min(100, Math.max(1, Number(rawPageSize || 10)));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize
  };
};
