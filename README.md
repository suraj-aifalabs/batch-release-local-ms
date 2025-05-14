# Node + Express + PostgreSQL 

This is repository for Project-ATARA to release batch and to support upload document, generate certificate, and ability to save all documents including certificate to S3 buckets

## Development Guidelines

Please follow the below guidelines before pushing code or raising a pull request.

Branch Rule: Create a feature branch from develop, raise a PR to develop, assign a reviewer, and merge. 
API : Follow the Model-Controller-Route pattern for new APIs.

Add a short description of changes
- [ ] Added new API X
- [ ] Modified existing Y
- [ ] Fixed bug Z

### 1. Code Formatting
Ensure that all files are properly formatted before pushing. We recommend using a default JavaScript formatter that comes with **VS code**. You can run the formatter using the following command:

Shift+Alt+F

### 2. Lint Check
Run Lint Check before pushing the code - **npm run lint**

### 3. Unit Tests
Run all unit tests before raising a Pull Request (PR) or pushing code.
If you're using Postman for API testing, ensure to attach a screenshot of the passing test results when raising the PR.

## 4. Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Tested with [Postman/Insomnia] collection
- [ ] Test all API endpoints (happy path and error cases)

### 5. Branch Naming Convention
For new features: **feature/JIRA-ID**
For bug fixes: **bugfix/JIRA-ID**
For hotfixes: **hotfix/JIRA-ID**

### 6. Commit message
Include Jira Id in commit message. example: **JICV-XX-commit** message

# batch-release-ms
