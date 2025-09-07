import React, { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ReactPaginate from 'react-paginate';

// // Example items, to simulate fetching from another resources.
// const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// function Items({ currentItems }: { currentItems: any[] }) {
//   return (
//     <>
//       {currentItems &&
//         currentItems.map((item, i) => (
//           <div key={i}>
//             <h3>Item #{item}</h3>
//           </div>
//         ))}
//     </>
//   );
// }

const Prev = () => (
  <span className="flex items-center justify-center gap-2">
    <FiChevronLeft size={20} /> Previous
  </span>
);
const Next = () => (
  <span className="flex items-center justify-center gap-2">
    Next <FiChevronRight size={20} />
  </span>
);

const PaginatedItems = ({
  itemsPerPage,
  totalItems,
  onPageChange,
}: {
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) => {
  // We start with an empty list of items.
  // const [currentItems, setCurrentItems]: [
  //   currentItems: any[],
  //   setCurrentItems: any
  // ] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  // Here we use item offsets; we could also use page offsets
  // following the API or data you're working with.
  const [itemOffset, setItemOffset] = useState(0);

  useEffect(() => {
    // Fetch items from another resources.
    // const endOffset = itemOffset + itemsPerPage;
    // console.log(`Loading items from ${itemOffset} to ${endOffset}`);
    //setCurrentItems(items.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(totalItems / itemsPerPage));
  }, [itemOffset, itemsPerPage, totalItems]);

  // Invoke when user click to request another page.
  const handlePageClick = (event: any) => {
    const newOffset = (event.selected * itemsPerPage) % totalItems;
    // console.log(
    //   `User requested page number ${event.selected}, which is offset ${newOffset}`
    // );
    setItemOffset(newOffset);
    onPageChange(event.selected + 1);
  };
  const linkClassName =
    'py-2 text-col-text flex px-3 duration-300 hover:bg-secondary hover:text-white hover:border-transparent border shadow-md border-slate-600 text-col-text rounded';

  return (
    <>
      <ReactPaginate
        breakLabel="..."
        nextLabel={<Next />}
        onPageChange={handlePageClick}
        pageRangeDisplayed={3}
        marginPagesDisplayed={3}
        pageCount={pageCount}
        previousLabel={<Prev />}
        containerClassName="flex gap-3"
        pageLinkClassName={linkClassName}
        activeLinkClassName="bg-secondary text-white border-transparent"
        previousLinkClassName={linkClassName}
        nextLinkClassName={linkClassName}
        disabledLinkClassName="opacity-50 cursor-default pointer-events-none"
        renderOnZeroPageCount={() => null}
      />
    </>
  );
};

export default PaginatedItems;
