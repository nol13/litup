// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract LitUpAccess is ERC1155, Ownable, ReentrancyGuard, Pausable {
    using Strings for uint256;

    error InvalidToken();
    error InvalidFee();
    error SupplyExceeded();
    error IncorrectPayment();
    error NotCreator();
    error InvalidPost();
    error TransferFailed();
    error PostIsHidden();

    struct Post {
        address creator;
        uint256 price;
        uint256 maxSupply;
        uint256 minted;
        string previewUri;
        string encryptedUri;
        bool hidden;
    }

    event PostCreated(
        uint256 indexed postId,
        address indexed creator,
        uint256 price,
        string previewUri,
        string encryptedUri,
        uint256 maxSupply
    );

    event Purchased(
        uint256 indexed postId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPaid,
        uint256 pricePerUnit
    );

    event FeeUpdated(uint16 bps);

    event PriceUpdated(uint256 indexed postId, uint256 price);

    event PostHidden(uint256 indexed postId, bool hidden);

    uint16 public protocolFeeBps;
    uint256 private _postIdTracker;

    mapping(uint256 => Post) private _posts;

    constructor() ERC1155("") Ownable(msg.sender) {
        protocolFeeBps = 0;
    }

    function nextPostId() external view returns (uint256) {
        return _postIdTracker + 1;
    }

    function createPost(
        string calldata previewUri,
        string calldata encryptedUri,
        uint256 price,
        uint256 maxSupply
    ) external whenNotPaused returns (uint256 postId) {
        postId = ++_postIdTracker;
        _posts[postId] = Post({
            creator: msg.sender,
            price: price,
            maxSupply: maxSupply,
            minted: 0,
            previewUri: previewUri,
            encryptedUri: encryptedUri,
            hidden: false
        });

        emit PostCreated(postId, msg.sender, price, previewUri, encryptedUri, maxSupply);
    }

    function purchase(uint256 postId, uint256 amount) external payable nonReentrant whenNotPaused {
        _purchase(postId, amount, msg.value);
    }

    function hasAccess(address user, uint256 postId) external view returns (bool) {
        Post storage post = _posts[postId];
        if (post.creator == address(0)) return false;
        if (post.price == 0) return true;
        return balanceOf(user, postId) > 0;
    }

    function getPost(uint256 postId) external view returns (Post memory) {
        Post storage post = _posts[postId];
        if (post.creator == address(0)) revert InvalidPost();
        return post;
    }

    function updatePrice(uint256 postId, uint256 price) external {
        Post storage post = _posts[postId];
        if (post.creator == address(0)) revert InvalidPost();
        if (post.creator != msg.sender) revert NotCreator();

        post.price = price;
        emit PriceUpdated(postId, price);
    }

    function hidePost(uint256 postId, bool hidden) external {
        Post storage post = _posts[postId];
        if (post.creator == address(0)) revert InvalidPost();
        if (post.creator != msg.sender) revert NotCreator();

        post.hidden = hidden;
        emit PostHidden(postId, hidden);
    }

    function withdrawStuckFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool sent, ) = owner().call{value: balance}("");
            if (!sent) revert TransferFailed();
        }
    }

    function setProtocolFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > 500) revert InvalidFee();
        protocolFeeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function emergencyShutdown(bool pause) external onlyOwner {
        if (pause) {
            _pause();
        } else {
            _unpause();
        }
    }

    // Metadata URI for ERC1155
    function uri(uint256 id) public view override returns (string memory) {
        if (_posts[id].creator == address(0)) revert InvalidToken();
        // Return the preview URI which should be a JSON metadata file
        return _posts[id].previewUri;
    }

    function _purchase(uint256 postId, uint256 amount, uint256 msgValue) private {
        Post storage post = _posts[postId];
        if (post.creator == address(0)) revert InvalidPost();
        if (post.hidden) revert PostIsHidden();
        _enforceSupply(post, amount);

        uint256 total = post.price * amount;

        if (post.price == 0) {
            if (msgValue != 0) revert IncorrectPayment();
            post.minted += amount;
            _mint(msg.sender, postId, amount, "");
            emit Purchased(postId, msg.sender, amount, 0, post.price);
            return;
        }

        if (msgValue != total) revert IncorrectPayment();
        _distributeFunds(total, post.creator);

        post.minted += amount;
        _mint(msg.sender, postId, amount, "");

        emit Purchased(postId, msg.sender, amount, total, post.price);
    }

    function _distributeFunds(uint256 total, address creator) private {
        if (total == 0) return;
        uint256 fee = (total * protocolFeeBps) / 10_000;
        uint256 payout = total - fee;

        if (fee > 0) {
            (bool sentFee, ) = owner().call{value: fee}("");
            if (!sentFee) revert TransferFailed();
        }
        (bool sentCreator, ) = creator.call{value: payout}("");
        if (!sentCreator) revert TransferFailed();
    }

    function _enforceSupply(Post storage post, uint256 amount) private view {
        if (post.maxSupply != 0 && post.minted + amount > post.maxSupply) {
            revert SupplyExceeded();
        }
    }

    receive() external payable {}
}

