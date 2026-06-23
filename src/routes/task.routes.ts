import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticateJWT } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateTaskSchema } from '../validations/task.validation';

const router = Router();
const taskController = new TaskController();

// Guard standalone task routes with JWT
router.use(authenticateJWT);

router.get('/:id', taskController.getTaskById);
router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;
