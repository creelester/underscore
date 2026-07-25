import { auth } from "../src/lib/auth";
import { env } from "../src/config/env";

async function main() {
  const email = env.SEED_USER_EMAIL;
  const password = env.SEED_USER_PASSWORD;

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
      name: "Test User",
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
