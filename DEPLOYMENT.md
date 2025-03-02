# Retirement Planning App Deployment Guide

This document provides detailed instructions for deploying the Retirement Planning Application to a production environment with `/home` as the root directory.

## Prerequisites

- Node.js (v14 or higher) and npm (v6 or higher)
- Access to your production web server (SSH/SFTP)
- Web server software installed (Apache or Nginx)
- Domain configured to point to your server

## Deployment Options

### Option 1: Automated Deployment Script

The easiest way to deploy is using our production deployment script:

```bash
./deploy-production.sh
```

This script will:
1. Install dependencies
2. Run tests to ensure everything is working
3. Build the application with production optimizations
4. Create necessary server configuration files
5. Prepare the build folder for deployment

### Option 2: Manual Deployment

If you prefer manual deployment, follow these steps:

1. Build the application:
   ```bash
   npm install
   npm run build
   ```

2. Copy the `.htaccess` file to your build directory (Apache only):
   ```bash
   cp deployment/htaccess.prod build/.htaccess
   ```

3. Upload the contents of the `build` directory to your server's `/home` directory.

## Server Configuration

### Apache Configuration

1. Ensure mod_rewrite is enabled:
   ```bash
   sudo a2enmod rewrite
   ```

2. Configure your virtual host to allow .htaccess overrides:
   ```apache
   <Directory /home>
       Options Indexes FollowSymLinks
       AllowOverride All
       Require all granted
   </Directory>
   ```

3. Restart Apache:
   ```bash
   sudo systemctl restart apache2
   ```

### Nginx Configuration

1. Copy the provided `nginx.conf` file to your server:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/your-site
   ```

2. Create a symbolic link to enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/
   ```

3. Test the configuration:
   ```bash
   sudo nginx -t
   ```

4. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

## SSL/HTTPS Configuration

For a secure website, you should enable HTTPS:

1. Obtain an SSL certificate (Let's Encrypt is a free option):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

2. Update the Nginx or Apache configuration to use the certificates.

3. Test that HTTPS is working by visiting your site with the https:// prefix.

## Post-Deployment Verification

After deploying, verify the following:

1. Your application loads correctly at your domain
2. All application routes work (test various paths in your app)
3. API calls work correctly
4. Assets (images, CSS, JS) are loaded properly
5. HTTPS is working properly (if configured)

## Troubleshooting

### Common Issues

1. **404 errors on routes**: Ensure your server is configured to redirect all requests to index.html for client-side routing.

2. **Asset loading issues**: Check that paths are correct in your built files. The `/home` base path should be properly reflected.

3. **CORS issues**: If your API is on a different domain, ensure CORS headers are properly set.

4. **Permission issues**: Ensure your web server has read permissions for all files in the `/home` directory.

### Getting Help

If you encounter issues not covered here, consult:
- The server error logs (Apache: `/var/log/apache2/error.log`, Nginx: `/var/log/nginx/error.log`)
- React build documentation
- Your server administration documentation

## Maintenance

### Updates

To update the application:

1. Pull the latest code from your repository
2. Run the deployment script again
3. Upload the new build files to the server

### Rollbacks

To rollback to a previous version:

1. Keep backup copies of previous builds
2. Replace the current files on the server with the backup version 