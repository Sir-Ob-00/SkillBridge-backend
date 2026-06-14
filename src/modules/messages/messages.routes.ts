import { Router } from 'express';
import { messagesController } from './messages.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { validate } from '../../middlewares/validate';
import { chatIdParamSchema, listMessagesQuerySchema } from './messages.validators';

const router = Router();

router.use(requireAuth);

router.get('/', messagesController.listChats);
router.get(
  '/:chatId/messages',
  validate(chatIdParamSchema, 'params'),
  validate(listMessagesQuerySchema, 'query'),
  messagesController.getMessages
);
router.post(
  '/:chatId/read',
  validate(chatIdParamSchema, 'params'),
  messagesController.markRead
);

export const chatRouter = router;
