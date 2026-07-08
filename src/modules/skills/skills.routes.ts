import { Router } from 'express';
import { skillsController } from './skills.controller';

const router = Router();

router.get('/', skillsController.list);

export const skillsRouter = router;
