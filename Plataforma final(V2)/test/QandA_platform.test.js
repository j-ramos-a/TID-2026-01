// test/QandA_platform.test.js
// ============================================================
// Tests unitarios para QandA_platform (UUPS Proxy)
// ============================================================
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("QandA_platform (UUPS Proxy)", function () {
  let qanda;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const QandA = await ethers.getContractFactory("QandA_platform");
    qanda = await upgrades.deployProxy(
      QandA,
      [await owner.getAddress()],
      { initializer: "initialize", kind: "uups" }
    );
    await qanda.waitForDeployment();
  });

  describe("Inicialización", function () {
    it("Debe asignar el owner correcto", async function () {
      expect(await qanda.owner()).to.equal(await owner.getAddress());
    });

    it("Debe empezar con contadores en 0", async function () {
      expect(await qanda.questionCount()).to.equal(0);
      expect(await qanda.answerCount()).to.equal(0);
    });

    it("No debe permitir reinicializar", async function () {
      await expect(
        qanda.initialize(await user1.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Preguntas", function () {
    it("Debe crear una pregunta correctamente", async function () {
      await expect(
        qanda.connect(user1).askQuestion("¿Qué es Solidity?", "Quiero aprender Solidity.")
      )
        .to.emit(qanda, "QuestionCreated")
        .withArgs(1, await user1.getAddress(), "¿Qué es Solidity?", (ts) => ts > 0);

      expect(await qanda.questionCount()).to.equal(1);

      const q = await qanda.getQuestion(1);
      expect(q.id).to.equal(1);
      expect(q.author).to.equal(await user1.getAddress());
      expect(q.title).to.equal("¿Qué es Solidity?");
    });

    it("Debe revertir con título vacío", async function () {
      await expect(
        qanda.connect(user1).askQuestion("", "contenido")
      ).to.be.revertedWithCustomError(qanda, "EmptyTitle");
    });

    it("Debe revertir con contenido vacío", async function () {
      await expect(
        qanda.connect(user1).askQuestion("titulo", "")
      ).to.be.revertedWithCustomError(qanda, "EmptyContent");
    });

    it("Debe revertir al consultar pregunta inexistente", async function () {
      await expect(
        qanda.getQuestion(999)
      ).to.be.revertedWithCustomError(qanda, "QuestionNotFound");
    });
  });

  describe("Respuestas", function () {
    beforeEach(async function () {
      await qanda.connect(user1).askQuestion("Pregunta 1", "Contenido 1");
    });

    it("Debe crear una respuesta correctamente", async function () {
      await expect(
        qanda.connect(user2).answerQuestion(1, "Esta es mi respuesta")
      )
        .to.emit(qanda, "AnswerCreated")
        .withArgs(1, 1, await user2.getAddress(), (ts) => ts > 0);

      expect(await qanda.answerCount()).to.equal(1);
    });

    it("Debe revertir con contenido vacío", async function () {
      await expect(
        qanda.connect(user2).answerQuestion(1, "")
      ).to.be.revertedWithCustomError(qanda, "EmptyContent");
    });

    it("Debe revertir si la pregunta no existe", async function () {
      await expect(
        qanda.connect(user2).answerQuestion(999, "respuesta")
      ).to.be.revertedWithCustomError(qanda, "QuestionNotFound");
    });

    it("Debe retornar las respuestas de una pregunta", async function () {
      await qanda.connect(user2).answerQuestion(1, "Respuesta A");
      await qanda.connect(user1).answerQuestion(1, "Respuesta B");

      const answers = await qanda.getAnswersForQuestion(1);
      expect(answers.length).to.equal(2);
      expect(answers[0].content).to.equal("Respuesta A");
      expect(answers[1].content).to.equal("Respuesta B");
    });
  });

  describe("Votos", function () {
    beforeEach(async function () {
      await qanda.connect(user1).askQuestion("Pregunta 1", "Contenido 1");
      await qanda.connect(user2).answerQuestion(1, "Respuesta 1");
    });

    it("Debe permitir dar like a una respuesta", async function () {
      await expect(
        qanda.connect(user1).voteAnswer(1, 1) // 1 = like
      )
        .to.emit(qanda, "AnswerVoted")
        .withArgs(1, await user1.getAddress(), 1, await user2.getAddress());

      const a = await qanda.answers(1);
      expect(a.likes).to.equal(1);
    });

    it("Debe permitir dar dislike a una respuesta", async function () {
      await qanda.connect(user1).voteAnswer(1, 2); // 2 = dislike
      const a = await qanda.answers(1);
      expect(a.dislikes).to.equal(1);
    });

    it("Debe revertir si vota None", async function () {
      await expect(
        qanda.connect(user1).voteAnswer(1, 0)
      ).to.be.revertedWithCustomError(qanda, "InvalidVote");
    });

    it("Debe revertir si vota su propia respuesta", async function () {
      await expect(
        qanda.connect(user2).voteAnswer(1, 1)
      ).to.be.revertedWithCustomError(qanda, "CannotVoteOwnAnswer");
    });

    it("Debe revertir si repite el mismo voto", async function () {
      await qanda.connect(user1).voteAnswer(1, 1);
      await expect(
        qanda.connect(user1).voteAnswer(1, 1)
      ).to.be.revertedWithCustomError(qanda, "AlreadyVoted");
    });

    it("Debe permitir cambiar de like a dislike", async function () {
      await qanda.connect(user1).voteAnswer(1, 1); // like
      await qanda.connect(user1).voteAnswer(1, 2); // dislike

      const a = await qanda.answers(1);
      expect(a.likes).to.equal(0);
      expect(a.dislikes).to.equal(1);
    });

    it("Debe revertir si la respuesta no existe", async function () {
      await expect(
        qanda.connect(user1).voteAnswer(999, 1)
      ).to.be.revertedWithCustomError(qanda, "AnswerNotFound");
    });

    it("Debe actualizar user_data correctamente", async function () {
      await qanda.connect(user1).voteAnswer(1, 1); // like a user2
      const userData = await qanda.users(await user2.getAddress());
      expect(userData.received_likes).to.equal(1);
    });
  });

  describe("Upgradeabilidad", function () {
    it("Solo el owner puede autorizar upgrades", async function () {
      const QandAV2 = await ethers.getContractFactory("QandA_platform");
      // user1 no es owner, no puede upgradar
      await expect(
        upgrades.upgradeProxy(await qanda.getAddress(), QandAV2.connect(user1), {
          kind: "uups",
        })
      ).to.be.revertedWithCustomError(qanda, "OwnableUnauthorizedAccount");
    });
  });
});
