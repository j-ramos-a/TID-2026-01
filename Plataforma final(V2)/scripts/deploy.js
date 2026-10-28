// scripts/deploy.js
// ============================================================
// Despliegue UUPS Proxy NUEVO (storage limpio) de QandA_platform_V2
// en Sepolia, reutilizando el ComSCiForwarder existente.
// ============================================================
const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Forwarder EIP-2771 existente en Sepolia (reutilizado)
const FORWARDER_ADDRESS = "0x9f0F92eF187c7b965ff6D3a85Ff62F53F4F2B78A";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  🚀  Desplegando NUEVO Proxy QandA_platform_V2 (storage limpio)");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Red:       ${network.name}`);
  console.log(`  Chain ID:  ${network.config.chainId ?? (await ethers.provider.getNetwork()).chainId}`);
  console.log(`  Deployer:  ${deployerAddress}`);
  console.log(`  Forwarder: ${FORWARDER_ADDRESS}`);

  const balanceWei = await ethers.provider.getBalance(deployerAddress);
  console.log(`  Balance:   ${ethers.formatEther(balanceWei)} ETH`);
  console.log("═══════════════════════════════════════════════════════\n");

  if (balanceWei === 0n) {
    throw new Error(
      "❌ La cuenta deployer no tiene fondos. Obtén SepoliaETH en https://sepoliafaucet.com"
    );
  }

  // ── 1. Desplegar nuevo proxy UUPS con implementación V2 ──
  const QandA_V2 = await ethers.getContractFactory("QandA_platform_V2");

  console.log("⏳ Desplegando nuevo proxy ERC1967 + implementación V2...\n");

  const proxy = await upgrades.deployProxy(QandA_V2, [deployerAddress], {
    initializer: "initialize",
    kind: "uups",
    constructorArgs: [FORWARDER_ADDRESS],
  });

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();

  // Configurar trusted forwarder en storage (initializeV2) para compatibilidad
  console.log("⏳ Configurando trusted forwarder (initializeV2)...\n");
  const txInitV2 = await proxy.initializeV2(FORWARDER_ADDRESS);
  await txInitV2.wait();

  const implementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);

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

  // ── 2. Cargar ABIs compilados ─────────────────────────────
  const v2ArtifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "QandA_platform_V2.sol",
    "QandA_platform_V2.json"
  );
  const v2Artifact = JSON.parse(fs.readFileSync(v2ArtifactPath, "utf8"));
  const abi = v2Artifact.abi;

  const forwarderArtifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "ComSCiForwarder.sol",
    "ComSCiForwarder.json"
  );
  const forwarderArtifact = JSON.parse(
    fs.readFileSync(forwarderArtifactPath, "utf8")
  );

  // ── 3. Exportar contractData.json para el frontend ────────
  const contractData = {
    network: network.name,
    chainId,
    version: "2.0.0",
    proxyAddress,
    implementationAddress,
    deployerAddress,
    deploymentTxHash: deployTxHash,
    deploymentBlock: deploymentBlock,
    deployedAt,
    forwarderAddress: FORWARDER_ADDRESS,
    forwarderDomainName: "ComSCiForwarder",
    forwarderDomainVersion: "1",
    forwarderAbi: forwarderArtifact.abi,
    abi,
  };

  const outputDir = path.join(__dirname, "..", "frontend", "src", "config");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "contractData.json");
  fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
  console.log(`✅ contractData.json guardado en: ${outputPath}\n`);

  // ── 4. Resumen ────────────────────────────────────────────
  const explorerBase =
    chainId === 11155111
      ? "https://sepolia.etherscan.io"
      : "https://etherscan.io";

  console.log("═══════════════════════════════════════════════════════");
  console.log("  ✅  DESPLIEGUE EXITOSO (NUEVO PROXY)");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Proxy:            ${proxyAddress}`);
  console.log(`  Implementación:   ${implementationAddress}`);
  console.log(`  Forwarder:        ${FORWARDER_ADDRESS}`);
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
