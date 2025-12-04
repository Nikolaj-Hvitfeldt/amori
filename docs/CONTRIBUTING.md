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
   - Your environment (OS, Node version, etc.)

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
   - Test your changes

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

## Development Setup

See `QUICKSTART.md` for detailed setup instructions.

### Quick Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Add your Supabase credentials to .env
npm run start:dev

# Frontend (in new terminal)
cd frontend
npm install
npm start
```

## Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Backend (NestJS)
- Use decorators for routing
- Keep controllers thin
- Business logic in services
- DTOs for data validation
- Use dependency injection

### Frontend (React Native)
- Functional components with hooks
- TypeScript interfaces for props
- StyleSheet for styling (NativeWind)
- Meaningful component names
- Extract reusable components

## Testing

Before submitting:
- Ensure TypeScript compiles: `npm run build` (backend) or `npx tsc --noEmit` (frontend)
- Test on actual devices/emulators when possible
- Check for console errors
- Verify API endpoints work

## Documentation

Update documentation when you:
- Add new features
- Change API endpoints
- Modify configuration
- Add dependencies

Files to update:
- `README.md` - Main documentation
- `backend/README.md` - API changes
- `frontend/README.md` - UI changes
- `ARCHITECTURE.md` - Architecture changes

## Areas for Contribution

Here are some ideas:

### Features
- [ ] User authentication (Supabase Auth)
- [ ] Image upload and storage
- [ ] Search functionality
- [ ] Export data to PDF
- [ ] Calendar view
- [ ] Reminders for anniversaries
- [ ] Photo albums
- [ ] Mood tracking
- [ ] Multiple journals (for different relationships)
- [ ] Sharing entries (read-only links)

### Improvements
- [ ] Dark mode
- [ ] Offline support
- [ ] Push notifications
- [ ] Animation improvements
- [ ] Performance optimization
- [ ] Better error handling
- [ ] Form validation
- [ ] Loading skeletons
- [ ] Accessibility improvements

### Technical
- [ ] Unit tests
- [ ] E2E tests
- [ ] CI/CD pipeline
- [ ] Docker setup
- [ ] API rate limiting
- [ ] Caching layer
- [ ] GraphQL option
- [ ] Real-time updates

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

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

Thank you for making Amori better! 💕

