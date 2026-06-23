import { AppDataSource } from '../config/database';
import { Project, ProjectStatus } from '../entities/Project';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { UserRole } from '../entities/User';

export interface ProjectPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: ProjectStatus;
}

export class ProjectService {
  private projectRepository = AppDataSource.getRepository(Project);

  /**
   * Create a new project
   */
  public async createProject(title: string, description: string | undefined, status: ProjectStatus | undefined, userId: string): Promise<Project> {
    const project = new Project();
    project.title = title;
    project.description = description;
    if (status) {
      project.status = status;
    }
    project.userId = userId;

    return await this.projectRepository.save(project);
  }

  /**
   * Get paginated projects for user (or all projects if admin)
   */
  public async getProjects(userId: string, userRole: UserRole, options: ProjectPaginationOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    // Security: Whitelist sort columns to prevent SQL injection
    const allowedSortBy = ['title', 'status', 'createdAt', 'updatedAt'];
    const sortBy = allowedSortBy.includes(options.sortBy || '') ? options.sortBy! : 'createdAt';
    const sortOrder = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.projectRepository.createQueryBuilder('project');

    // Members can only see their own projects, Admins see all
    if (userRole !== 'admin') {
      queryBuilder.andWhere('project.userId = :userId', { userId });
    }

    // Filter by status if provided
    if (options.status) {
      queryBuilder.andWhere('project.status = :status', { status: options.status });
    }

    queryBuilder.orderBy(`project.${sortBy}`, sortOrder);
    queryBuilder.take(limit);
    queryBuilder.skip(skip);

    const [data, totalResults] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalResults / limit);

    return {
      results: data.length,
      pagination: {
        page,
        limit,
        totalPages,
        totalResults,
      },
      data,
    };
  }

  /**
   * Get single project by ID with ownership checks
   */
  public async getProjectById(id: string, userId: string, userRole: UserRole): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Authorization: Must be owner or admin
    if (userRole !== 'admin' && project.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this project');
    }

    return project;
  }

  /**
   * Update project details
   */
  public async updateProject(id: string, userId: string, userRole: UserRole, updateData: Partial<Pick<Project, 'title' | 'description' | 'status'>>): Promise<Project> {
    const project = await this.getProjectById(id, userId, userRole);

    if (updateData.title !== undefined) project.title = updateData.title;
    if (updateData.description !== undefined) project.description = updateData.description;
    if (updateData.status !== undefined) project.status = updateData.status;

    return await this.projectRepository.save(project);
  }

  /**
   * Delete project (triggers cascade deletes for tasks)
   */
  public async deleteProject(id: string, userId: string, userRole: UserRole): Promise<void> {
    const project = await this.getProjectById(id, userId, userRole);
    await this.projectRepository.remove(project);
  }
}
