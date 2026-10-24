// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./Plataforma_Pagina.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";

/**
 * @title QandA_platform_V2
 * @notice Versión 2 de la plataforma de preguntas y respuestas con soporte para
 *         meta-transacciones sin gas (Gasless / EIP-2771) vía ERC2771Forwarder
 *         y optimizaciones avanzadas de Gas (reducción de SLOAD/SSTORE y loops unchecked).
 * @dev Mantiene estrictamente el layout de storage de V1 sin alterar variables existentes.
 */
contract QandA_platform_V2 is QandA_platform, ERC2771ContextUpgradeable {
    // Variable de estado para registrar el trusted forwarder (añadida al final del almacenamiento, Slot 6)
    address private _trustedForwarderAddress;

    event TrustedForwarderUpdated(address indexed previousForwarder, address indexed newForwarder);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address forwarder) ERC2771ContextUpgradeable(forwarder) {
        _disableInitializers();
    }

    /**
     * @notice Re-inicializador para la versión 2.
     * @dev Se ejecuta una sola vez al actualizar el proxy UUPS a V2.
     */
    function initializeV2(address forwarder) public reinitializer(2) onlyOwner {
        address prev = _trustedForwarderAddress;
        _trustedForwarderAddress = forwarder;
        emit TrustedForwarderUpdated(prev, forwarder);
    }

    /**
     * @notice Permite al owner actualizar la dirección del trusted forwarder si fuera necesario.
     */
    function setTrustedForwarder(address forwarder) external onlyOwner {
        address prev = _trustedForwarderAddress;
        _trustedForwarderAddress = forwarder;
        emit TrustedForwarderUpdated(prev, forwarder);
    }

    /**
     * @notice Retorna la dirección del forwarder de confianza registrado.
     */
    function trustedForwarder() public view virtual override returns (address) {
        if (_trustedForwarderAddress != address(0)) {
            return _trustedForwarderAddress;
        }
        return super.trustedForwarder();
    }

    // --- OVERRIDES OBLIGATORIOS PARA RESOLVER COLISIÓN DE HERENCIA ---

    function _msgSender()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (address)
    {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (bytes calldata)
    {
        return ERC2771ContextUpgradeable._msgData();
    }

    function _contextSuffixLength()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (uint256)
    {
        return ERC2771ContextUpgradeable._contextSuffixLength();
    }

    // --- LÓGICA DE NEGOCIO OPTIMIZADA EN GAS CON _msgSender() ---

    /**
     * @notice Crea una nueva pregunta optimizando escrituras a almacenamiento.
     */
    function askQuestion(string calldata title, string calldata content) external override returns (uint256) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(content).length == 0) revert EmptyContent();

        // Optimización Gas: pre-incremento en unchecked evita un SLOAD redundante de questionCount
        uint256 newId;
        unchecked {
            newId = ++questionCount;
        }

        address sender = _msgSender();
        uint256 currentTime = block.timestamp;

        question storage q = questions[newId];
        q.id = newId;
        q.author = sender;
        q.title = title;
        q.content = content;
        q.timestamp = currentTime;

        emit QuestionCreated(newId, sender, title, currentTime);
        return newId;
    }

    /**
     * @notice Agrega una respuesta a una pregunta existente optimizando hashing de slots.
     */
    function answerQuestion(uint256 question_id, string calldata _content) external override returns (uint256) {
        if (bytes(_content).length == 0) revert EmptyContent();

        // Optimización Gas: cálculo de keccak256 de mapping una sola vez
        question storage q = questions[question_id];
        if (q.author == address(0)) revert QuestionNotFound();

        uint256 newId;
        unchecked {
            newId = ++answerCount;
        }

        address sender = _msgSender();
        uint256 currentTime = block.timestamp;

        answer storage a = answers[newId];
        a.id = newId;
        a.id_question = question_id;
        a.author = sender;
        a.content = _content;

        q.answers_id.push(newId);

        unchecked {
            users[sender].count_answ++;
        }

        emit AnswerCreated(newId, question_id, sender, currentTime);
        return newId;
    }

    /**
     * @notice Vota una respuesta reduciendo SLOADs/SSTOREs a través de caching en memoria/stack.
     */
    function voteAnswer(uint256 id_answer, vote new_vote) external override {
        if (new_vote == vote.None) revert InvalidVote();

        answer storage currentAnswer = answers[id_answer];
        address author = currentAnswer.author;
        if (author == address(0)) revert AnswerNotFound();

        address sender = _msgSender();
        if (author == sender) revert CannotVoteOwnAnswer();

        vote currentVote = votes[id_answer][sender];
        if (currentVote == new_vote) revert AlreadyVoted();

        user_data storage usuario = users[author];

        // Optimización Gas: cacheo en variables locales para evitar múltiples lecturas SLOAD
        uint256 aLikes = currentAnswer.likes;
        uint256 aDislikes = currentAnswer.dislikes;
        uint256 uLikes = usuario.received_likes;
        uint256 uDislikes = usuario.received_dislikes;

        if (currentVote == vote.like) {
            unchecked {
                --aLikes;
                --uLikes;
            }
        } else if (currentVote == vote.dislike) {
            unchecked {
                --aDislikes;
                --uDislikes;
            }
        }

        if (new_vote == vote.like) {
            unchecked {
                ++aLikes;
                ++uLikes;
            }
        } else if (new_vote == vote.dislike) {
            unchecked {
                ++aDislikes;
                ++uDislikes;
            }
        }

        // Escritura única a almacenamiento (SSTORE optimizado)
        currentAnswer.likes = aLikes;
        currentAnswer.dislikes = aDislikes;
        usuario.received_likes = uLikes;
        usuario.received_dislikes = uDislikes;

        votes[id_answer][sender] = new_vote;
        emit AnswerVoted(id_answer, sender, new_vote, author);
    }

    /**
     * @notice Retorna las respuestas de una pregunta con loop optimizado en memoria.
     */
    function getAnswersForQuestion(uint256 question_id) external view override returns (answer[] memory) {
        question storage q = questions[question_id];
        if (q.author == address(0)) revert QuestionNotFound();

        uint256[] storage ids = q.answers_id;
        uint256 total = ids.length;

        answer[] memory result = new answer[](total);

        for (uint256 i = 0; i < total;) {
            result[i] = answers[ids[i]];
            unchecked {
                ++i;
            }
        }

        return result;
    }

    /**
     * @notice Retorna la pregunta por ID con acceso directo al slot en storage.
     */
    function getQuestion(uint256 question_id) external view override returns (
        uint256 id,
        address author,
        string memory title,
        string memory content,
        uint256 timestamp,
        uint256[] memory answerIds
    ) {
        question storage q = questions[question_id];
        if (q.author == address(0)) revert QuestionNotFound();

        return (q.id, q.author, q.title, q.content, q.timestamp, q.answers_id);
    }
}
