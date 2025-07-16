// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ProductToken is ERC1155, AccessControl {
    using Strings for uint256;
    
    // Role definition
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Mapping to track total supply per token ID
    mapping(uint256 => uint256) private _productSupply;

    // Array to track all product IDs
    uint256[] private _productIds;
    
    // Base URI for metadata
    string private _baseUri;
    
    // Events
    event ProductMinted(address indexed to, uint256 indexed productId, uint256 amount);
    event BaseURIUpdated(string newUri);

    constructor(string memory baseUri) ERC1155("") {
        _baseUri = baseUri;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 productId, uint256 amount) external onlyRole(MINTER_ROLE) {
        // Check if the product ID is already in the array
        if (_productIds.length == 0 || _productIds[_productIds.length - 1] != productId) {
            _productIds.push(productId);
        }
        _productSupply[productId] += amount;
        _mint(to, productId, amount, "");
        emit ProductMinted(to, productId, amount);
    }

    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(_baseUri, tokenId.toString(), ".json"));
    }

    function setBaseURI(string memory newUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseUri = newUri;
        emit BaseURIUpdated(newUri);
    }

    function productSupply(uint256 productId) public view returns (uint256) {
        return _productSupply[productId];
    }

    function getProductIds() public view returns (uint256[] memory) {
        return _productIds;
    }

    function burn(address from, uint256 productId, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, productId, amount);
        _productSupply[productId] -= amount;
    }

    // Required override
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 