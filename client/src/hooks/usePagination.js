import { useState } from 'react';
export const usePagination = (initialPage = 1, initialLimit = 20) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const reset = () => setPage(1);
  return { page, limit, setPage, setLimit, reset };
};
