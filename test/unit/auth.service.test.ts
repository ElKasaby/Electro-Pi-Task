import 'reflect-metadata';
import { AuthService } from '../../src/services/auth.service';
import { AppDataSource } from '../../src/config/database';
import { ConflictError, UnauthorizedError } from '../../src/errors/AppError';
import bcrypt from 'bcryptjs';

jest.mock('../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    authService = new AuthService();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (user: any) => {
        user.id = 'mock-user-uuid';
        return user;
      });

      const result = await authService.register('New User', 'newuser@test.com', 'SecurePass123');

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'newuser@test.com' });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result.user).toEqual({
        id: 'mock-user-uuid',
        name: 'New User',
        email: 'newuser@test.com',
        role: 'member',
      });
    });

    it('should throw ConflictError if email is already in use', async () => {
      mockUserRepository.findOneBy.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.register('Existing User', 'existing@test.com', 'SecurePass123')
      ).rejects.toThrow(ConflictError);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'existing@test.com' });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login user with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPass123', 10);
      mockUserRepository.findOneBy.mockResolvedValue({
        id: 'mock-user-uuid',
        name: 'Jane Doe',
        email: 'jane@test.com',
        password: hashedPassword,
        role: 'member',
      });

      const result = await authService.login('jane@test.com', 'CorrectPass123');

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'jane@test.com' });
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('jane@test.com');
    });

    it('should throw UnauthorizedError if user is not found', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(
        authService.login('notfound@test.com', 'SomePass123')
      ).rejects.toThrow(UnauthorizedError);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'notfound@test.com' });
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPass123', 10);
      mockUserRepository.findOneBy.mockResolvedValue({
        id: 'mock-user-uuid',
        name: 'Jane Doe',
        email: 'jane@test.com',
        password: hashedPassword,
        role: 'member',
      });

      await expect(
        authService.login('jane@test.com', 'WrongPass123')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
