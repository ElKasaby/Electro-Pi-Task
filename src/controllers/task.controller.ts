import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { TaskStatus, TaskPriority } from '../entities/Task';

const taskService = new TaskService();

export class TaskController {

  public async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { title, description, status, priority, dueDate } = req.body;

      const task = await taskService.createTask(projectId, userId, userRole, {
        title,
        description,
        status,
        priority,
        dueDate
      });

      res.status(201).json({
        status: 'success',
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  public async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'ASC' | 'DESC' | undefined;
      const status = req.query.status as TaskStatus | undefined;
      const priority = req.query.priority as TaskPriority | undefined;

      const result = await taskService.getTasks(projectId, userId, userRole, {
        page,
        limit,
        sortBy,
        sortOrder,
        status,
        priority,
      });

      res.status(200).json({
        status: 'success',
        results: result.results,
        pagination: result.pagination,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  public async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const task = await taskService.getTaskById(id, userId, userRole);

      res.status(200).json({
        status: 'success',
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { title, description, status, priority, dueDate } = req.body;

      const task = await taskService.updateTask(id, userId, userRole, {
        title,
        description,
        status,
        priority,
        dueDate
      });

      res.status(200).json({
        status: 'success',
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await taskService.deleteTask(id, userId, userRole);

      res.status(200).json({
        status: 'success',
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
export default TaskController;
