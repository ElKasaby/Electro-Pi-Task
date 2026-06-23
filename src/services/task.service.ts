import { AppDataSource } from '../config/database';
import { Task, TaskStatus, TaskPriority } from '../entities/Task';
import { Project } from '../entities/Project';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { UserRole } from '../entities/User';

export interface TaskPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: TaskStatus;
  priority?: TaskPriority;
}

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private projectRepository = AppDataSource.getRepository(Project);

  /**
   * Helper to verify project existence and user access
   */
  private async getVerifiedProject(projectId: string, userId: string, userRole: UserRole): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (userRole !== 'admin' && project.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this project');
    }

    return project;
  }

  /**
   * Create a new task under a project
   */
  public async createTask(
    projectId: string,
    userId: string,
    userRole: UserRole,
    taskData: { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; dueDate?: Date }
  ): Promise<Task> {
    // Verify project exists and user owns it
    await this.getVerifiedProject(projectId, userId, userRole);

    const task = new Task();
    task.title = taskData.title;
    task.description = taskData.description;
    task.projectId = projectId;
    
    if (taskData.status) task.status = taskData.status;
    if (taskData.priority) task.priority = taskData.priority;
    if (taskData.dueDate !== undefined) task.dueDate = taskData.dueDate;

    return await this.taskRepository.save(task);
  }

  /**
   * Get all tasks for a specific project (paginated, sorted, and filtered)
   */
  public async getTasks(projectId: string, userId: string, userRole: UserRole, options: TaskPaginationOptions) {
    // Verify project exists and user owns it
    await this.getVerifiedProject(projectId, userId, userRole);

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    // Whitelist sort fields
    const allowedSortBy = ['title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt'];
    const sortBy = allowedSortBy.includes(options.sortBy || '') ? options.sortBy! : 'createdAt';
    const sortOrder = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.taskRepository.createQueryBuilder('task');
    queryBuilder.where('task.projectId = :projectId', { projectId });

    if (options.status) {
      queryBuilder.andWhere('task.status = :status', { status: options.status });
    }

    if (options.priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority: options.priority });
    }

    queryBuilder.orderBy(`task.${sortBy}`, sortOrder);
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
   * Get single task by ID (validating project ownership)
   */
  public async getTaskById(id: string, userId: string, userRole: UserRole): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id });
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify ownership of the parent project
    await this.getVerifiedProject(task.projectId, userId, userRole);

    return task;
  }

  /**
   * Update task details
   */
  public async updateTask(
    id: string,
    userId: string,
    userRole: UserRole,
    updateData: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate'>>
  ): Promise<Task> {
    const task = await this.getTaskById(id, userId, userRole);

    if (updateData.title !== undefined) task.title = updateData.title;
    if (updateData.description !== undefined) task.description = updateData.description;
    if (updateData.status !== undefined) task.status = updateData.status;
    if (updateData.priority !== undefined) task.priority = updateData.priority;
    if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate;

    return await this.taskRepository.save(task);
  }

  /**
   * Delete task
   */
  public async deleteTask(id: string, userId: string, userRole: UserRole): Promise<void> {
    const task = await this.getTaskById(id, userId, userRole);
    await this.taskRepository.remove(task);
  }
}
