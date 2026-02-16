import { AppDataSource } from '../config/data-source';
import { UserRole } from '../constants/roles';
import { User } from '../entities/User';
import { hashPassword } from '../utils/password';

const seedUsers = [
  {
    name: 'System Admin',
    email: 'admin@workorder.local',
    password: 'Admin#12345',
    role: UserRole.ADMIN,
    isLead: false
  },
  {
    name: 'Lead Agent',
    email: 'lead.agent@workorder.local',
    password: 'Agent#12345',
    role: UserRole.AGENT,
    isLead: true
  },
  {
    name: 'Support Agent',
    email: 'agent@workorder.local',
    password: 'Agent#12345',
    role: UserRole.AGENT,
    isLead: false
  },
  {
    name: 'Request User',
    email: 'requester@workorder.local',
    password: 'Requester#12345',
    role: UserRole.REQUESTER,
    isLead: false
  }
];

const runSeed = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);

  for (const userSeed of seedUsers) {
    const existing = await userRepo.findOne({ where: { email: userSeed.email } });
    if (existing) {
      continue;
    }

    const user = userRepo.create({
      name: userSeed.name,
      email: userSeed.email,
      passwordHash: await hashPassword(userSeed.password),
      role: userSeed.role,
      isLead: userSeed.isLead
    });

    await userRepo.save(user);
  }

  // eslint-disable-next-line no-console
  console.log('Seed completed successfully.');
  await AppDataSource.destroy();
};

runSeed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
