# Contributing to Avanta Finance

First off, thank you for considering contributing to Avanta Finance! This is a personal project, but contributions are welcome and appreciated.

## Code of Conduct

Be respectful, professional, and constructive in all interactions.

## Implementation Plan V9 Context

**Current Status:** Phase 46 - Integration Testing & Quality Assurance  
**Focus:** Database health testing, comprehensive QA, system hardening  
**Next Phases:** 47-60 Production Excellence & Advanced Features

**Critical Requirements:**
- **ALWAYS** check `DATABASE_TRACKING_SYSTEM.md` before development
- **ALWAYS** verify database requirements before coding
- **ALWAYS** update documentation when adding features
- **ALWAYS** follow the implementation plan context

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
- Check the [Issues](https://github.com/AvantaDesign/avanta-coinmaster/issues) to see if it's already reported
- Make sure you're using the latest version
- Check database health: `curl http://127.0.0.1:8788/api/health`

When reporting a bug, include:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Database status (tables, migrations)
- Screenshots if applicable
- Your environment (browser, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When suggesting an enhancement:
- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful
- Consider Implementation Plan V9 context
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
   - **ALWAYS** check database requirements
   - **ALWAYS** update documentation
   - **ALWAYS** follow Implementation Plan V9 context

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
   - Document database changes
   - Reference Implementation Plan V9 phase

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
- [ ] Database health check passes: `curl http://127.0.0.1:8788/api/health`
- [ ] All 43 tables + 7 views exist
- [ ] All migrations applied correctly
- [ ] No console errors
- [ ] Test on Chrome and Firefox
- [ ] Test on mobile viewport
- [ ] All existing features still work
- [ ] Database integrity maintained
- [ ] API endpoints functional

### Documentation

- Update README.md if adding new features
- Update DEVELOPMENT.md for technical changes
- Update DEPLOYMENT.md if changing deployment process
- **ALWAYS** update DATABASE_TRACKING_SYSTEM.md for database changes
- **ALWAYS** update .cursorrules for new development rules
- **ALWAYS** update IMPLEMENTATION_PLAN_V9.md for phase changes
- Add inline comments for complex code
- Document API endpoint database requirements

## Project Structure

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed project structure and architecture.

## Areas for Contribution

### High Priority (Implementation Plan V9 - Phase 46)
- Database health monitoring and testing
- Comprehensive integration tests
- API endpoint testing and validation
- Frontend component testing
- End-to-end testing scenarios
- Performance testing and optimization
- Security testing and validation

### Medium Priority (Phases 47-49)
- API documentation and developer experience
- Dependency updates and security patches
- Database optimization and performance tuning
- Advanced monitoring and alerting

### Future Enhancements (Phases 50-60)
- Progressive Web App (PWA) features
- Advanced analytics and insights
- Bank integration and automation
- SAT integration enhancements
- Search and filtering capabilities
- Multi-user collaboration features
- Backup and disaster recovery
- Security audit and compliance
- Performance optimization
- User experience improvements
- Production deployment excellence

## Getting Help

- Check [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Check [DATABASE_TRACKING_SYSTEM.md](../DATABASE_TRACKING_SYSTEM.md) for database management
- Check [.cursorrules](../.cursorrules) for AI agent development rules
- Check [IMPLEMENTATION_PLAN_V9.md](../IMPLEMENTATION_PLAN_V9.md) for current phase context
- Open an issue for questions
- Review existing issues and PRs

## Recognition

Contributors will be recognized in the README and CHANGELOG.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Avanta Finance! 🎉
