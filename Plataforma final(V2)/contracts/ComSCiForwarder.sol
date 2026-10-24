// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

contract ComSCiForwarder is ERC2771Forwarder {
    constructor() ERC2771Forwarder("ComSCiForwarder") {}
}
