const notYetDeployed = null;
export const POOL_PROGRAM_IDS = [
  null, //no pool with token count 0
  notYetDeployed, //swimLake program id
  notYetDeployed,
  notYetDeployed,
  notYetDeployed,
  notYetDeployed,
  "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC", // hexapool program id
];

//see pool repo pool_fee.rs (technical debt in how fees are stored)
export const POOL_FEE_DECIMALS = 6;

//see pool repo decimal.rs U64 type
export const POOL_DECIMAL_MAX_DECIMALS = 19;
export const POOL_DECIMAL_MAX_BITS = 64;
