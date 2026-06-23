import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { ConflictError, UnauthorizedError } from '../errors/AppError';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  token: string;
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Register a new user
   */
  public async register(name: string, email: string, password: string, role: UserRole = 'member'): Promise<AuthResponse> {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = await this.userRepository.findOneBy({ email: trimmedEmail });
    if (existingUser) {
      throw new ConflictError('Email address is already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const user = new User();
    user.name = name.trim();
    user.email = trimmedEmail;
    user.password = hashedPassword;
    user.role = role;

    await this.userRepository.save(user);

    // Generate JWT
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Authenticate a user
   */
  public async login(email: string, password: string): Promise<AuthResponse> {
    const trimmedEmail = email.trim().toLowerCase();

    // Find user
    const user = await this.userRepository.findOneBy({ email: trimmedEmail });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Helper to sign JWT
   */
  private generateToken(userId: string, email: string, role: UserRole): string {
    const secret = process.env.JWT_SECRET || 'electro_pi_backend_assessment_secure_secret_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    return jwt.sign({ sub: userId, email, role }, secret, { expiresIn: expiresIn as any });
  }
}
