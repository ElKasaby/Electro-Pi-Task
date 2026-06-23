import 'reflect-metadata';
import { ProjectService } from '../../src/services/project.service';
import { AppDataSource } from '../../src/config/database';
import { NotFoundError, ForbiddenError } from '../../src/errors/AppError';

jest.mock('../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ProjectService Unit Tests', () => {
  let projectService: ProjectService;
  let mockProjectRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockProjectRepository);
    projectService = new ProjectService();
  });

  describe('createProject', () => {
    it('should successfully create a project', async () => {
      mockProjectRepository.save.mockImplementation(async (project: any) => {
        project.id = 'mock-project-uuid';
        return project;
      });

      const result = await projectService.createProject('Web App', 'Description here', 'in_progress', 'user-uuid');

      expect(mockProjectRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'mock-project-uuid',
        title: 'Web App',
        description: 'Description here',
        status: 'in_progress',
        userId: 'user-uuid',
      });
    });
  });

  describe('getProjectById', () => {
    it('should return a project if user is the owner', async () => {
      const mockProject = { id: 'project-uuid', title: 'Web App', userId: 'user-uuid' };
      mockProjectRepository.findOneBy.mockResolvedValue(mockProject);

      const result = await projectService.getProjectById('project-uuid', 'user-uuid', 'member');

      expect(mockProjectRepository.findOneBy).toHaveBeenCalledWith({ id: 'project-uuid' });
      expect(result).toEqual(mockProject);
    });

    it('should return a project if user is an admin (even if not owner)', async () => {
      const mockProject = { id: 'project-uuid', title: 'Web App', userId: 'another-user-uuid' };
      mockProjectRepository.findOneBy.mockResolvedValue(mockProject);

      const result = await projectService.getProjectById('project-uuid', 'admin-uuid', 'admin');

      expect(result).toEqual(mockProject);
    });

    it('should throw ForbiddenError if user is not owner and not admin', async () => {
      const mockProject = { id: 'project-uuid', title: 'Web App', userId: 'owner-uuid' };
      mockProjectRepository.findOneBy.mockResolvedValue(mockProject);

      await expect(
        projectService.getProjectById('project-uuid', 'intruder-uuid', 'member')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if project does not exist', async () => {
      mockProjectRepository.findOneBy.mockResolvedValue(null);

      await expect(
        projectService.getProjectById('missing-uuid', 'user-uuid', 'member')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getProjects', () => {
    it('should build query and apply member ownership filter', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'p1', title: 'P1' }], 1]),
      };

      mockProjectRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await projectService.getProjects('member-uuid', 'member', { page: 1, limit: 10 });

      expect(mockProjectRepository.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('project.userId = :userId', { userId: 'member-uuid' });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalResults).toBe(1);
    });

    it('should build query without member filter if role is admin', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'p1' }, { id: 'p2' }], 2]),
      };

      mockProjectRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await projectService.getProjects('admin-uuid', 'admin', { page: 1, limit: 10 });

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith('project.userId = :userId', expect.any(Object));
      expect(result.pagination.totalResults).toBe(2);
    });
  });
});
