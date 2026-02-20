import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { success } from '../utils/response';
import { requireAuth } from '../middleware/auth.middleware';
import { isOverdue } from '../utils/date';

export const calendarRouter = Router();

calendarRouter.use(requireAuth);

/** Split a query param that may contain comma-separated values */
function splitParam(val: string | string[]): string[] {
  if (Array.isArray(val)) return val.flatMap(v => v.split(','));
  return val.split(',');
}

/** Build common filter conditions from calendar query params */
function buildFilterWhere(req: Request): any {
  const q = req.query as any;
  const userId = req.user!.sub;
  const where: any = {};

  // Filter by myTasksOnly
  if (q.myTasksOnly === 'true') {
    where.pics = { some: { userId } };
  }

  // Filter by PIC
  const picIds = q.picId || q.picIds;
  if (picIds) {
    const ids = splitParam(picIds);
    where.pics = { some: { userId: { in: ids } } };
  }

  // Filter by activity type
  const atIds = q.activityTypeId || q.activityTypeIds;
  if (atIds) {
    const ids = splitParam(atIds);
    where.activity = { activityTypeId: { in: ids } };
  }

  // Filter by status (override default exclusion)
  const statuses = q.status || q.statuses;
  if (statuses) {
    const statusList = splitParam(statuses);
    where.status = { in: statusList };
  }

  return where;
}

// GET /calendar/summary
calendarRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    // Use month param as reference point if provided, otherwise use current date
    let now = new Date();
    const monthParam = req.query.month as string | undefined;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [year, mon] = monthParam.split('-').map(Number);
      now = new Date(year, mon - 1, 1);
    }
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);

    const filterWhere = buildFilterWhere(req);
    const taskWhere: any = { status: { notIn: ['Archived', 'Approved'] }, ...filterWhere };

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: { id: true, status: true, endDate: true, startDate: true },
    });

    const activeTasks = tasks.length;
    const overdueTasks = tasks.filter((t) => isOverdue(t.endDate, t.status)).length;
    const next7DaysTasks = tasks.filter((t) => {
      const start = t.startDate;
      return start >= now && start <= next7Days;
    }).length;

    return success(res, { activeTasks, overdueTasks, next7DaysTasks });
  } catch (err) {
    console.error('Calendar summary error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get calendar summary' } });
  }
});

// GET /calendar/workloads?month=YYYY-MM
calendarRouter.get('/workloads', async (req: Request, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split('-').map(Number);

    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 0);

    const filterWhere = buildFilterWhere(req);
    const taskWhere: any = {
      status: { not: 'Archived' },
      startDate: { lte: endOfMonth },
      endDate: { gte: startOfMonth },
      ...filterWhere,
    };

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: { startDate: true, endDate: true },
    });

    // Count tasks per day
    const dayCounts: Record<string, number> = {};
    for (const task of tasks) {
      const start = task.startDate < startOfMonth ? startOfMonth : task.startDate;
      const end = task.endDate > endOfMonth ? endOfMonth : task.endDate;

      const current = new Date(start);
      while (current <= end) {
        const key = current.toISOString().split('T')[0];
        dayCounts[key] = (dayCounts[key] || 0) + 1;
        current.setDate(current.getDate() + 1);
      }
    }

    const workloads = Object.entries(dayCounts).map(([date, taskCount]) => ({
      date,
      taskCount,
      isOverloaded: taskCount > 5,
    }));

    return success(res, workloads);
  } catch (err) {
    console.error('Calendar workloads error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get workloads' } });
  }
});

// GET /calendar/conflicts
calendarRouter.get('/conflicts', async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { status: { notIn: ['Archived', 'Approved'] } },
      include: {
        pics: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // Group tasks by PIC and date
    const picDateMap: Record<string, { picName: string; dates: Record<string, number> }> = {};

    for (const task of tasks) {
      for (const pic of task.pics) {
        if (!picDateMap[pic.userId]) {
          picDateMap[pic.userId] = { picName: pic.user.name, dates: {} };
        }

        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const current = new Date(start);

        while (current <= end) {
          const dateKey = current.toISOString().split('T')[0];
          picDateMap[pic.userId].dates[dateKey] = (picDateMap[pic.userId].dates[dateKey] || 0) + 1;
          current.setDate(current.getDate() + 1);
        }
      }
    }

    const conflicts: Array<{
      picId: string;
      picName: string;
      date: string;
      taskCount: number;
      message: string;
    }> = [];

    for (const [picId, data] of Object.entries(picDateMap)) {
      for (const [date, count] of Object.entries(data.dates)) {
        if (count >= 3) {
          conflicts.push({
            picId,
            picName: data.picName,
            date,
            taskCount: count,
            message: `${data.picName} already has ${count} tasks on this date.`,
          });
        }
      }
    }

    return success(res, conflicts);
  } catch (err) {
    console.error('Calendar conflicts error:', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get conflicts' } });
  }
});
