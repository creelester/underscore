import process from 'process';
import { auth } from '../src/lib/auth';
import { env } from '../src/config/env';

async function main() {
  // This file is wired to Prisma's "seed" hook, so it runs on `migrate dev`,
  // `migrate reset`, and `db seed` — any of which could be pointed at production.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('refusing to seed production');
  }

  const email = env.SEED_USER_EMAIL;
  const password = env.SEED_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_USER_EMAIL and SEED_USER_PASSWORD must be set to seed');
  }

  const existing = await auth.api
    .signInEmail({ body: { email, password } })
    .catch(() => null);

  if (existing) {
    console.log(`Seed user already exists: ${email}`);
    return;
  }

  await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: 'Test User',
    },
  });

  console.log(`Seed user created: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
