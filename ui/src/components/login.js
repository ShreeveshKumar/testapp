import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {toast} from 'react-toastify';
import Navbar from './navbar';
import './login.css';

const WorkspaceCleanerLogin = () => {
  const databricksHostRef = useRef(null);
  const accessTokenRef = useRef(null);
  const warehouseIdRef = useRef(null);
  const thresholdTimeRef = useRef(null);
  const whitelistTime = useRef(null);
  // const pocEmailRef = useRef(null);
  // const whitelistPathRef = useRef(null);
  const navigate = useNavigate();

  const storeData = async () => {
    const inputData = {
      DATABRICKS_HOST: databricksHostRef.current.value,
      DATABRICKS_TOKEN: accessTokenRef.current.value,
      WAREHOUSE_ID: warehouseIdRef.current.value,
      THRESHOLD_TIME: thresholdTimeRef.current.value,
      WHITELIST_TIME: whitelistTime.current.value,
    };

    if (Object.values(inputData).some((field) => field.trim() === '')) {
      alert('Please fill in all the fields.');
      return;
    }

    try {
      const envContent = Object.entries(inputData)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n');

      const response = await fetch('http://localhost:3000/api/env/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ envContent }),
      });

      if (response.ok) {
        // Show the first toast
        toast.success('Environment variables stored successfully!');
        
        // Optionally, delay the second toast to show after the first one
        setTimeout(() => {
          toast.success('Login successful.');
          
          // Navigate after the toast
          navigate('/app');
        }, 1500); // Adjust time (1500ms = 1.5 seconds)
      } else {
        const error = await response.json();
        alert(`Failed to store environment variables: ${error.message}`);
        console.error('Error:', error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while storing environment variables. Please try again.');
    }
  };

  return (
    <div className="workspace-cleaner">
      <Navbar />

      <div className="workspace-container">
        <div className="workspace-illustration">
          <div className="illustration-container">
          <img
            src="https://res.cloudinary.com/deysmiqsk/image/upload/v1734849120/rul5kze7etd2bkkcct0x.webp"
            alt="Illustration"
          />
          </div>
        </div>
        <div className="form-container">
          <h2>Please fill the details to login</h2>
          <input type="text" ref={databricksHostRef} placeholder="Enter Databricks Host" className="input-field" />
          <input type="text" ref={accessTokenRef} placeholder="Enter Access Token" className="input-field" />
          <input type="text" ref={warehouseIdRef} placeholder="Enter Warehouse ID" className="input-field" />
          <input type="text" ref={thresholdTimeRef} placeholder="Enter threshold time period before which you want to see ADB objects (in days)" className="input-field" />
          <input type="text" ref={whitelistTime} placeholder="Enter the period for which you want to whitelist an object (in days)" className="input-field" />
          {/* <input type="text" ref={whitelistPathRef} placeholder="Path for whitelist.txt" className="input-field" /> */}
          <button onClick={storeData} className="login-btn">Login</button>
          <div className='help'>
          <a 
            href="https://forms.office.com/r/hBjBYbdDw1" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Help & Support
          </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCleanerLogin;
