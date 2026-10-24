const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Auditoría de Storage Layout y Optimización de Gas", function () {
  let QandA_V1, QandA_V2, ComSCiForwarder;
  let proxy, forwarder;
  let owner, user1, user2;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    QandA_V1 = await ethers.getContractFactory("QandA_platform");
    QandA_V2 = await ethers.getContractFactory("QandA_platform_V2");
    ComSCiForwarder = await ethers.getContractFactory("ComSCiForwarder");
  });

  it("1. Validación formal de Storage Layout con OpenZeppelin upgrades.validateUpgrade", async function () {
    // Desplegar Proxy V1 inicial
    proxy = await upgrades.deployProxy(QandA_V1, [await owner.getAddress()], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxy.waitForDeployment();

    // Valida formalmente que V2 sea 100% compatible con el storage layout del proxy desplegado
    await expect(
      upgrades.validateUpgrade(proxy, QandA_V2, {
        kind: "uups",
        constructorArgs: [ethers.ZeroAddress],
        unsafeAllow: ["state-variable-immutable", "constructor"],
      })
    ).to.not.be.reverted;
  });

  it("2. Verificación de persistencia de datos y ejecución tras el upgrade", async function () {
    const proxyAddress = await proxy.getAddress();

    // Crear preguntas y respuestas en V1
    await proxy.connect(user1).askQuestion("Pregunta inicial V1", "Texto en V1");
    await proxy.connect(user2).answerQuestion(1, "Respuesta inicial V1");
    await proxy.connect(user1).voteAnswer(1, 1); // like

    // Desplegar Forwarder y actualizar a V2
    forwarder = await ComSCiForwarder.deploy();
    await forwarder.waitForDeployment();
    const forwarderAddress = await forwarder.getAddress();

    proxy = await upgrades.upgradeProxy(proxyAddress, QandA_V2, {
      kind: "uups",
      constructorArgs: [forwarderAddress],
      call: {
        fn: "initializeV2",
        args: [forwarderAddress],
      },
    });

    // Validar que los datos de V1 continúan intactos
    const q1 = await proxy.getQuestion(1);
    expect(q1.title).to.equal("Pregunta inicial V1");
    expect(q1.author).to.equal(await user1.getAddress());

    const answers = await proxy.getAnswersForQuestion(1);
    expect(answers.length).to.equal(1);
    expect(answers[0].likes).to.equal(1);
    expect(answers[0].author).to.equal(await user2.getAddress());
  });

  it("3. Comparativa de Gas: Almacenar Texto Largo vs. Referencia IPFS CID", async function () {
    const title = "Consulta de prueba de gas";
    
    // Texto largo típico (ej. 1500 caracteres de código / descripción)
    const longText = "A".repeat(1500);
    // CID de IPFS v1 (ej. bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi, 59 caracteres)
    const ipfsCid = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    // Medir gas con texto largo on-chain
    const txLong = await proxy.connect(user1).askQuestion(title, longText);
    const receiptLong = await txLong.wait();
    const gasLongText = receiptLong.gasUsed;

    // Medir gas con CID de IPFS
    const txIpfs = await proxy.connect(user1).askQuestion(title, ipfsCid);
    const receiptIpfs = await txIpfs.wait();
    const gasIpfs = receiptIpfs.gasUsed;

    console.log("\n  ───────────────────────────────────────────────────────");
    console.log(`  ⛽ Gas con Texto Largo On-Chain (1500 chars): ${gasLongText.toString()}`);
    console.log(`  ⚡ Gas con Referencia IPFS CID (59 chars):    ${gasIpfs.toString()}`);
    const ahorroGas = gasLongText - gasIpfs;
    const porcentajeAhorro = ((Number(ahorroGas) / Number(gasLongText)) * 100).toFixed(2);
    console.log(`  🎉 Ahorro absoluto de Gas:                    ${ahorroGas.toString()} gas (${porcentajeAhorro}% de reducción!)`);
    console.log("  ───────────────────────────────────────────────────────\n");

    expect(gasIpfs).to.be.lessThan(gasLongText);
  });
});
