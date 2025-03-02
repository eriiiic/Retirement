const fs = require('fs');
const path = require('path');

const packageDir = path.resolve(__dirname, '../node_modules/react-router-dom');
const indexMjsPath = path.join(packageDir, 'index.mjs');
const distDir = path.join(packageDir, 'dist');
const distIndexMjsPath = path.join(distDir, 'index.mjs');

// The content for the explicit exports
const rootIndexContent = `// Import all components we need from the CJS version
import * as ReactRouterDOM from './index.js';

// Export all components
export const BrowserRouter = ReactRouterDOM.BrowserRouter;
export const Routes = ReactRouterDOM.Routes;
export const Route = ReactRouterDOM.Route;
export const Link = ReactRouterDOM.Link;
export const NavLink = ReactRouterDOM.NavLink;
export const Navigate = ReactRouterDOM.Navigate;
export const useNavigate = ReactRouterDOM.useNavigate;
export const useParams = ReactRouterDOM.useParams;
export const useLocation = ReactRouterDOM.useLocation;
export const Outlet = ReactRouterDOM.Outlet;

// Export everything else
export * from './index.js';`;

const distIndexContent = `// Import all components we need from the CJS version
import * as ReactRouterDOM from '../index.js';

// Export all components
export const BrowserRouter = ReactRouterDOM.BrowserRouter;
export const Routes = ReactRouterDOM.Routes;
export const Route = ReactRouterDOM.Route;
export const Link = ReactRouterDOM.Link;
export const NavLink = ReactRouterDOM.NavLink;
export const Navigate = ReactRouterDOM.Navigate;
export const useNavigate = ReactRouterDOM.useNavigate;
export const useParams = ReactRouterDOM.useParams;
export const useLocation = ReactRouterDOM.useLocation;
export const Outlet = ReactRouterDOM.Outlet;

// Export everything else
export * from '../index.js';`;

// Check if the package directory exists
if (fs.existsSync(packageDir)) {
  // Create root level index.mjs if it doesn't exist
  if (!fs.existsSync(indexMjsPath)) {
    console.log('Creating missing index.mjs file in react-router-dom root...');
    
    fs.writeFileSync(
      indexMjsPath,
      rootIndexContent,
      'utf8'
    );
    
    console.log('Successfully created root index.mjs file!');
  } else {
    console.log('Root index.mjs file already exists. Overwriting with explicit exports...');
    fs.writeFileSync(
      indexMjsPath,
      rootIndexContent,
      'utf8'
    );
    console.log('Successfully updated root index.mjs file!');
  }
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(distDir)) {
    console.log('Creating dist directory in react-router-dom...');
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create dist/index.mjs if it doesn't exist
  if (!fs.existsSync(distIndexMjsPath)) {
    console.log('Creating missing index.mjs file in react-router-dom/dist...');
    
    fs.writeFileSync(
      distIndexMjsPath,
      distIndexContent,
      'utf8'
    );
    
    console.log('Successfully created dist/index.mjs file!');
  } else {
    console.log('dist/index.mjs file already exists. Overwriting with explicit exports...');
    fs.writeFileSync(
      distIndexMjsPath,
      distIndexContent,
      'utf8'
    );
    console.log('Successfully updated dist/index.mjs file!');
  }
} else {
  console.log('react-router-dom package not found, skipping fix.');
} 