// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPrizePool {
    function depositPrize() external payable;
}

contract ArcadeMachine {
    // Custom Errors (Optimización de gas)
    error NotOwner();
    error NotEnoughEth();

    // Variables de estado
    address public owner;
    uint256 public playPrice;
    uint256 public totalGames;
    address public prizePool;

    mapping(address => uint256) public highScores;
    mapping(address => string) public nickname;

    // Eventos
    event GamePlayed(address indexed player, uint256 score);
    event NewChampion(address indexed player, uint256 score);
    event PrizeDepositSuccess(uint256 amount);
    event PrizeDepositFailed(uint256 amount);

    // Modificador de acceso
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(uint256 _price, address _prizePool) {
        owner = msg.sender;
        playPrice = _price;
        prizePool = _prizePool;
    }

    function changePrice(uint256 _newPrice) external onlyOwner {
        playPrice = _newPrice;
    }

    function setNickname(string calldata name) external {
        nickname[msg.sender] = name;
    }

    function isPro(address player) external view returns (bool) {
        return highScores[player] >= 100;
    }

    function playGame(uint256 score) external payable {
        if (msg.value < playPrice) revert NotEnoughEth();

        totalGames += 1;

        // Cacheo de lectura de storage
        uint256 currentScore = highScores[msg.sender];
        if (score > currentScore) {
            highScores[msg.sender] = score;
        }

        emit GamePlayed(msg.sender, score);

        if (score > 500) {
            emit NewChampion(msg.sender, score);
        }
    }

    function safeDeposit() external onlyOwner {
        uint256 amount = address(this).balance;
        try IPrizePool(prizePool).depositPrize{value: amount}() {
            emit PrizeDepositSuccess(amount);
        } catch {
            emit PrizeDepositFailed(amount);
        }
    }

    function poolBalance() external view returns (uint256) {
        return prizePool.balance;
    }
}