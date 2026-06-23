import { AppDataSource } from '../config/database';
import { User, Project, Task } from '../entities';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('[Seed]: Connecting to database...');
  await AppDataSource.initialize();
  console.log('[Seed]: Database connected successfully.');

  const userRepository = AppDataSource.getRepository(User);
  const projectRepository = AppDataSource.getRepository(Project);
  const taskRepository = AppDataSource.getRepository(Task);

  // Check if users exist
  const existingUsersCount = await userRepository.count();
  if (existingUsersCount > 0) {
    console.log('[Seed]: Users already exist in database. Skipping seed.');
    await AppDataSource.destroy();
    return;
  }

  console.log('[Seed]: Hashing passwords...');
  const adminPasswordHash = await bcrypt.hash('AdminPass123', 10);
  const memberPasswordHash = await bcrypt.hash('MemberPass123', 10);

  console.log('[Seed]: Creating User entities...');
  
  // Create Admin
  const admin = new User();
  admin.name = 'Admin User';
  admin.email = 'admin@taskmanager.com';
  admin.password = adminPasswordHash;
  admin.role = 'admin';
  await userRepository.save(admin);
  console.log('[Seed]: Created Admin User (admin@taskmanager.com)');

  // Create Member
  const member = new User();
  member.name = 'Member User';
  member.email = 'member@taskmanager.com';
  member.password = memberPasswordHash;
  member.role = 'member';
  await userRepository.save(member);
  console.log('[Seed]: Created Member User (member@taskmanager.com)');

  console.log('[Seed]: Creating Project entities...');
  
  // Project for member
  const memberProject = new Project();
  memberProject.title = 'Personal Portfolio';
  memberProject.description = 'A project to build my online personal developer portfolio.';
  memberProject.status = 'in_progress';
  memberProject.user = member;
  await projectRepository.save(memberProject);
  console.log('[Seed]: Created Project "Personal Portfolio" for Member User');

  // Project for admin
  const adminProject = new Project();
  adminProject.title = 'System Upgrade';
  adminProject.description = 'Database and system server scaling upgrades.';
  adminProject.status = 'planned';
  adminProject.user = admin;
  await projectRepository.save(adminProject);
  console.log('[Seed]: Created Project "System Upgrade" for Admin User');

  console.log('[Seed]: Creating Task entities...');

  // Task 1 for member project
  const task1 = new Task();
  task1.title = 'Design UI/UX Mockups';
  task1.description = 'Create wireframes and mockups for the landing page.';
  task1.status = 'done';
  task1.priority = 'high';
  task1.dueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // 3 days from now
  task1.project = memberProject;
  await taskRepository.save(task1);

  // Task 2 for member project
  const task2 = new Task();
  task2.title = 'Setup Express Backend';
  task2.description = 'Initialize the Node/Express backend with routing and auth.';
  task2.status = 'in_progress';
  task2.priority = 'high';
  task2.dueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days from now
  task2.project = memberProject;
  await taskRepository.save(task2);

  // Task 3 for member project
  const task3 = new Task();
  task3.title = 'Write Deployment Script';
  task3.description = 'Configure CI/CD and deployment configuration.';
  task3.status = 'pending';
  task3.priority = 'medium';
  task3.dueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 days from now
  task3.project = memberProject;
  await taskRepository.save(task3);

  console.log('[Seed]: Tasks created successfully.');
  console.log('[Seed]: Seeding complete!');

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('[Seed] Failed:', error);
  process.exit(1);
});
