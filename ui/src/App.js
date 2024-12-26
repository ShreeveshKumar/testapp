import React, { useState, useEffect } from 'react';
import Navbar from './components/navbar';
import NotebookTable from './components/NotebookTable';
import { AiOutlineDelete } from "react-icons/ai";
import { FaRegFolder, FaCheck } from "react-icons/fa6";
import { RiResetLeftLine } from "react-icons/ri";
import { PiExportBold } from "react-icons/pi";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Select, Button, Spin, Modal, message, Tooltip } from 'antd';
import * as XLSX from 'xlsx';
import './App.css';

import { API_ENDPOINTS } from './config';

const App = () => {
  // State hooks for managing notebooks, filters, loading state, and type counts
  const [notebooks, setNotebooks] = useState([]); // Full list of notebooks
  const [filteredNotebooks, setFilteredNotebooks] = useState([]); // Filtered list based on user selection
  const [selectedFilters, setSelectedFilters] = useState([]); // Tracks selected filters
  const [loading, setLoading] = useState(true); // Loading state to show spinner
  const [typeCounts, setTypeCounts] = useState({ notebooks: 0, folders: 0, tables: 0 }); // Count of different object types
  const [showEmptyFolders, setShowEmptyFolders] = useState(false); 
  const [whitelistData, setWhitelistData] = useState([]); // State to store whitelist data
  const [showWhitelist, setShowWhitelist] = useState(false);
  function formatDate(item) {
    const date = new Date(item);
    
    // Format the date as yyyy-mm-dd
    const formattedDate = date.toISOString().split('T')[0];
    
    // Extract and format the time
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const formattedTime = date.toLocaleTimeString('en-US', options);
    
    return `${formattedDate} ${formattedTime}`;
  }
  // Function to fetch whitelist data
  const fetchWhitelistData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/${API_ENDPOINTS.GET_WHITELIST_DATA}`); // Replace with your endpoint
      const formattedData = response.data.map((item, index) => ({
        ...item,
        id: index + 1,
        path: item.value,
        dateAdded:  formatDate(item.dateAdded),
        dateExpired: formatDate(item.dateExpired),
      }));
      setWhitelistData(formattedData); // Assuming response.data is an array of objects
      setShowWhitelist(true);
      console.log('Whitelist data:', response.data);
    } catch (error) {
      console.error('Error fetching whitelist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWhitelist = () => {
    if (!showWhitelist) {
      fetchWhitelistData();
    }
    setShowWhitelist((prev) => !prev);
  };

  // Function to filter items with LastModified (case-insensitive) === 'emptyfolders'
  const toggleShowOnlyEmptyFolders = () => {
    if (!showEmptyFolders) {
      const emptyFolders = notebooks.filter(
        (item) => item.LastModified === 'Empty Folder'
      );
      const counts = {
        notebooks: emptyFolders.filter((item) => item.type === 'Notebook').length,
        folders: emptyFolders.filter((item) => item.type === 'Folder').length,
        tables: emptyFolders.filter((item) => item.type === 'Table').length,
      };
      setTypeCounts(counts);
      setFilteredNotebooks(emptyFolders);
    } else {
      // Reset to show all notebooks
      setFilteredNotebooks(notebooks);
      setTypeCounts({ notebooks: 0, folders: 0, tables: 0 }); // Optional, if needed
    }
    setShowEmptyFolders(!showEmptyFolders); // Toggle the state
  };

  const applyFilter = (selectedValues) => {
    let filtered = [];
  
    // If no filters are selected, show all items
    if (selectedValues.length === 0) {
      filtered = notebooks;
    } else {

      if (selectedValues.includes('notebooks')) {
        filtered = filtered.concat(notebooks.filter((item) => item.type === 'Notebook'));
      }
      if (selectedValues.includes('folders')) {
        filtered = filtered.concat(notebooks.filter((item) => item.type === 'Folder'));
      }
      if (selectedValues.includes('tables')) {
        filtered = filtered.concat(notebooks.filter((item) => item.type === 'Table'));
      }
    }
    
    setFilteredNotebooks(filtered); // Update the filtered notebooks
  };
  // Handle quick deletion of empty folders
  const handleQuickDeleteEmptyFolders = async () => {
    const emptyFolders = notebooks.filter(
      (notebook) => notebook.LastModified === 'Empty Folder'
    );
  
    if (emptyFolders.length === 0) {
      message.info('No empty folders to delete.');
      return;
    }
  
    // Using Modal.confirm for user confirmation
    Modal.confirm({
      title: `Are you sure you want to delete all ${emptyFolders.length} empty folder(s)?,
      content: This action will permanently delete the following empty folders: ${emptyFolders.map(
        (folder) => folder.path
      ).join(', ')}`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Loop through and delete each empty folder
          for (let folder of emptyFolders) {
            const response = await axios.post(`http://localhost:3000/${API_ENDPOINTS.DELETE_NOTEBOOK}`, {
              path: folder.path,
            });
  
            if (response.status === 200) {
              message.success(`Deleted empty folder: ${folder.path}`);
            } else {
              message.error(`Failed to delete folder: ${folder.path}`);
            }
          }
  
          // Update state after deletion
          setNotebooks(notebooks.filter((n) => !emptyFolders.includes(n)));
          setFilteredNotebooks(filteredNotebooks.filter((n) => !emptyFolders.includes(n)));
  
          const counts = {
            notebooks: filteredNotebooks.filter((item) => item.type === 'Notebook').length,
            folders: filteredNotebooks.filter((item) => item.type === 'Folder').length,
            tables: filteredNotebooks.filter((item) => item.type === 'Table').length,
          };
          setTypeCounts(counts);
        } catch (error) {
          console.error('Error deleting empty folders:', error);
          message.error('An error occurred while deleting empty folders.');
        }
      },
      onCancel() {
        message.info('Deletion cancelled.');
      },
    });
  };
  

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedFilters([]); // Clear selected filters
    setFilteredNotebooks(notebooks); // Show all notebooks again
    setShowWhitelist(false); // Hide whitelist data
    const counts = {
      notebooks: filteredNotebooks.filter((item) => item.type === 'Notebook').length,
      folders: filteredNotebooks.filter((item) => item.type === 'Folder').length,
      tables: filteredNotebooks.filter((item) => item.type === 'Table').length,
    };
    setShowEmptyFolders(false);
    setTypeCounts(counts);
  };

  // Handle change in selected filter options
  const handleFilterChange = (value) => {
    setSelectedFilters(value);
    applyFilter(value); // Reapply filters whenever selection changes

    const counts = {
      notebooks: filteredNotebooks.filter((item) => item.type === 'Notebook').length,
      folders: filteredNotebooks.filter((item) => item.type === 'Folder').length,
      tables: filteredNotebooks.filter((item) => item.type === 'Table').length,
    };
    setTypeCounts(counts);
  };

  // Handle delete of a specific notebook
  const handleDelete = async (notebook) => {
    Modal.confirm({
      title: `Are you sure you want to delete this ${notebook.type}?`,
      content: `${notebook.type}: ${notebook.path}`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await axios.post(`http://localhost:3000/${API_ENDPOINTS.DELETE_NOTEBOOK}`, {
            path: notebook.path,
          });

          if (response.status === 200) {
            message.success(`${notebook.type} deleted successfully: ${notebook.path}`);
            setNotebooks(notebooks.filter((n) => n.path !== notebook.path));
            setFilteredNotebooks(notebooks.filter((n) => n.path !== notebook.path));
            const counts = {
              notebooks: filteredNotebooks.filter((item) => item.type === 'Notebook').length,
              folders: filteredNotebooks.filter((item) => item.type === 'Folder').length,
              tables: filteredNotebooks.filter((item) => item.type === 'Table').length,
            };
            setTypeCounts(counts);
          } else {
            throw new Error(response.statusText || 'Unknown error occurred');
          }
        } catch (error) {
          console.error('Error deleting notebook:', error);
          message.error(`Failed to delete ${notebook.type}. Error: ${error.response.data.message}`);
        }
      },
    });
  };

  // Handle adding a notebook to the whitelist
  const handleWhitelist = async (notebook) => {
    try {
      const response = await axios.post(`http://localhost:3000/${API_ENDPOINTS.WHITELIST_NOTEBOOK}`, {
        path: notebook.path,
      });

      if (response.status === 201 || response.status === 200) {
        // Remove the notebook from the list after whitelisting
        setNotebooks(notebooks.filter((n) => n.path !== notebook.path));
        setFilteredNotebooks(notebooks.filter((n) => n.path !== notebook.path));
        toast.success(`${notebook.type} whitelisted successfully`);

        const counts = {
          notebooks: filteredNotebooks.filter((item) => item.type === 'Notebook').length,
          folders: filteredNotebooks.filter((item) => item.type === 'Folder').length,
          tables: filteredNotebooks.filter((item) => item.type === 'Table').length,
        };
        setTypeCounts(counts);

      } else {
        console.error('Failed to whitelist notebook:', response.data);
        toast.error(`Failed to whitelist notebook. Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error whitelisting notebook:', error);
      toast.error(`Failed to whitelist notebook. Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Export filtered notebooks to an Excel file
  const exportToExcel = () => {
    // Format notebooks data for Excel export
    const formattedNotebooks = filteredNotebooks.map((notebook, index) => ({
      'Sr. No': index + 1,
      'Object Path': notebook.path,
      'Last Modified': notebook.LastModified,
      'Type': notebook.type,
    }));

    // Create and export Excel file
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedNotebooks);
    XLSX.utils.book_append_sheet(wb, ws, 'Objects');
    XLSX.writeFile(wb, 'Unused_ADB_Objects.xlsx');
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.global = window.global || {};
    }
  }, []);
  // Fetch the list of notebooks on component mount
  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        setLoading(true); // Show loading spinner while fetching data
        const response = await axios.get(`http://localhost:3000/${API_ENDPOINTS.FETCH_NOTEBOOKS}`);
        const sortedData = response.data.sort((a, b) => {
          const order = ['Folder', 'Notebook', 'Table']; // Define the desired order
          return order.indexOf(a.type) - order.indexOf(b.type);
        });

        setShowEmptyFolders(false); // Set the sorted data

        // Set the sorted data
        setNotebooks(sortedData);
        setFilteredNotebooks(sortedData); // Initially show all notebooks
    
        // Calculate the type counts (Notebooks, Folders, Tables)
        const counts = {
          notebooks: sortedData.filter((item) => item.type === 'Notebook').length,
          folders: sortedData.filter((item) => item.type === 'Folder').length,
          tables: sortedData.filter((item) => item.type === 'Table').length,
        };
        setTypeCounts(counts);
      } catch (error) {
        console.error('Error fetching notebooks:', error);
      } finally {
        setLoading(false); // Hide loading spinner
      }
    };

    fetchNotebooks(); // Call the function to fetch notebooks
  }, []); // Empty dependency array ensures this runs once on mount


  return (
    <div className="app-container">
      <ToastContainer />
      <Navbar/>
      <div className="app">
        <div className="intro-text" style={{ padding: '0px'}}>
              {/* Filter by type using dropdown */}
              <div className="filter-container">
                <div className="filter-section">
                  <label>Filter by Type</label>
                  <Select
                    mode="multiple"
                    style={{ width: '200px' }}
                    className="filter-select"
                    placeholder="Select Type to filter"
                    options={[
                      { label: 'Notebooks', value: 'notebooks' },
                      { label: 'Folders', value: 'folders' },
                      { label: 'Tables', value: 'tables' },
                    ]}
                    value={selectedFilters}
                    onChange={handleFilterChange}
                    showSearch={false}
                  />
                  <Button
                    type="default"
                    onClick={handleResetFilters}
                    style={{ marginLeft: '10px' }}
                    title="Reset Filters"
                  >
                    <Tooltip title="Reset all filters">
                      <RiResetLeftLine />
                    </Tooltip>
                  </Button>
                  </div>
                <div className="filter-actions">
                  <div className="filter-buttons">
                    <button className="custom-button" onClick={toggleShowOnlyEmptyFolders}>
                      <FaRegFolder/>Show {showEmptyFolders? "All Objects":"Empty Folders" }
                    </button>
                    <button className="custom-button" onClick={toggleWhitelist}>
                      <FaCheck/>Show {showWhitelist? "Unused": "Whitelisted"} Objects
                    </button>
                    <button 
                      className="custom-button"
                      onClick={handleQuickDeleteEmptyFolders}>
                      <AiOutlineDelete/>Delete Empty Folders
                    </button>
                  </div>
                  <div className="export-container">
                    <Button
                      type="primary"
                      onClick={exportToExcel}
                      style={{ background: '#ebebeb', border: "2px solid gray", color: "black" }}
                    >
                      <PiExportBold/>Export to Excel
                    </Button>
                  </div>
                </div>
              </div>
              <div className="type-counts" style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p><strong>Total Objects:</strong> {notebooks.length}</p>
                    <p><strong>Notebooks:</strong> {typeCounts.notebooks}</p>
                    <p><strong>Folders:</strong> {typeCounts.folders}</p>
                    <p><strong>Tables:</strong> {typeCounts.tables}</p>
                  </div>
        
        {/* Show loading spinner when fetching notebooks */}
        {loading ? (
          <div className="loading-spinner" style={{ textAlign: 'center', marginTop: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
            <main className="app-content">
              {/* Actions to show and delete empty folders */}
              {!showWhitelist ? (
              <header className="app-header">
                <h1>Unused ADB Objects</h1>
                <p style={{color:"black"}}>Search Objects Paths.</p>
              </header>) : ( "" )}
              {/* Check if showWhitelist is true */}
              {showWhitelist ? (
                whitelistData.length > 0 ? (
                  <div className="table-container">
                    <h2>Whitelisted Objects</h2>
                    <table className="whitelist-table">
              <thead>
                <tr>
                  <th>Sr. No</th>
                  <th>Object Path</th>
                  <th>Date Added</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {whitelistData.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.value}</td>
                    <td>{item.dateAdded}</td>
                    <td>{item.dateExpired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '16px', color: 'green' }}>
            No whitelisted objects found
          </div>
        )
      ) : (
        filteredNotebooks.length > 0 ? (
          <NotebookTable
            notebooks={filteredNotebooks}
            onDelete={handleDelete}
            onWhitelist={handleWhitelist}
          />
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '16px', color: 'red' }}>
            No objects found
          </div>
        )
      )}
            </main>)}
        </div>
      </div>
    </div>
)
}
export default App;