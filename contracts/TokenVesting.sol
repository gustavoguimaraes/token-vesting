// The contract should allow users to claim tokens at a constant rate over a specified block range. The exact specifications are:

// 1. The contract should keep track of allocations of tokens for wallet addresses. Each address can only appear once and the allocation of tokens for each address can be different.
// 2. Tokens should be claimable by the user in a linear fashion between the contract’s startBlock and stopBlock, which should be set by the contract deployer on contract creation.
//    For example: If Alice’s allocation is 100 tokens, Bob’s allocation is 50 tokens, the duration of the time-release contract is 1000 blocks, and we are currently 500 blocks past the startBlock, then Alice should be able to claim up to 50 tokens and Bob should be able to claim up to 25 tokens.
// 3. The token that is claimable is a ERC20 standard token.
// 4. We will need a method for populating the contract with allocations (address, token
//    amounts).

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TokenVesting
/// @dev Contract allows users to claim tokens at a constant rate over a specified block range
contract TokenVesting {
    using SafeERC20 for IERC20;

    uint256 private _startReleaseBlock;
    uint256 private _endReleaseBlock;
    uint256 private _totalVested;
    uint256 private _totalClaimed;

    address private _admin;
    IERC20 private _token;

    mapping(address => uint256) public fundsVestedFor;
    mapping(address => uint256) public fundsClaimedFor;

    event FundsVested(address indexed account, uint256 amount);
    event FundsClaimed(address indexed account, uint256 amount);

    constructor(
        uint256 startBlock,
        uint256 endBlock,
        IERC20 tokenVested
    ) {
        require(startBlock < endBlock, "end must be after start");
        require(address(tokenVested) != address(0), "!tokenVested");

        _startReleaseBlock = startBlock;
        _endReleaseBlock = endBlock;

        _admin = msg.sender;

        _token = tokenVested;
    }

    /// @dev vest specific amount for a certain account. Will stay locked until startReleaseBlock
    /// @param account Token vesting beneficiary
    /// @param amount Amount vested
    function vest(address account, uint256 amount) external {
        require(msg.sender == _admin, "!admin");
        require(account != address(0), "!account");
        require(amount > 0, "amount must be greater than 0");

        _token.safeTransferFrom(msg.sender, address(this), amount);

        _totalVested = _totalVested + amount;
        fundsVestedFor[account] = fundsVestedFor[account] + amount;

        emit FundsVested(account, amount);
    }

    /// @notice Between startReleaseBlock and endReleaseBlock, tokens can be claimed linearly
    /// @param account Owner of tokens
    /// @return Amount that can be claimed
    function canClaimAmount(address account) public view returns (uint256) {
        if (block.number < _startReleaseBlock) {
            return 0;
        } else if (block.number >= _endReleaseBlock) {
            return fundsVestedFor[account] - fundsClaimedFor[account];
        } else {
            uint256 releasedBlock = block.number - _startReleaseBlock;
            uint256 totalVestingBlock = _endReleaseBlock - _startReleaseBlock;

            return
                ((fundsVestedFor[account] * releasedBlock) /
                    totalVestingBlock) - fundsClaimedFor[account];
        }
    }

    /// @dev Claim available tokens for an account
    function claim() external {
        require(block.number > _startReleaseBlock, "funds locked");
        require(
            fundsVestedFor[msg.sender] > fundsClaimedFor[msg.sender],
            "no locked funds remaining"
        );

        uint256 amount = canClaimAmount(msg.sender);

        fundsClaimedFor[msg.sender] = fundsClaimedFor[msg.sender] + amount;
        _totalVested = _totalVested - amount;
        _totalClaimed = _totalClaimed + amount;

        _token.safeTransfer(msg.sender, amount);

        emit FundsClaimed(msg.sender, amount);
    }
}
