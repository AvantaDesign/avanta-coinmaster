# Contributing to Avanta Finance

First off, thank you for considering contributing to Avanta Finance! This is a personal project, but contributions are welcome and appreciated.

## Code of Conduct

Be respectful, professional, and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
- Check the [Issues](https://github.com/AvantaDesign/avanta-coinmaster/issues) to see if it's already reported
- Make sure you're using the latest version

When reporting a bug, include:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (browser, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When suggesting an enhancement:
- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful
- Include mockups or examples if applicable

### Pull Requests

1. **Fork the Repository**
   ```bash
   git clone https://github.com/AvantaDesign/avanta-coinmaster.git
   cd avanta-coinmaster
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Keep changes focused and atomic
   - Test your changes thoroughly

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add feature: description"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Include screenshots for UI changes

## Development Guidelines

### Code Style

- **JavaScript/React**
  - Use functional components with hooks
  - Use arrow functions for consistency
  - Use descriptive variable names
  - Keep functions small and focused
  - Add comments for complex logic

- **CSS/Tailwind**
  - Use Tailwind utility classes
  - Follow existing color scheme
  - Ensure responsive design

- **API Functions**
  - Return proper HTTP status codes
  - Include error handling
  - Validate input data
  - Document endpoints

### Commit Messages

Use clear, descriptive commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: Add CSV import for bank transactions
fix: Correct ISR calculation for edge cases
docs: Update deployment guide with R2 setup
```

### Testing

Before submitting a PR:
- [ ] Build succeeds: `npm run build`
- [ ] No console errors
- [ ] Test on Chrome and Firefox
- [ ] Test on mobile viewport
- [ ] All existing features still work

### Documentation

- Update README.md if adding new features
- Update DEVELOPMENT.md for technical changes
- Update DEPLOYMENT.md if changing deployment process
- Add inline comments for complex code

## Project Structure

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed project structure and architecture.

## Areas for Contribution

### High Priority (Semana 2)
- CSV import for bank transactions
- CFDI XML parser
- Enhanced charts and visualizations
- Excel/PDF export
- Mobile responsive improvements

### Future Enhancements
- Authentication system (OAuth)
- Multi-user support
- AI transaction classification
- Bank API integrations
- Mobile app (React Native)
- Automated testing

## Getting Help

- Check [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Open an issue for questions
- Review existing issues and PRs

## Recognition

Contributors will be recognized in the README and CHANGELOG.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Avanta Finance! 🎉
