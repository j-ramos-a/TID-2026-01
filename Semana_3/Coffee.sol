// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CoffeeJar {
    
    error NotOwner();
    error NotEnoughEth();
    error WithdrawFailed();
    error InvalidPrice();

    address public owner;
    uint256 public coffeePrice;
    uint256 public totalCoffees;

    mapping(address => uint256) public coffeesBought;

    mapping(address => string) public userNames;
    mapping(address => string) public lastMessages;

    string[] public allNames;
    string[] public allMessages;

    event CoffeeBought(address indexed buyer, uint256 amount, string name, string message);
    event LargeTipReceived(address indexed buyer, uint256 amount);
    event PriceChanged(uint256 oldPrice, uint256 newPrice);

    constructor(uint256 _initialPrice) {
        if (_initialPrice == 0) {
            revert InvalidPrice();
        }
        owner = msg.sender;
        coffeePrice = _initialPrice;
    }

    function buyCoffee(string calldata _name, string calldata _message) external payable {
        uint256 requiredPrice = coffeePrice;
        if (isFrequentCustomer(msg.sender)) {
            requiredPrice = (coffeePrice * 80) / 100;
        }

        if (msg.value < requiredPrice) {
            revert NotEnoughEth();
        }

        coffeesBought[msg.sender] += 1;
        totalCoffees += 1;

        userNames[msg.sender] = _name;
        lastMessages[msg.sender] = _message;
        allNames.push(_name);
        allMessages.push(_message);

        emit CoffeeBought(msg.sender, msg.value, _name, _message);

        if (msg.value > coffeePrice * 2) {
            emit LargeTipReceived(msg.sender, msg.value);
        }
    }

    function isFrequentCustomer(address _user) public view returns (bool) {
        return coffeesBought[_user] >= 3;
    }

    function totalMessages() external view returns (uint256) {
        return allMessages.length;
    }

    function changePrice(uint256 _newPrice) external {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        if (_newPrice == 0) {
            revert InvalidPrice();
        }

        uint256 oldPrice = coffeePrice;
        coffeePrice = _newPrice;
        emit PriceChanged(oldPrice, _newPrice);
    }

    function withdraw() external {
        if (msg.sender != owner) {
            revert NotOwner();
        }

        uint256 amount = address(this).balance;

        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) {
            revert WithdrawFailed();
        }
    }
}