import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function PackagePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalItems <= 0) return null;

  // Generate page numbers window (up to 5 buttons)
  const pageNumbers = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        marginTop: '1.75rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--color-outline-variant)',
      }}
    >
      {/* Page Navigation & Page Numbers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          className="btn-ink"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
          aria-label="Go to first page"
          style={{ padding: '0.35rem 0.5rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronsLeft size={15} />
        </button>
        <button
          type="button"
          className="btn-ink"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
          aria-label="Go to previous page"
          style={{ padding: '0.35rem 0.5rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page Number Buttons */}
        {pageNumbers.map((pNum) => (
          <button
            key={`page-${pNum}`}
            type="button"
            className={`btn-ink ${currentPage === pNum ? 'btn-ink-primary' : ''}`}
            onClick={() => onPageChange(pNum)}
            aria-label={`Go to page ${pNum}`}
            aria-current={currentPage === pNum ? 'page' : undefined}
            style={{ minWidth: '34px', padding: '0.35rem 0.6rem', textAlign: 'center', justifyContent: 'center' }}
          >
            {pNum}
          </button>
        ))}

        <button
          type="button"
          className="btn-ink"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next Page"
          aria-label="Go to next page"
          style={{ padding: '0.35rem 0.5rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          className="btn-ink"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
          aria-label="Go to last page"
          style={{ padding: '0.35rem 0.5rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronsRight size={15} />
        </button>
      </div>

      {/* Ledger Status & Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
        <span>
          Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{totalItems}</strong> packages
        </span>
        <span>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>Show:</span>
          <div style={{ display: 'flex', border: '1px solid var(--color-primary)' }}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={`size-${size}`}
                type="button"
                className={`btn-ink ${pageSize === size ? 'btn-ink-primary' : ''}`}
                onClick={() => onPageSizeChange(size)}
                aria-label={`Show ${size} packages per page`}
                style={{ border: 'none', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
              >
                {size}
              </button>
            ))}
          </div>
          <span>per page</span>
        </div>
      </div>
    </div>
  );
}
