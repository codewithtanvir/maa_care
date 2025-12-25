# Contributing to Maa Care

First off, thank you for considering contributing to Maa Care! It's people like you that make Maa Care such a great tool for expectant mothers.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, browser, device)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other applications**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding standards** described below
3. **Update documentation** if you change functionality
4. **Add tests** if applicable
5. **Ensure the test suite passes**
6. **Make sure your code lints**

## Development Setup

1. Fork and clone the repo
2. Run `npm install` to install dependencies
3. Create a `.env` file with required environment variables
4. Run `npm run dev` to start the development server
5. Make your changes
6. Run `npx tsc --noEmit` to check for type errors

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Define proper types instead of using `any`
- Use interfaces for object shapes
- Export types used across multiple files

### React Components
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use descriptive component and prop names

### Naming Conventions
- Components: PascalCase (e.g., `Dashboard.tsx`)
- Functions: camelCase (e.g., `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_KEY`)
- File names: PascalCase for components, camelCase for utilities

### Code Style
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Keep line length under 100 characters when possible

### Comments
- Write clear, concise comments
- Document complex logic
- Use JSDoc for function documentation
- Keep comments up-to-date with code changes

### Bilingual Support
- **Always** add both English and Bengali translations
- Update `translations.ts` when adding new text
- Test in both languages before submitting

### Commit Messages
Follow the conventional commits specification:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add nutrition tracking to health dashboard`

## Testing

Before submitting a pull request:

1. **Test on multiple devices**
   - Mobile (Android & iOS)
   - Tablet
   - Desktop

2. **Test in multiple browsers**
   - Chrome
   - Safari
   - Firefox
   - Edge

3. **Test both languages**
   - English
   - Bengali

4. **Test offline functionality**
   - Install as PWA
   - Disconnect from network
   - Verify cached resources work

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for complex functions
- Update architecture diagrams if needed
- Keep CHANGELOG.md up to date

## Questions?

Feel free to open an issue with your question, and we'll do our best to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Maa Care! 💚
