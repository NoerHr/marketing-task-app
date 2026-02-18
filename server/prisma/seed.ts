import { PrismaClient, UserRole, UserStatus, TaskPriority } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password123!';
const SALT_ROUNDS = 12;

// Simple encrypt for seed data (uses same format as crypto.ts)
// In production, the real encrypt() from utils/crypto.ts should be used
function seedEncrypt(plaintext: string): string {
  const crypto = require('crypto');
  const key = Buffer.from(
    process.env.ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'hex'
  );
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // ─── IdCounters ─────────────────────────────────────────
  const counters = [
    { prefix: 'usr', currentValue: 7 },
    { prefix: 'at', currentValue: 7 },
    { prefix: 'act', currentValue: 6 },
    { prefix: 'tsk', currentValue: 45 },
    { prefix: 'mt', currentValue: 5 },
    { prefix: 'wg', currentValue: 2 },
    { prefix: 'rem', currentValue: 4 },
    { prefix: 'apr', currentValue: 1 },
    { prefix: 'asg', currentValue: 2 },
    { prefix: 'inv', currentValue: 0 },
  ];

  for (const c of counters) {
    await prisma.idCounter.upsert({
      where: { prefix: c.prefix },
      update: { currentValue: c.currentValue },
      create: c,
    });
  }
  console.log('  IdCounters seeded');

  // ─── Users ──────────────────────────────────────────────
  const users = [
    {
      id: 'usr-001',
      name: 'Alex Morgan',
      email: 'alex.morgan@company.com',
      role: 'Leader' as UserRole,
      isSuperAdmin: true,
      status: 'Active' as UserStatus,
      lastActiveAt: new Date('2026-02-16T14:30:00Z'),
      notificationPreferences: {
        taskAssignment: true,
        approval: true,
        revision: true,
        reassignment: true,
        deadlineAlert: true,
      },
    },
    {
      id: 'usr-002',
      name: 'Dina Rahma',
      email: 'dina.rahma@company.com',
      role: 'PIC' as UserRole,
      isSuperAdmin: false,
      status: 'Active' as UserStatus,
      lastActiveAt: new Date('2026-02-16T12:15:00Z'),
    },
    {
      id: 'usr-003',
      name: 'Rafi Pratama',
      email: 'rafi.pratama@company.com',
      role: 'PIC' as UserRole,
      isSuperAdmin: false,
      status: 'Active' as UserStatus,
      lastActiveAt: new Date('2026-02-16T09:45:00Z'),
    },
    {
      id: 'usr-004',
      name: 'Sarah Putri',
      email: 'sarah.putri@company.com',
      role: 'PIC' as UserRole,
      isSuperAdmin: false,
      status: 'Active' as UserStatus,
      lastActiveAt: new Date('2026-02-15T17:00:00Z'),
    },
    {
      id: 'usr-005',
      name: 'Michael Tan',
      email: 'michael.tan@company.com',
      role: 'PIC' as UserRole,
      isSuperAdmin: false,
      status: 'Active' as UserStatus,
      lastActiveAt: new Date('2026-02-16T11:30:00Z'),
    },
    {
      id: 'usr-006',
      name: 'Ayu Lestari',
      email: 'ayu.lestari@company.com',
      role: 'PIC' as UserRole,
      isSuperAdmin: false,
      status: 'Active' as UserStatus,
      lastActiveAt: new Date('2026-02-14T16:20:00Z'),
    },
    {
      id: 'usr-007',
      name: 'Budi Santoso',
      email: 'budi.santoso@company.com',
      role: 'PIC' as UserRole,
      isSuperAdmin: false,
      status: 'Deactivated' as UserStatus,
      lastActiveAt: new Date('2026-01-20T10:00:00Z'),
    },
  ];

  for (const u of users) {
    const { notificationPreferences, ...rest } = u as any;
    await prisma.user.upsert({
      where: { id: u.id },
      update: { ...rest, passwordHash, notificationPreferences: notificationPreferences ?? {} },
      create: { ...rest, passwordHash, notificationPreferences: notificationPreferences ?? {} },
    });
  }
  console.log('  Users seeded (7)');

  // ─── Activity Types ─────────────────────────────────────
  const activityTypes = [
    { id: 'at-001', name: 'IG Campaign', color: '#f43f5e', icon: 'megaphone', createdAt: new Date('2025-11-15T08:00:00Z') },
    { id: 'at-002', name: 'Influencer', color: '#8b5cf6', icon: 'users', createdAt: new Date('2025-11-15T08:05:00Z') },
    { id: 'at-003', name: 'Event', color: '#f59e0b', icon: 'calendar-check', createdAt: new Date('2025-11-20T10:00:00Z') },
    { id: 'at-004', name: 'Photoshoot', color: '#14b8a6', icon: 'camera', createdAt: new Date('2025-12-01T09:00:00Z') },
    { id: 'at-005', name: 'Sponsorship', color: '#0ea5e9', icon: 'handshake', createdAt: new Date('2025-12-10T14:00:00Z') },
    { id: 'at-006', name: 'Content Writing', color: '#10b981', icon: 'pen-line', createdAt: new Date('2026-01-05T11:30:00Z') },
    { id: 'at-007', name: 'Brand Activation', color: '#6366f1', icon: null, createdAt: new Date('2026-02-01T08:00:00Z') },
  ];

  for (const at of activityTypes) {
    await prisma.activityType.upsert({
      where: { id: at.id },
      update: at,
      create: at,
    });
  }
  console.log('  Activity Types seeded (7)');

  // ─── Activities ─────────────────────────────────────────
  const activities = [
    {
      id: 'act-001',
      name: 'Ramadan Campaign 2026',
      activityTypeId: 'at-001', // IG Campaign
      status: 'Active',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-03-15'),
      requiresBudget: true,
      estimatedBudget: new Decimal(25000000),
      spentBudget: new Decimal(18500000),
      currency: 'IDR',
    },
    {
      id: 'act-002',
      name: 'Valentine Promo',
      activityTypeId: 'at-001', // IG Campaign (uses pink color variant)
      status: 'Active',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
      requiresBudget: true,
      estimatedBudget: new Decimal(15000000),
      spentBudget: new Decimal(12000000),
      currency: 'IDR',
    },
    {
      id: 'act-003',
      name: 'Brand Launch Event',
      activityTypeId: 'at-003', // Event
      status: 'Active',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-03-01'),
      requiresBudget: true,
      estimatedBudget: new Decimal(50000000),
      spentBudget: new Decimal(35000000),
      currency: 'IDR',
    },
    {
      id: 'act-004',
      name: 'Influencer Collab Q1',
      activityTypeId: 'at-002', // Influencer
      status: 'Active',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-03-31'),
      requiresBudget: true,
      estimatedBudget: new Decimal(30000000),
      spentBudget: new Decimal(20000000),
      currency: 'IDR',
    },
    {
      id: 'act-005',
      name: 'Spring Collection Shoot',
      activityTypeId: 'at-004', // Photoshoot
      status: 'Active',
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-03-10'),
      requiresBudget: true,
      estimatedBudget: new Decimal(20000000),
      spentBudget: new Decimal(8000000),
      currency: 'IDR',
    },
    {
      id: 'act-006',
      name: 'Sponsorship Expo 2026',
      activityTypeId: 'at-005', // Sponsorship
      status: 'Active',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-04-30'),
      requiresBudget: false,
    },
  ];

  for (const act of activities) {
    await prisma.activity.upsert({
      where: { id: act.id },
      update: act,
      create: act,
    });
  }
  console.log('  Activities seeded (6)');

  // ─── Activity PICs ──────────────────────────────────────
  const activityPics = [
    { activityId: 'act-001', userId: 'usr-002' }, // Ramadan → Dina
    { activityId: 'act-002', userId: 'usr-004' }, // Valentine → Sarah
    { activityId: 'act-003', userId: 'usr-005' }, // Brand Launch → Michael
    { activityId: 'act-004', userId: 'usr-003' }, // Influencer → Rafi
    { activityId: 'act-005', userId: 'usr-002' }, // Spring → Dina
    { activityId: 'act-006', userId: 'usr-006' }, // Sponsorship → Ayu
  ];

  for (const ap of activityPics) {
    await prisma.activityPic.upsert({
      where: { activityId_userId: ap },
      update: {},
      create: ap,
    });
  }

  // ─── Activity Approvers ─────────────────────────────────
  const activityApprovers = [
    { activityId: 'act-001', userId: 'usr-001' },
    { activityId: 'act-002', userId: 'usr-001' },
    { activityId: 'act-003', userId: 'usr-001' },
    { activityId: 'act-004', userId: 'usr-001' },
    { activityId: 'act-005', userId: 'usr-001' },
    { activityId: 'act-006', userId: 'usr-001' },
  ];

  for (const aa of activityApprovers) {
    await prisma.activityApprover.upsert({
      where: { activityId_userId: aa },
      update: {},
      create: aa,
    });
  }
  console.log('  Activity PICs & Approvers seeded');

  // ─── Tasks ──────────────────────────────────────────────
  const tasks = [
    {
      id: 'tsk-012',
      name: 'Final edit product video',
      activityId: 'act-001',
      status: 'In Progress',
      priority: 'High' as TaskPriority,
      startDate: new Date('2026-02-08'),
      endDate: new Date('2026-02-10'),
      createdById: 'usr-001',
      description: '',
    },
    {
      id: 'tsk-018',
      name: 'Submit influencer brief to talent',
      activityId: 'act-004',
      status: 'To Do',
      priority: 'Medium' as TaskPriority,
      startDate: new Date('2026-02-11'),
      endDate: new Date('2026-02-12'),
      createdById: 'usr-003',
      description: '',
    },
    {
      id: 'tsk-023',
      name: 'Design banner for IG story',
      activityId: 'act-002',
      status: 'Need Review',
      priority: 'High' as TaskPriority,
      startDate: new Date('2026-02-13'),
      endDate: new Date('2026-02-14'),
      createdById: 'usr-001',
      description: '',
    },
    {
      id: 'tsk-025',
      name: 'Prepare sponsorship proposal deck',
      activityId: 'act-006',
      status: 'In Progress',
      priority: 'Medium' as TaskPriority,
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-21'),
      createdById: 'usr-006',
      description: '',
    },
    {
      id: 'tsk-029',
      name: 'Book photographer for product shoot',
      activityId: 'act-005',
      status: 'To Do',
      priority: 'Low' as TaskPriority,
      startDate: new Date('2026-02-17'),
      endDate: new Date('2026-02-22'),
      createdById: 'usr-005',
      description: '',
    },
    {
      id: 'tsk-035',
      name: 'Create mockup for packaging redesign',
      activityId: 'act-005',
      status: 'Revision',
      priority: 'High' as TaskPriority,
      startDate: new Date('2026-02-12'),
      endDate: new Date('2026-02-19'),
      createdById: 'usr-001',
      description: '',
    },
    {
      id: 'tsk-038',
      name: 'Finalize event rundown',
      activityId: 'act-003',
      status: 'Approved',
      priority: 'Medium' as TaskPriority,
      startDate: new Date('2026-02-08'),
      endDate: new Date('2026-02-15'),
      createdById: 'usr-003',
      description: '',
    },
    {
      id: 'tsk-039',
      name: 'Upload edited reels to drive',
      activityId: 'act-001',
      status: 'In Progress',
      priority: 'Low' as TaskPriority,
      startDate: new Date('2026-02-14'),
      endDate: new Date('2026-02-20'),
      createdById: 'usr-004',
      description: '',
    },
    {
      id: 'tsk-041',
      name: 'Review influencer content draft',
      activityId: 'act-004',
      status: 'Need Review',
      priority: 'High' as TaskPriority,
      startDate: new Date('2026-02-15'),
      endDate: new Date('2026-02-18'),
      createdById: 'usr-001',
      description: 'Review the content drafts submitted by influencer partners for the Q1 collaboration campaign. Check alignment with brand guidelines, tone of voice, and ensure product placement is natural and engaging. Provide detailed feedback if revision is needed — be specific about what needs to change and why.',
    },
    {
      id: 'tsk-045',
      name: 'Draft email blast copy for event invite',
      activityId: 'act-003',
      status: 'To Do',
      priority: 'Medium' as TaskPriority,
      startDate: new Date('2026-02-18'),
      endDate: new Date('2026-02-19'),
      createdById: 'usr-001',
      description: '',
    },
  ];

  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log('  Tasks seeded (10)');

  // ─── Task PICs ──────────────────────────────────────────
  const taskPics = [
    { taskId: 'tsk-012', userId: 'usr-002' },
    { taskId: 'tsk-012', userId: 'usr-004' },
    { taskId: 'tsk-018', userId: 'usr-003' },
    { taskId: 'tsk-023', userId: 'usr-004' },
    { taskId: 'tsk-025', userId: 'usr-004' },
    { taskId: 'tsk-025', userId: 'usr-006' },
    { taskId: 'tsk-029', userId: 'usr-005' },
    { taskId: 'tsk-035', userId: 'usr-002' },
    { taskId: 'tsk-038', userId: 'usr-005' },
    { taskId: 'tsk-038', userId: 'usr-003' },
    { taskId: 'tsk-039', userId: 'usr-004' },
    { taskId: 'tsk-041', userId: 'usr-003' },
    { taskId: 'tsk-041', userId: 'usr-002' },
    { taskId: 'tsk-045', userId: 'usr-006' },
  ];

  for (const tp of taskPics) {
    await prisma.taskPic.upsert({
      where: { taskId_userId: tp },
      update: {},
      create: tp,
    });
  }

  // ─── Task Approvers ─────────────────────────────────────
  const taskApprovers = [
    { taskId: 'tsk-012', userId: 'usr-001' },
    { taskId: 'tsk-023', userId: 'usr-001' },
    { taskId: 'tsk-035', userId: 'usr-001' },
    { taskId: 'tsk-038', userId: 'usr-001' },
    { taskId: 'tsk-041', userId: 'usr-001' },
  ];

  for (const ta of taskApprovers) {
    await prisma.taskApprover.upsert({
      where: { taskId_userId: ta },
      update: {},
      create: ta,
    });
  }
  console.log('  Task PICs & Approvers seeded');

  // ─── Approval Logs ──────────────────────────────────────
  await prisma.approvalLog.upsert({
    where: { id: 'apr-001' },
    update: {},
    create: {
      id: 'apr-001',
      taskId: 'tsk-041',
      reviewerId: 'usr-001',
      action: 'revision',
      feedback: 'The product placement in the third post feels too forced. Please ask the influencer to reshoot with a more natural integration — maybe using the product in their morning routine instead of a direct unboxing.',
      createdAt: new Date('2026-02-16T10:30:00Z'),
    },
  });
  console.log('  Approval Logs seeded (1)');

  // ─── Assignment Logs ────────────────────────────────────
  const assignmentLogs = [
    {
      id: 'asg-001',
      taskId: 'tsk-041',
      changedById: 'usr-001',
      actionType: 'add',
      affectedUserId: 'usr-003',
      createdAt: new Date('2026-02-15T08:00:00Z'),
    },
    {
      id: 'asg-002',
      taskId: 'tsk-041',
      changedById: 'usr-001',
      actionType: 'add',
      affectedUserId: 'usr-002',
      createdAt: new Date('2026-02-15T08:01:00Z'),
    },
  ];

  for (const al of assignmentLogs) {
    await prisma.assignmentLog.upsert({
      where: { id: al.id },
      update: {},
      create: al,
    });
  }
  console.log('  Assignment Logs seeded (2)');

  // ─── Message Templates ──────────────────────────────────
  const messageTemplates = [
    {
      id: 'mt-001',
      name: 'Task Deadline Reminder',
      body: 'Reminder: Task "{{task_name}}" for activity "{{activity_name}}" is due on {{deadline}}. Please ensure it\'s completed on time. PIC: {{pic_name}}',
      placeholders: ['task_name', 'activity_name', 'deadline', 'pic_name'],
      createdAt: new Date('2025-12-01T10:00:00Z'),
    },
    {
      id: 'mt-002',
      name: 'Activity Budget Alert',
      body: 'Budget update for "{{activity_name}}": The deadline is approaching on {{deadline}}. Please review budget allocation and ensure all expenses are submitted. Contact {{pic_name}} for details.',
      placeholders: ['activity_name', 'deadline', 'pic_name'],
      createdAt: new Date('2025-12-15T14:00:00Z'),
    },
    {
      id: 'mt-003',
      name: 'Day-Of Reminder',
      body: 'Today is the day! "{{task_name}}" under "{{activity_name}}" is due today. {{pic_name}}, please make sure everything is wrapped up.',
      placeholders: ['task_name', 'activity_name', 'pic_name'],
      createdAt: new Date('2026-01-10T09:00:00Z'),
    },
    {
      id: 'mt-004',
      name: 'Event Preparation Notice',
      body: 'Heads up! The event "{{activity_name}}" is happening on {{deadline}}. All tasks should be finalized. PIC team: {{pic_name}} — please confirm readiness.',
      placeholders: ['activity_name', 'deadline', 'pic_name'],
      createdAt: new Date('2026-01-20T11:30:00Z'),
    },
    {
      id: 'mt-005',
      name: 'Custom Follow-up',
      body: 'Follow-up on "{{task_name}}" — this task is overdue. {{pic_name}}, please provide a status update for "{{activity_name}}" as soon as possible.',
      placeholders: ['task_name', 'pic_name', 'activity_name'],
      createdAt: new Date('2026-02-05T08:00:00Z'),
    },
  ];

  for (const mt of messageTemplates) {
    await prisma.messageTemplate.upsert({
      where: { id: mt.id },
      update: mt,
      create: mt,
    });
  }
  console.log('  Message Templates seeded (5)');

  // ─── WhatsApp Account ───────────────────────────────────
  await prisma.whatsappAccount.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      apiKeyEncrypted: seedEncrypt('waba_sk_live_abc123def456ghi789jkl012mno3f7a'),
      phoneNumber: '+62 812-3456-7890',
      connectionStatus: 'Connected',
      lastTestedAt: new Date('2026-02-15T08:00:00Z'),
    },
  });
  console.log('  WhatsApp Account seeded');

  // ─── WhatsApp Groups ────────────────────────────────────
  const whatsappGroups = [
    {
      id: 'wg-001',
      name: 'Marketing Team Updates',
      groupIdEncrypted: seedEncrypt('120363012345678901234567890@g.us'),
      type: 'Marketing',
      memberCount: 12,
      lastMessageSentAt: new Date('2026-02-16T08:00:00Z'),
      connectionStatus: 'Connected' as const,
    },
    {
      id: 'wg-002',
      name: 'Marketing-Finance Coordination',
      groupIdEncrypted: seedEncrypt('120363098765432109876543210@g.us'),
      type: 'Marketing-Finance',
      memberCount: 8,
      lastMessageSentAt: new Date('2026-02-14T10:30:00Z'),
      connectionStatus: 'Connected' as const,
    },
  ];

  for (const wg of whatsappGroups) {
    await prisma.whatsappGroup.upsert({
      where: { id: wg.id },
      update: {},
      create: wg,
    });
  }
  console.log('  WhatsApp Groups seeded (2)');

  // ─── Reminders ──────────────────────────────────────────
  const reminders = [
    { id: 'rem-001', activityId: 'act-001', trigger: 'H-7', channel: 'Marketing', templateId: 'mt-001', enabled: true },
    { id: 'rem-002', activityId: 'act-001', trigger: 'H-1', channel: 'Marketing', templateId: 'mt-003', enabled: true },
    { id: 'rem-003', activityId: 'act-003', trigger: 'H-3', channel: 'Marketing', templateId: 'mt-004', enabled: true },
    { id: 'rem-004', activityId: 'act-004', trigger: 'H-7', channel: 'Marketing', templateId: 'mt-001', enabled: true },
  ];

  for (const rem of reminders) {
    await prisma.reminder.upsert({
      where: { id: rem.id },
      update: {},
      create: rem,
    });
  }
  console.log('  Reminders seeded (4)');

  console.log('\nSeed completed successfully!');
  console.log('Login credentials:');
  console.log('  Email: alex.morgan@company.com');
  console.log('  Password: Password123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
