import { createApp } from "./app";
import { env } from "./config/env";
import { startExpiredRowReaper } from "./lib/expiredRowReaper";

const app = createApp();

// Not inside createApp(): building an Express instance shouldn't spawn a timer.
startExpiredRowReaper();

app.listen(env.PORT, () => {
  console.log(`server listening on :${env.PORT}`);
});
