// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {LitUpAccess} from "../src/LitUpAccess.sol";

contract LitUpAccessTest is Test {
    LitUpAccess public litUp;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // Deploy contract
        litUp = new LitUpAccess();
    }

    receive() external payable {}

    function test_CreatePost() public {
        vm.prank(user1);
        uint256 postId = litUp.createPost(
            "preview.json",
            "encrypted.json",
            0.1 ether, // price
            100 // maxSupply
        );

        assertEq(postId, 1);
        
        LitUpAccess.Post memory post = litUp.getPost(1);
        assertEq(post.creator, user1);
        assertEq(post.price, 0.1 ether);
        assertEq(post.maxSupply, 100);
        assertEq(post.minted, 0);
        assertEq(post.hidden, false);
    }

    function test_Purchase() public {
        // Setup post
        vm.prank(user1);
        litUp.createPost("p", "e", 0.1 ether, 10);

        // User2 purchases
        vm.deal(user2, 1 ether);
        vm.prank(user2);
        litUp.purchase{value: 0.1 ether}(1, 1);

        // Check balances
        assertEq(litUp.balanceOf(user2, 1), 1);
        assertEq(litUp.hasAccess(user2, 1), true);
        
        // Check funds received by creator (user1)
        // Fees are 0 by default, so user1 gets full amount
        assertEq(address(user1).balance, 0.1 ether);
    }

    function test_PurchaseFree() public {
        vm.prank(user1);
        litUp.createPost("p", "e", 0, 10);

        vm.prank(user2);
        litUp.purchase(1, 1);

        assertEq(litUp.balanceOf(user2, 1), 1);
        // Free posts grant access even without balance, but purchase mints token anyway
        assertEq(litUp.hasAccess(user2, 1), true);
    }

    function test_RevertIfInsufficientPayment() public {
        vm.prank(user1);
        litUp.createPost("p", "e", 1 ether, 10);

        vm.deal(user2, 0.5 ether);
        vm.prank(user2);
        vm.expectRevert(); // IncorrectPayment
        litUp.purchase{value: 0.5 ether}(1, 1);
    }

    function test_RevertIfSupplyExceeded() public {
        vm.prank(user1);
        litUp.createPost("p", "e", 0, 1); // Max supply 1

        vm.prank(user2);
        litUp.purchase(1, 1); // Buy 1 (OK)

        vm.prank(user2);
        vm.expectRevert(); // SupplyExceeded
        litUp.purchase(1, 1); // Buy 2nd (Fail)
    }

    function test_HidePost() public {
        vm.prank(user1);
        litUp.createPost("p", "e", 0, 10);

        // Only creator can hide
        vm.prank(user2);
        vm.expectRevert();
        litUp.hidePost(1, true);

        // Creator hides
        vm.prank(user1);
        litUp.hidePost(1, true);

        // Check hidden
        LitUpAccess.Post memory post = litUp.getPost(1);
        assertEq(post.hidden, true);

        // Purchase should revert
        vm.prank(user2);
        vm.expectRevert(); // PostIsHidden
        litUp.purchase(1, 1);
    }

    function test_EmergencyShutdown() public {
        // Only owner can pause
        vm.prank(user1);
        vm.expectRevert();
        litUp.emergencyShutdown(true);

        // Owner pauses
        litUp.emergencyShutdown(true);

        // Create post should revert
        vm.prank(user1);
        vm.expectRevert(); // Paused
        litUp.createPost("p", "e", 0, 0);

        // Unpause
        litUp.emergencyShutdown(false);

        // Create post succeeds
        vm.prank(user1);
        litUp.createPost("p", "e", 0, 0);
    }

    function test_WithdrawStuckFunds() public {
        // Send funds directly to contract
        vm.deal(user2, 1 ether);
        vm.prank(user2);
        (bool sent,) = address(litUp).call{value: 1 ether}("");
        require(sent, "Failed to send");

        assertEq(address(litUp).balance, 1 ether);

        // Withdraw
        uint256 preBalance = address(this).balance;
        litUp.withdrawStuckFunds();
        uint256 postBalance = address(this).balance;

        assertEq(postBalance - preBalance, 1 ether);
        assertEq(address(litUp).balance, 0);
    }
}
