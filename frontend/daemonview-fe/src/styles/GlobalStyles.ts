// src/styles/GlobalStyles.ts
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  body { // Target the body element for the main page scrollbar
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: #635bff #1a1839; /* thumb track - For Firefox */

    /* For Webkit browsers (Chrome, Safari, Edge, Opera) */
    &::-webkit-scrollbar {
      width: 8px;  /* Width of the vertical scrollbar */
      height: 8px; /* Height of the horizontal scrollbar */
    }

    &::-webkit-scrollbar-track {
      background: #1a1839;
      /* border-radius: 10px; /* Optional: if you want rounded track ends */
    }

    &::-webkit-scrollbar-thumb {
      background-color: #635bff;
      border-radius: 10px;
      border: 2px solid #1a1839; /* Creates a "padding" effect */
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: #4e49c4; /* Optional: hover effect */
    }
  }

  /* You can add other global styles here too if needed */
  html,
  body {
    padding: 0;
    margin: 0;
    font-family: 'Orbitron', sans-serif; // Example: if Orbitron is your global font
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  * {
    box-sizing: border-box;
  }
`;

export default GlobalStyles;