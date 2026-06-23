import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { TaskController } from '../controllers/task.controller';
import { authenticateJWT } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createProjectSchema, updateProjectSchema } from '../validations/project.validation';
import { createTaskSchema } from '../validations/task.validation';

const router = Router();
const projectController = new ProjectController();
const taskController = new TaskController();

// Guard all project routes with JWT Authentication
router.use(authenticateJWT);

// Project CRUD
router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.patch('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Nested Tasks under Project
router.post('/:projectId/tasks', validate(createTaskSchema), taskController.createTask);
router.get('/:projectId/tasks', taskController.getTasks);

export default router;
