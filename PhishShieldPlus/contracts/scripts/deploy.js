const hre = require("hardhat");

async function main() {
  const contract = await hre.ethers.deployContract("PhishShieldLog");

  await contract.waitForDeployment();

  console.log("PhishShieldLog deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
