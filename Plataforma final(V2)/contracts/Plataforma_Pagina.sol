// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract QandA_platform is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // --- VARIABLES DE ESTADO (Nunca cambiar su orden en futuras versiones) ---
    uint256 public questionCount; 
    uint256 public answerCount;

    struct question {
        uint256 id;
        address author;
        string title;
        string content;
        uint256 timestamp;
        uint256[] answers_id;
    }

    struct answer {
        uint256 id;
        uint256 id_question;
        address author;
        string content;
        uint256 likes;
        uint256 dislikes;
    }

    struct user_data {
        uint256 count_answ;
        uint256 received_likes;
        uint256 received_dislikes;
    }

    enum vote { None, like, dislike }

    mapping(uint256 => answer) public answers;
    mapping(uint256 => question) public questions;
    mapping(address => user_data) public users;
    mapping(uint256 => mapping(address => vote)) public votes;

    // --- EVENTOS Y ERRORES ---
    event AnswerVoted(uint256 indexed answerId, address indexed voter, vote voteType, address indexed answerAuthor);
    event QuestionCreated(uint256 indexed questionId, address indexed author, string title, uint256 timestamp);
    event AnswerCreated(uint256 indexed answerId, uint256 indexed questionId, address indexed author, uint256 timestamp);

    error InvalidVote();
    error AlreadyVoted();
    error CannotVoteOwnAnswer();
    error AnswerNotFound();
    error EmptyTitle();
    error EmptyContent();
    error QuestionNotFound();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // Bloquea la implementación base para que nadie pueda inicializarla directamente
        _disableInitializers();
    }

    /**
     * @notice Reemplaza al constructor tradicional.
     * @dev Se ejecuta a través del Proxy una única vez al crearlo.
     */
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    /**
     * @dev Requerido por UUPS. Define quién tiene permisos para actualizar el contrato a una V2.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- LÓGICA DE NEGOCIO (Igual a tu contrato original) ---

    function voteAnswer(uint256 id_answer, vote new_vote) external virtual {
        if (new_vote == vote.None) revert InvalidVote();

        answer storage currentAnswer = answers[id_answer];
        if (currentAnswer.author == address(0)) revert AnswerNotFound();
        if (currentAnswer.author == msg.sender) revert CannotVoteOwnAnswer();

        vote currentVote = votes[id_answer][msg.sender];
        if (currentVote == new_vote) revert AlreadyVoted();

        user_data storage usuario = users[currentAnswer.author];

        if (currentVote == vote.like) {
            currentAnswer.likes--;
            usuario.received_likes--;
        } else if (currentVote == vote.dislike) {
            currentAnswer.dislikes--;
            usuario.received_dislikes--;
        }

        if (new_vote == vote.like) {
            currentAnswer.likes++;
            usuario.received_likes++;
        } else if (new_vote == vote.dislike) {
            currentAnswer.dislikes++;
            usuario.received_dislikes++;
        }

        votes[id_answer][msg.sender] = new_vote;
        emit AnswerVoted(id_answer, msg.sender, new_vote, currentAnswer.author);
    }

    function askQuestion(string calldata title, string calldata content) external virtual returns (uint256) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(content).length == 0) revert EmptyContent();

        questionCount++;
        uint256 newId = questionCount;

        question storage q = questions[newId];
        q.id = newId;
        q.author = msg.sender;
        q.title = title;
        q.content = content;
        q.timestamp = block.timestamp;

        emit QuestionCreated(newId, msg.sender, title, block.timestamp);
        return newId;
    }

    function answerQuestion(uint256 question_id, string calldata _content) external virtual returns (uint256) {
        if (bytes(_content).length == 0) revert EmptyContent();
        if (questions[question_id].author == address(0)) revert QuestionNotFound();

        answerCount++;
        uint256 newId = answerCount;

        answer storage a = answers[newId];
        a.id = newId;
        a.id_question = question_id;
        a.author = msg.sender;
        a.content = _content;

        questions[question_id].answers_id.push(newId);
        users[msg.sender].count_answ++;

        emit AnswerCreated(newId, question_id, msg.sender, block.timestamp);
        return newId;
    }

    function getQuestion(uint256 question_id) external view virtual returns (
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

    function getAnswersForQuestion(uint256 question_id) external view virtual returns (answer[] memory) {
        if (questions[question_id].author == address(0)) revert QuestionNotFound();

        uint256[] storage ids = questions[question_id].answers_id;
        uint256 total = ids.length;

        answer[] memory result = new answer[](total);

        for (uint256 i = 0; i < total; i++) {
            result[i] = answers[ids[i]];
        }

        return result;
    }
}