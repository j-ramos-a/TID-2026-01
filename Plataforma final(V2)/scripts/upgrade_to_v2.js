// scripts/upgrade_to_v2.js
// ============================================================
// Despliegue de Forwarder EIP-2771 y Actualización a V2 (UUPS)
// ============================================================
const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  🚀  Actualizando QandA_platform a V2 (EIP-2771 Gasless)");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Red:       ${network.name}`);
  console.log(`  Deployer:  ${deployerAddress}`);

  const balanceWei = await ethers.provider.getBalance(deployerAddress);
  console.log(`  Balance:   ${ethers.formatEther(balanceWei)} ETH\n`);

  if (balanceWei === 0n) {
    throw new Error(
      "❌ La cuenta deployer no tiene fondos de SepoliaETH para pagar el gas de la actualización."
    );
  }

  // ── 1. Cargar datos del despliegue existente ───────────────
  const contractDataPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "config",
    "contractData.json"
  );

  if (!fs.existsSync(contractDataPath)) {
    throw new Error(`❌ No se encontró el archivo: ${contractDataPath}`);
  }

  const contractData = JSON.parse(fs.readFileSync(contractDataPath, "utf8"));
  const proxyAddress = contractData.proxyAddress;

  if (!proxyAddress) {
    throw new Error("❌ No se encontró proxyAddress en contractData.json");
  }

  console.log(`  Proxy existente (UUPS): ${proxyAddress}`);
  console.log(`  Implementación actual:  ${contractData.implementationAddress}\n`);

  // ── 2. Desplegar Forwarder (ComSCiForwarder) si no existe ──
  let forwarderAddress = contractData.forwarderAddress;

  if (!forwarderAddress) {
    console.log("⏳ Desplegando contrato ERC2771Forwarder (ComSCiForwarder)...");
    const ForwarderFactory = await ethers.getContractFactory("ComSCiForwarder");
    const forwarder = await ForwarderFactory.deploy();
    await forwarder.waitForDeployment();

    forwarderAddress = await forwarder.getAddress();
    console.log(`✅ Forwarder desplegado exitosamente en: ${forwarderAddress}\n`);
  } else {
    console.log(`ℹ️ Usando Forwarder existente en: ${forwarderAddress}\n`);
  }

  // ── 3. Actualizar el Proxy a QandA_platform_V2 ─────────────
  console.log(`⏳ Actualizando implementación del Proxy hacia QandA_platform_V2...`);
  const QandA_V2 = await ethers.getContractFactory("QandA_platform_V2");

  // upgradeProxy verifica storage layout y ejecuta initializeV2
  const upgradedProxy = await upgrades.upgradeProxy(proxyAddress, QandA_V2, {
    kind: "uups",
    constructorArgs: [forwarderAddress],
    call: {
      fn: "initializeV2",
      args: [forwarderAddress],
    },
  });

  await upgradedProxy.waitForDeployment();
  const verifiedProxyAddress = await upgradedProxy.getAddress();

  // Validar regla estricta: Proxy address DEBE ser idéntica
  if (verifiedProxyAddress.toLowerCase() !== proxyAddress.toLowerCase()) {
    throw new Error(
      `❌ Error crítico: La dirección del proxy cambió de ${proxyAddress} a ${verifiedProxyAddress}`
    );
  }

  const newImplementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`✅ Proxy actualizado exitosamente!`);
  console.log(`   Proxy (permanece idéntico): ${proxyAddress}`);
  console.log(`   Nueva Implementación V2:    ${newImplementationAddress}\n`);

  // ── 4. Cargar ABIs compilados ─────────────────────────────
  const v2ArtifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "QandA_platform_V2.sol",
    "QandA_platform_V2.json"
  );
  const v2Artifact = JSON.parse(fs.readFileSync(v2ArtifactPath, "utf8"));

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

  // ── 5. Actualizar contractData.json para el frontend ───────
  const updatedContractData = {
    ...contractData,
    version: "2.0.0",
    proxyAddress: proxyAddress, // Inmutable
    implementationAddress: newImplementationAddress, // Nueva V2
    previousImplementationAddress: contractData.implementationAddress,
    forwarderAddress: forwarderAddress,
    forwarderDomainName: "ComSCiForwarder",
    forwarderDomainVersion: "1",
    upgradedAt: new Date().toISOString(),
    forwarderAbi: forwarderArtifact.abi,
    abi: v2Artifact.abi,
  };

  fs.writeFileSync(
    contractDataPath,
    JSON.stringify(updatedContractData, null, 2)
  );
  console.log(`✅ contractData.json actualizado con éxito en: ${contractDataPath}\n`);

  // ── 6. Resumen en consola ─────────────────────────────────
  const chainId =
    network.config.chainId ??
    Number((await ethers.provider.getNetwork()).chainId);
  const explorerBase =
    chainId === 11155111
      ? "https://sepolia.etherscan.io"
      : "https://etherscan.io";

  console.log("═══════════════════════════════════════════════════════");
  console.log("  🎉  ACTUALIZACIÓN A V2 COMPLETADA EXITOSAMENTE");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Proxy (Inmutable):      ${proxyAddress}`);
  console.log(`  Nueva Implementación:   ${newImplementationAddress}`);
  console.log(`  Forwarder (EIP-2771):   ${forwarderAddress}`);
  console.log(`  Deployer / Relayer:     ${deployerAddress}`);
  console.log("───────────────────────────────────────────────────────");
  console.log(`  🔗 Proxy en Etherscan:`);
  console.log(`     ${explorerBase}/address/${proxyAddress}`);
  console.log(`  🔗 Nueva Implementación en Etherscan:`);
  console.log(`     ${explorerBase}/address/${newImplementationAddress}`);
  console.log(`  🔗 Forwarder en Etherscan:`);
  console.log(`     ${explorerBase}/address/${forwarderAddress}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error("❌ Error en la actualización:", error);
  process.exitCode = 1;
});
