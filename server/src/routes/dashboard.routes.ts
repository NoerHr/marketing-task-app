import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { isOverdue, daysOverdue } from '../utils/date';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

// GET /dashboard/summary
dashboardRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const tasks = await prisma.task.findMany({
      where: { status: { not: 'Archived' } },
      select: { id: true, status: true, endDate: true },
    });

    const overdueCount = tasks.filter((t) => isOverdue(t.endDate, t.status)).length;
    const thisWeekActivities = await prisma.activity.count({
      where: {
        status: 'Active',
        startDate: { lte: weekEnd },
        endDate: { gte: now },
      },
    });

    return success(res, {
      overdueTasksCount: overdueCount,
      activitiesThisWeek: thisWeekActivities,
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get summary' } });
  }
});

// GET /dashboard/activity-summary
dashboardRouter.get('/activity-summary', async (_req: Request, res: Response) => {
  try {
    const [active, completed, archived] = await Promise.all([
      prisma.activity.count({ where: { status: 'Active' } }),
      prisma.activity.count({ where: { status: 'Completed' } }),
      prisma.activity.count({ where: { status: 'Archived' } }),
    ]);

    const needReview = await prisma.task.count({ where: { status: 'Need Review' } });

    return success(res, { active, completed, needReview, archived });
  } catch (err) {
    console.error('Activity summary error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get activity summary' } });
  }
});

// GET /dashboard/pic-progress
dashboardRouter.get('/pic-progress', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'PIC', status: 'Active' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        taskPics: {
          include: {
            task: { select: { status: true, endDate: true } },
          },
        },
      },
    });

    const data = users.map((u) => {
      const tasks = u.taskPics.map((tp) => tp.task);
      const total = tasks.length;
      const approved = tasks.filter((t) => t.status === 'Approved').length;
      const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
      const overdue = tasks.filter((t) => isOverdue(t.endDate, t.status)).length;

      return {
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        totalTasks: total,
        approved,
        inProgress,
        overdue,
        completionPercent: total > 0 ? Math.round((approved / total) * 100) : 0,
      };
    });

    return success(res, data);
  } catch (err) {
    console.error('PIC progress error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get PIC progress' } });
  }
});

// GET /dashboard/budget-overview
dashboardRouter.get('/budget-overview', async (_req: Request, res: Response) => {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        requiresBudget: true,
        estimatedBudget: { not: null },
      },
      include: {
        activityType: { select: { color: true } },
      },
    });

    const data = activities.map((a) => ({
      activityId: a.id,
      activityName: a.name,
      activityTypeColor: a.activityType.color,
      estimatedBudget: a.estimatedBudget ? Number(a.estimatedBudget) : 0,
      spentBudget: a.spentBudget ? Number(a.spentBudget) : 0,
      currency: a.currency,
    }));

    return success(res, data);
  } catch (err) {
    console.error('Budget overview error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get budget overview' } });
  }
});

// GET /dashboard/my-progress
dashboardRouter.get('/my-progress', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;

    const taskPics = await prisma.taskPic.findMany({
      where: { userId },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            status: true,
            endDate: true,
            updatedAt: true,
            activity: {
              select: {
                name: true,
                activityType: { select: { color: true } },
              },
            },
          },
        },
      },
    });

    const tasks = taskPics.map((tp) => tp.task);
    const total = tasks.length;
    const approved = tasks.filter((t) => t.status === 'Approved').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const needReview = tasks.filter((t) => t.status === 'Need Review').length;
    const revision = tasks.filter((t) => t.status === 'Revision').length;
    const toDo = tasks.filter((t) => t.status === 'To Do').length;
    const overdue = tasks.filter((t) => isOverdue(t.endDate, t.status)).length;

    const myTasks = tasks
      .filter((t) => t.status !== 'Archived')
      .map((t) => ({
        id: t.id,
        name: t.name,
        activityName: t.activity.name,
        activityTypeColor: t.activity.activityType.color,
        status: t.status,
        endDate: t.endDate.toISOString().split('T')[0],
        updatedAt: t.updatedAt.toISOString(),
      }));

    const now = new Date();
    const nearestDeadlines = tasks
      .filter((t) => t.endDate >= now && t.status !== 'Approved' && t.status !== 'Archived')
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        name: t.name,
        activityName: t.activity.name,
        endDate: t.endDate.toISOString().split('T')[0],
        daysUntil: Math.ceil((t.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: t.status,
      }));

    return success(res, {
      progress: {
        totalTasks: total,
        approved,
        inProgress,
        needReview,
        revision,
        toDo,
        overdue,
        completionPercent: total > 0 ? Math.round((approved / total) * 100) : 0,
      },
      myTasks,
      nearestDeadlines,
    });
  } catch (err) {
    console.error('My progress error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get progress' } });
  }
});
