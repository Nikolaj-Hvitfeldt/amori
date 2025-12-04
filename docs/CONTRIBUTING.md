# Contributing to Amori 💝

Thank you for your interest in contributing to Amori! This relationship journal app is designed to help couples document their journey together.

## How to Contribute

### Reporting Bugs

If you find a bug:
1. Check if it's already reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node version, platform - web/iOS/Android)

### Suggesting Features

We'd love to hear your ideas! To suggest a feature:
1. Check existing issues/discussions
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Any implementation ideas

### Code Contributions

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/amori.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add TypeScript types
   - Update documentation if needed
   - Test your changes on all platforms (web, iOS, Android)

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Use conventional commits:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `style:` formatting
   - `refactor:` code restructuring
   - `test:` adding tests
   - `chore:` maintenance

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Describe your changes
   - Link related issues
   - Add screenshots for UI changes
   - Test on multiple platforms if applicable

## Development Setup

See `QUICKSTART.md` for detailed setup instructions.

### Quick Setup
```bash
# Backend
cd backend
npm install
# Create .env with Supabase credentials
npm run start:dev

# Frontend (in new terminal)
cd frontend
npm install
npm start
```

## Code Style

### General
- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Remove unused imports

### Backend (NestJS)
- Use decorators for routing
- Keep controllers thin
- Business logic in services
- DTOs for data validation
- Use dependency injection
- Handle errors with custom exceptions
- Use service role key (never anon key)

### Frontend (React Native)
- Functional components with hooks
- TypeScript interfaces for props
- StyleSheet for styling
- Meaningful component names
- Extract reusable components
- Use React Native Reanimated for animations
- Test on web, iOS, and Android

## Testing

Before submitting:
- Ensure TypeScript compiles: `npm run build` (backend) or `npx tsc --noEmit` (frontend)
- Test on actual devices/emulators when possible
- Test on web browser
- Check for console errors
- Verify API endpoints work
- Test image upload functionality
- Verify animations work smoothly

## Documentation

Update documentation when you:
- Add new features
- Change API endpoints
- Modify configuration
- Add dependencies
- Change database schema

Files to update:
- `README.md` - Main documentation
- `backend/README.md` - API changes
- `frontend/README.md` - UI changes
- `docs/ARCHITECTURE.md` - Architecture changes
- `docs/QUICKSTART.md` - Setup changes
- `docs/DEPLOYMENT.md` - Deployment changes

## Areas for Contribution

Here are some ideas:

### Features
- [ ] User authentication (Supabase Auth)
- [ ] Search functionality
- [ ] Export data to PDF
- [ ] Calendar view
- [ ] Reminders for anniversaries
- [ ] Photo albums organization
- [ ] Multiple journals (for different relationships)
- [ ] Sharing entries (read-only links)
- [ ] Dark mode toggle
- [ ] Offline support

### Improvements
- [ ] Push notifications
- [ ] More animation options
- [ ] Performance optimization
- [ ] Better error handling
- [ ] Form validation improvements
- [ ] Accessibility improvements (screen readers, etc.)
- [ ] Internationalization (i18n)
- [ ] Unit and E2E tests

### Technical
- [ ] CI/CD pipeline
- [ ] Docker setup
- [ ] API rate limiting
- [ ] Caching improvements
- [ ] Real-time updates
- [ ] GraphQL option
- [ ] Image optimization improvements

## Code Review Guidelines

When reviewing PRs:
- Be respectful and constructive
- Focus on code quality and functionality
- Test the changes if possible
- Ask questions if something is unclear
- Suggest improvements, don't just point out issues

## Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Give constructive feedback
- Celebrate contributions
- Have fun! 🎉

## Questions?

- Open an issue for questions
- Check existing documentation
- Look at closed issues for similar questions
- Review the codebase for examples

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

Thank you for making Amori better! 💕
