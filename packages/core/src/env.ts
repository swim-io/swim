<<<<<<< HEAD
<<<<<<< HEAD
/** The various environments in which Swim might be used */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
=======
/** The various environments in which Swim might be used */
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Local = "Local",
  Custom = "Custom",
}

<<<<<<< HEAD
<<<<<<< HEAD
export const isValidEnv = (env: string): env is Env =>
  (Object.values(Env) as readonly string[]).includes(env);
=======
export const isValidEnv = (envValue: string): envValue is Env =>
  (Object.values(Env) as readonly string[]).includes(envValue);
>>>>>>> aa8ce89c (feat(core): Add package)
=======
export const isValidEnv = (env: string): env is Env =>
  (Object.values(Env) as readonly string[]).includes(env);
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
