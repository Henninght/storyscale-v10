# Deploy to Production

Deploy the application to Vercel with full safety checks.

## Workflow

1. **Pre-deployment Security Checks**
   - Verify .env.local is NOT staged for commit
   - Verify .env.local is in .gitignore
   - Check for any accidentally committed secrets

2. **Git Push**
   - Stage and commit changes
   - Push to GitHub repository
   - Trigger automatic Vercel deployment

3. **Post-deployment Verification**
   - Confirm deployment succeeded
   - Provide live URL
   - Check environment variables are configured

## Safety Features

- **Automatic .env.local protection**: Will ABORT if .env.local is staged
- **Pre-commit hook validation**: Husky hook prevents secret commits
- **Clear error messages**: Explains how to fix issues if detected

## Usage

Run this slash command when you're ready to deploy your changes to production.
