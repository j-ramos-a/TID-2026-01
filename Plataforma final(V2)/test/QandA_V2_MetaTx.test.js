const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("QandA_platform_V2 + ERC2771Forwarder (Meta-Transacciones)", function () {
  let proxy;
  let forwarder;
  let owner, relayer, user1, user2;
  let domain, types;

  beforeEach(async function () {
    [owner, relayer, user1, user2] = await ethers.getSigners();

    // 1. Desplegar V1
    const QandA_V1 = await ethers.getContractFactory("QandA_platform");
    proxy = await upgrades.deployProxy(QandA_V1, [await owner.getAddress()], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxy.waitForDeployment();

    // Crear una pregunta en V1 para verificar persistencia tras upgrade
    await proxy.connect(user1).askQuestion("Pregunta V1", "Contenido V1", 0);

    // 2. Desplegar Forwarder
    const ForwarderFactory = await ethers.getContractFactory("ComSCiForwarder");
    forwarder = await ForwarderFactory.deploy();
    await forwarder.waitForDeployment();

    const forwarderAddress = await forwarder.getAddress();
    const proxyAddress = await proxy.getAddress();

    // 3. Upgrade a V2 con constructor args para ERC2771ContextUpgradeable
    const QandA_V2 = await ethers.getContractFactory("QandA_platform_V2");
    proxy = await upgrades.upgradeProxy(proxyAddress, QandA_V2, {
      kind: "uups",
      constructorArgs: [forwarderAddress],
      call: {
        fn: "initializeV2",
        args: [forwarderAddress],
      },
    });

    // Configurar tipos EIP-712 para ForwardRequest
    const network = await ethers.provider.getNetwork();
    domain = {
      name: "ComSCiForwarder",
      version: "1",
      chainId: network.chainId,
      verifyingContract: forwarderAddress,
    };

    types = {
      ForwardRequest: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "gas", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint48" },
        { name: "data", type: "bytes" },
      ],
    };
  });

  it("Debe conservar la dirección del Proxy y los datos existentes de V1", async function () {
    const qCount = await proxy.questionCount();
    expect(qCount).to.equal(1);

    const q1 = await proxy.getQuestion(1);
    expect(q1.title).to.equal("Pregunta V1");
    expect(q1.author).to.equal(await user1.getAddress());
  });

  it("Debe tener registrado el trustedForwarder correcto", async function () {
    const forwarderAddress = await forwarder.getAddress();
    expect(await proxy.trustedForwarder()).to.equal(forwarderAddress);
    expect(await proxy.isTrustedForwarder(forwarderAddress)).to.be.true;
    expect(await proxy.isTrustedForwarder(await owner.getAddress())).to.be.false;
  });

  it("Debe permitir llamadas directas tradicionales desde el usuario", async function () {
    await proxy.connect(user2).askQuestion("Pregunta directa", "Contenido directo", 0);
    const q2 = await proxy.getQuestion(2);
    expect(q2.author).to.equal(await user2.getAddress());
    expect(q2.title).to.equal("Pregunta directa");
  });

  it("Debe ejecutar meta-transacción askQuestion gasless firmada por user2 y enviada por relayer", async function () {
    const user2Address = await user2.getAddress();
    const proxyAddress = await proxy.getAddress();

    const data = proxy.interface.encodeFunctionData("askQuestion", [
      "¿Cómo funciona EIP-2771?",
      "Pregunta patrocinada por el relayer sin gas",
      0,
    ]);

    const nonce = await forwarder.nonces(user2Address);
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const message = {
      from: user2Address,
      to: proxyAddress,
      value: 0n,
      gas: 300000n,
      nonce: nonce,
      deadline: deadline,
      data: data,
    };

    // user2 firma criptográficamente (sin pagar gas)
    const signature = await user2.signTypedData(domain, types, message);

    const forwardRequest = {
      ...message,
      signature: signature,
    };

    // Verificar en el forwarder
    expect(await forwarder.verify(forwardRequest)).to.be.true;

    // Relayer envía y paga la transacción
    const tx = await forwarder.connect(relayer).execute(forwardRequest);
    await tx.wait();

    // Comprobar que el autor registrado es user2 y NO el relayer
    const qCount = await proxy.questionCount();
    expect(qCount).to.equal(2);

    const q2 = await proxy.getQuestion(2);
    expect(q2.author).to.equal(user2Address);
    expect(q2.title).to.equal("¿Cómo funciona EIP-2771?");
    expect(q2.content).to.equal("Pregunta patrocinada por el relayer sin gas");
    expect(Number(q2.category)).to.equal(0);
  });

  it("Debe ejecutar meta-transacción answerQuestion y voteAnswer gasless", async function () {
    const user1Address = await user1.getAddress();
    const user2Address = await user2.getAddress();
    const proxyAddress = await proxy.getAddress();

    // 1. user2 responde a la pregunta 1 de forma gasless
    const answerData = proxy.interface.encodeFunctionData("answerQuestion", [
      1,
      "Respuesta patrocinada sin gas",
    ]);

    const nonce1 = await forwarder.nonces(user2Address);
    const deadline1 = Math.floor(Date.now() / 1000) + 3600;

    const reqAnswer = {
      from: user2Address,
      to: proxyAddress,
      value: 0n,
      gas: 300000n,
      nonce: nonce1,
      deadline: deadline1,
      data: answerData,
    };

    const sigAnswer = await user2.signTypedData(domain, types, reqAnswer);
    await forwarder.connect(relayer).execute({ ...reqAnswer, signature: sigAnswer });

    const answers = await proxy.getAnswersForQuestion(1);
    expect(answers.length).to.equal(1);
    expect(answers[0].author).to.equal(user2Address);
    expect(answers[0].content).to.equal("Respuesta patrocinada sin gas");

    // 2. user1 vota Like a la respuesta 1 de forma gasless
    const voteData = proxy.interface.encodeFunctionData("voteAnswer", [1, 1]); // 1 = like
    const nonce2 = await forwarder.nonces(user1Address);
    const deadline2 = Math.floor(Date.now() / 1000) + 3600;

    const reqVote = {
      from: user1Address,
      to: proxyAddress,
      value: 0n,
      gas: 300000n,
      nonce: nonce2,
      deadline: deadline2,
      data: voteData,
    };

    const sigVote = await user1.signTypedData(domain, types, reqVote);
    await forwarder.connect(relayer).execute({ ...reqVote, signature: sigVote });

    const ansUpdated = await proxy.answers(1);
    expect(ansUpdated.likes).to.equal(1);

    // user2 recibió 1 like
    const u2Data = await proxy.users(user2Address);
    expect(u2Data.received_likes).to.equal(1);
  });
});
