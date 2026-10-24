// scripts/deploy.js
// ============================================================
// Despliegue UUPS Proxy del contrato QandA_platform en Sepolia
// ============================================================
const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // ── 1. Obtener la cuenta desplegadora ──────────────────────
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  🚀  Desplegando QandA_platform (UUPS Proxy)");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Red:       ${network.name}`);
  console.log(`  Chain ID:  ${network.config.chainId ?? (await ethers.provider.getNetwork()).chainId}`);
  console.log(`  Deployer:  ${deployerAddress}`);

  const balanceWei = await ethers.provider.getBalance(deployerAddress);
  const balanceEth = ethers.formatEther(balanceWei);
  console.log(`  Balance:   ${balanceEth} ETH`);
  console.log("═══════════════════════════════════════════════════════\n");

  if (balanceWei === 0n) {
    throw new Error(
      "❌ La cuenta deployer no tiene fondos. Obtén SepoliaETH en https://sepoliafaucet.com"
    );
  }

  // ── 2. Desplegar con upgrades.deployProxy (UUPS) ──────────
  const QandA = await ethers.getContractFactory("QandA_platform");

  console.log("⏳ Desplegando proxy ERC1967 + implementación...\n");

  const proxy = await upgrades.deployProxy(QandA, [deployerAddress], {
    initializer: "initialize",
    kind: "uups",
  });

  await proxy.waitForDeployment();

  // ── 3. Recopilar información del despliegue ───────────────
  const proxyAddress = await proxy.getAddress();
  const implementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);

  // Obtener hash de la transacción de despliegue y bloque
  const deployTx = proxy.deploymentTransaction();
  const deployTxHash = deployTx ? deployTx.hash : "N/A";
  let deploymentBlock = "N/A";

  if (deployTx) {
    const receipt = await deployTx.wait();
    deploymentBlock = receipt.blockNumber;
  }

  const chainId =
    network.config.chainId ??
    Number((await ethers.provider.getNetwork()).chainId);

  const deployedAt = new Date().toISOString();

  // ── 4. Obtener el ABI del contrato compilado ──────────────
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "Plataforma_Pagina.sol",
    "QandA_platform.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // ── 5. Exportar contractData.json para el frontend ────────
  const contractData = {
    network: network.name,
    chainId,
    proxyAddress,
    implementationAddress,
    deployerAddress,
    deploymentTxHash: deployTxHash,
    deploymentBlock: deploymentBlock,
    deployedAt,
    abi,
  };

  const outputDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "config"
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "contractData.json");
  fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
  console.log(`✅ contractData.json guardado en: ${outputPath}\n`);

  // ── 6. Resumen en consola ─────────────────────────────────
  const explorerBase =
    chainId === 11155111
      ? "https://sepolia.etherscan.io"
      : "https://etherscan.io";

  console.log("═══════════════════════════════════════════════════════");
  console.log("  ✅  DESPLIEGUE EXITOSO");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Proxy:            ${proxyAddress}`);
  console.log(`  Implementación:   ${implementationAddress}`);
  console.log(`  Deployer:         ${deployerAddress}`);
  console.log(`  Tx Hash:          ${deployTxHash}`);
  console.log(`  Bloque:           ${deploymentBlock}`);
  console.log(`  Timestamp:        ${deployedAt}`);
  console.log("───────────────────────────────────────────────────────");
  console.log(`  🔗 Proxy en Etherscan:`);
  console.log(`     ${explorerBase}/address/${proxyAddress}`);
  console.log(`  🔗 Implementación en Etherscan:`);
  console.log(`     ${explorerBase}/address/${implementationAddress}`);
  console.log(`  🔗 Transacción de despliegue:`);
  console.log(`     ${explorerBase}/tx/${deployTxHash}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error("❌ Error en el despliegue:", error);
  process.exitCode = 1;
});
