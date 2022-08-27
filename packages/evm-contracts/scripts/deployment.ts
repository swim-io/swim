import { deployment } from "../src/deployment";

deployment(true)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
