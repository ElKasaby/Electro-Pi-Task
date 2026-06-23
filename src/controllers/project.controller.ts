import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { ProjectStatus } from '../entities/Project';

const projectService = new ProjectService();

export class ProjectController {

  public async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, status } = req.body;
      const userId = req.user!.id;

      const project = await projectService.createProject(title, description, status, userId);

      res.status(201).json({
        status: 'success',
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'ASC' | 'DESC' | undefined;
      const status = req.query.status as ProjectStatus | undefined;

      const result = await projectService.getProjects(userId, userRole, {
        page,
        limit,
        sortBy,
        sortOrder,
        status,
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

  public async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const project = await projectService.getProjectById(id, userId, userRole);

      res.status(200).json({
        status: 'success',
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { title, description, status } = req.body;

      const project = await projectService.updateProject(id, userId, userRole, {
        title,
        description,
        status
      });

      res.status(200).json({
        status: 'success',
        data: { project }
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await projectService.deleteProject(id, userId, userRole);

      res.status(200).json({
        status: 'success',
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
export default ProjectController;
