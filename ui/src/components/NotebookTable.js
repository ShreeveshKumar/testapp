import React, { useState } from 'react';
import { FaTrashAlt, FaCheck, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import './NotebookTable.css';

// Access environment variables
const databricksHost = process.env.REACT_APP_DATABRICKS_HOST;

const NotebookTable = ({ notebooks, onDelete, onWhitelist }) => {
  // State to manage pagination, sorting, search, and selected notebooks
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const itemsPerPage = 5; // Number of items to display per page
  const pageSize = 5;

  // State to manage sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null }); // Sorting configuration
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering notebooks
  const [selectedNotebooks, setSelectedNotebooks] = useState([]); // State for selected notebooks (checkboxes)

  // Calculate total pages based on the number of notebooks and items per page
  const totalPages = Math.ceil(notebooks.length / itemsPerPage);

  // Filter notebooks based on the search query (case-insensitive search on path)
  const filteredNotebooks = notebooks.filter((notebook) =>
    notebook.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get notebooks for the current page and apply sorting
  const currentNotebooks = filteredNotebooks
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) // Slice to get only the current page items
    .sort((a, b) => {
      if (!sortConfig.key) return 0; // If no sorting key, return no sorting
      const key = sortConfig.key; // Get the key to sort by
      const order = sortConfig.direction === 'asc' ? 1 : -1; // Determine sorting direction

      // Sorting logic based on the type of the field (string or number)
      if (typeof a[key] === 'string') {
        return a[key].localeCompare(b[key]) * order;
      }
      if (typeof a[key] === 'number') {
        return (a[key] - b[key]) * order;
      }
      return 0; // No sorting if the field type is unknown
    });

  // Handle sorting when a column header is clicked
  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      const newDirection =
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'; // Toggle direction if sorting by the same column
      return { key, direction: newDirection };
    });
  };
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  // Handle the "Previous" button click for pagination
  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1); // Decrease page if not on the first page
  };

  // Handle the "Next" button click for pagination
  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1); // Increase page if not on the last page
  };

  // Handle selecting a single notebook (checkbox click)
  const handleSelect = (notebookId) => {
    setSelectedNotebooks((prevSelected) =>
      prevSelected.includes(notebookId)
        ? prevSelected.filter((id) => id !== notebookId) // Unselect if already selected
        : [...prevSelected, notebookId] // Add to selected if not selected
    );
  };

  // Handle "Select All" checkbox for the current page
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = currentNotebooks.map((notebook) => notebook.id); // Get all notebook IDs for the current page
      setSelectedNotebooks(allIds); // Select all notebooks
    } else {
      setSelectedNotebooks([]); // Unselect all if unchecked
    }
  };

  // Handle deleting all selected notebooks
  const handleDeleteAll = () => {
    if (selectedNotebooks.length > 0) {
      // For each selected notebook, call the onDelete callback
      selectedNotebooks.forEach((notebookId) => {
        const notebook = notebooks.find((n) => n.id === notebookId); // Find the notebook by ID
        if (notebook) onDelete(notebook); // Call onDelete for each notebook
      });
      setSelectedNotebooks([]); // Clear selected notebooks after deletion
    }
  };

  const handleWhiteListAll = () => {
    if (selectedNotebooks.length > 0) {
      // For each selected notebook, call the onWhitelistAll callback
      selectedNotebooks.forEach((notebookId) => {
        const notebook = notebooks.find((n) => n.id === notebookId); // Find the notebook by ID
        if (notebook) onWhitelist(notebook); // Call onWhitelist for each notebook
      });
      setSelectedNotebooks([]); // Clear selected notebooks after deletion
    }
  };

  return (
    <div className="notebook-table" >
      {/* Search Bar for filtering notebooks */}
      <div className='search-bar-container'>
      <div className="search-bar">
        <input
          className='search-input'
          id="search"
          type="text"
          placeholder="Type to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // Update search query on change
          style={{
            width: '80%',       // 80% of the parent container
            maxWidth: '400px', // Optional: Set a maximum width
            padding: '8px',     // Add padding for better appearance
            fontSize: '14px'    // Optional: Adjust font size for readability
          }}
        />
      </div>


      {/* Delete All Button (visible when some notebooks are selected) */}
      {selectedNotebooks.length > 0 && (
        <div className="delete-all">
          <button
            onClick={handleDeleteAll} // Trigger delete for selected notebooks
            className="delete-all-button"
            title="Delete Selected Objects"
          >
            <FaTrashAlt /> {/* Trash icon for delete */}
          </button>
          <button
            onClick={handleWhiteListAll} // Trigger delete for selected notebooks
            className="whitelist-all-button"
            title="Whitelist Selected Objects"
          >
            <FaCheck />
          </button>
        </div>
      )}
      </div>
      {/* Table for displaying notebooks */}
      <table>
        <thead>
          <tr>
            {/* Select All checkbox */}
            <th>
              <input
                type="checkbox"
                onChange={(e) => handleSelectAll(e.target.checked)} // Trigger handleSelectAll on change
                checked={currentNotebooks.length > 0 && currentNotebooks.every((notebook) => selectedNotebooks.includes(notebook.id))} // Check if all notebooks are selected
              />
            </th>
            {/* Table headers with sorting functionality */}
            <th>Sr. No</th>
            <th
              className={sortConfig.key === 'path' ? 'highlighted-column' : ''}
              style={{textAlign: 'center'}}
            >
              Object Path
              <button
                onClick={() => handleSort('path')}
                className="sort-button"
                aria-label="Sort by Object Path"
              >
                {sortConfig.key === 'path' ? (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                ) : (
                  <FaSort />
                )}
              </button>
            </th>

            <th
              className={sortConfig.key === 'LastModified' ? 'highlighted-column' : ''}
            >
              Last Modified
              <button
                onClick={() => handleSort('LastModified')}
                className="sort-button"
                aria-label="Sort by Last Modified"
              >
                {sortConfig.key === 'LastModified' ? (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                ) : (
                  <FaSort />
                )}
              </button>
            </th>

            <th
              className={sortConfig.key === 'type' ? 'highlighted-column' : ''}
            >
              Type
              <button
                onClick={() => handleSort('type')}
                className="sort-button"
                aria-label="Sort by Type"
              >
                {sortConfig.key === 'type' ? (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                ) : (
                  <FaSort />
                )}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Map through notebooks for the current page and display each row */}
          {currentNotebooks.map((notebook, index) => (
            <tr
              key={`${notebook.id}-${index}`} // Unique key for each row
            >
              {/* Checkbox for each notebook */}
              <td>
                <input
                  type="checkbox"
                  className='notebook-checkbox'
                  checked={selectedNotebooks.includes(notebook.id)} // Check if the notebook is selected
                  onChange={() => handleSelect(notebook.id)} // Trigger handleSelect on change
                />
              </td>
              <td>{(currentPage - 1) * itemsPerPage + index + 1}</td> {/* Display the serial number */}
              <td className="notebook-path">
                <a 
                  href={
                    notebook.type.toLowerCase() === "folder" 
                    ? `${databricksHost}/browse/folders/${notebook.id}`
                    : notebook.type.toLowerCase() === "notebook" 
                    ? `${databricksHost}/editor/notebooks/${notebook.id}` 
                    : ``
                  } 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title={notebook.path}
                >
                  {notebook.path} {/* Display the path as a link */}
                </a>
              </td>

              <td>{notebook.LastModified}</td> {/* Display the last modified date */}
              <td className={`type-${notebook.type.toLowerCase()}`}>{notebook.type}</td> {/* Display the notebook type */}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div className="pagination">
        {/* Previous Button */}
        <button 
          onClick={handlePrev} 
          disabled={currentPage === 1} 
          className={currentPage === 1 ? "disabled" : ""}
        >
          &#60;
        </button>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;
          // Show first 2 pages, last 2 pages, and pages near the current page
          if (
            page === 1 || 
            page === 2 || 
            page === totalPages || 
            page === totalPages - 1 || 
            Math.abs(currentPage - page) <= 1
          ) {
            return (
              <button 
                key={page}
                onClick={() => handlePageClick(page)}
                className={currentPage === page ? "active" : ""}
              >
                {page}
              </button>
            );
          } else if (Math.abs(currentPage - page) === 2) {
            return <span key={`ellipsis-${page}`} className="ellipsis">...</span>;
          }
          return null;
        })}

        {/* Next Button */}
        <button 
          onClick={handleNext} 
          disabled={currentPage === totalPages} 
          className={currentPage === totalPages ? "disabled" : ""}
        >
          &#62;
        </button>
      </div>



      {/* Summary showing objects on the current page */}
      <div className="summary">
        Showing {Math.min(pageSize, filteredNotebooks.length - (currentPage - 1) * pageSize)} of {filteredNotebooks.length} objects
      </div>

    </div>
  );
};

export default NotebookTable;
