const notYetDeployed = null;
export const POOL_PROGRAM_IDS = [
  null, //no pool with token count 0
  "Sw1LeM87T6PEh3ydfc7PqRN3PG1RCFBGthUPSsPa3p5", //swimLake program id
  "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs", //meta pools program id
  notYetDeployed,
  notYetDeployed,
  notYetDeployed,
  "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC", //hexapool program id
];

//see pool repo pool_fee.rs (technical debt in how fees are stored)
export const POOL_FEE_DECIMALS = 6;

//see pool repo decimal.rs U64 type
export const POOL_DECIMAL_MAX_DECIMALS = 19;
export const POOL_DECIMAL_MAX_BITS = 64;
