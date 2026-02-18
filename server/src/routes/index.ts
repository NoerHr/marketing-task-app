import { Router } from 'express';
import { authRouter } from './auth.routes';
import { meRouter } from './me.routes';
import { usersRouter } from './users.routes';
import { activityTypesRouter } from './activityTypes.routes';
import { activitiesRouter } from './activities.routes';
import { tasksRouter } from './tasks.routes';
import { calendarRouter } from './calendar.routes';
import { dashboardRouter } from './dashboard.routes';
import { whatsappRouter } from './whatsapp.routes';
import { messageTemplatesRouter } from './messageTemplates.routes';
import { notificationsRouter } from './notifications.routes';

export const router = Router();

router.use('/auth', authRouter);
router.use('/me', meRouter);
router.use('/users', usersRouter);
router.use('/activity-types', activityTypesRouter);
router.use('/activities', activitiesRouter);
router.use('/tasks', tasksRouter);
router.use('/calendar', calendarRouter);
router.use('/dashboard', dashboardRouter);
router.use('/whatsapp', whatsappRouter);
router.use('/message-templates', messageTemplatesRouter);
router.use('/notifications', notificationsRouter);
