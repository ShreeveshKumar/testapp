import React from "react";
import "./navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">
      <img
        className="navbar-logo"
        src="https://res.cloudinary.com/deysmiqsk/image/upload/v1734849114/h9k1hativnqwlmxudahi.png" 
        alt="MAQ Software Logo"
      />
      <div className="title">Workspace Cleaner</div>
    </div>
  );
};

export default Navbar;