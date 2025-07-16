// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ProductToken
 * @dev Implementation of an ERC1155 token for products with role-based access control
 */
contract ProductToken is ERC1155, AccessControl {
    using Strings for uint256;
    
    // Role definition
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Mapping to track total supply per token ID
    mapping(uint256 => uint256) private _productSupply;

    // Array to track all product IDs
    uint256[] private _productIds;
    
    // Mapping to track if a product ID exists in the array
    mapping(uint256 => bool) private _productIdExists;
    
    // Base URI for metadata
    string private _baseUri;
    
    // Events
    event ProductMinted(address indexed to, uint256 indexed productId, uint256 amount);
    event BaseURIUpdated(string newUri);
    event ProductBurned(address indexed from, uint256 indexed productId, uint256 amount);

    /**
     * @dev Constructor sets up base URI and grants DEFAULT_ADMIN_ROLE and MINTER_ROLE to the deployer
     * @param baseUri Initial base URI for token metadata
     */
    constructor(string memory baseUri) ERC1155("") {
        _baseUri = baseUri;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mints tokens for a specific product ID to an address
     * @param to The address that will receive the minted tokens
     * @param productId The ID of the product to mint
     * @param amount The amount of tokens to mint
     * @notice Only accounts with MINTER_ROLE can call this function
     * @notice If the product ID doesn't exist yet, it will be created
     */
    function mint(address to, uint256 productId, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(productId > 0, "Invalid product ID");
        require(amount > 0, "Invalid amount");
        
        // Check if the product ID exists in the mapping
        if (!_productIdExists[productId]) {
            _productIds.push(productId);
            _productIdExists[productId] = true;
        }
        _productSupply[productId] += amount;
        _mint(to, productId, amount, "");
        emit ProductMinted(to, productId, amount);
    }

    /**
     * @dev Returns the URI for a given token ID
     * @param tokenId The ID of the token to query
     * @return The URI string for the token metadata
     * @notice URI is constructed by concatenating the base URI, the token ID, and '.json'
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(_baseUri, tokenId.toString(), ".json"));
    }

    /**
     * @dev Updates the base URI for all token metadata
     * @param newUri New base URI to set
     * @notice Only accounts with DEFAULT_ADMIN_ROLE can call this function
     * @notice Empty strings are not allowed as URIs
     */
    function setBaseURI(string memory newUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(newUri).length > 0, "Invalid base URI");

        _baseUri = newUri;
        emit BaseURIUpdated(newUri);
    }

    /**
     * @dev Gets the current supply of tokens for a specific product ID
     * @param productId ID of the product to query
     * @return Current total supply of the product tokens
     * @notice Will revert if the product ID does not exist or is invalid
     */
    function productSupply(uint256 productId) public view returns (uint256) {
        require(productId > 0, "Invalid product ID");
        require(_productIdExists[productId], "Product ID does not exist");

        return _productSupply[productId];
    }

    /**
     * @dev Returns an array of all existing product IDs
     * @return Array of product IDs that have been created
     */
    function getProductIds() public view returns (uint256[] memory) {
        return _productIds;
    }

    /**
     * @dev Burns tokens from a specific address
     * @param from Address from which to burn tokens
     * @param productId ID of the product to burn
     * @param amount Amount of tokens to burn
     * @notice Only accounts with MINTER_ROLE can call this function
     * @notice Will revert if the product ID does not exist or amount exceeds supply
     * @notice Will revert if the target address has insufficient balance
     */
    function burn(address from, uint256 productId, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(productId > 0, "Invalid product ID");
        require(amount > 0, "Invalid amount");
        
        // Check if the product ID exists in the mapping
        require(_productIdExists[productId], "Product ID does not exist");
        require(amount <= _productSupply[productId], "Burn amount exceeds supply");

        require(balanceOf(from, productId) >= amount, "Insufficient balance");
        
        // Update product supply first
        _productSupply[productId] -= amount;
        
        // Call the parent implementation to burn tokens
        super._burn(from, productId, amount);
        
        emit ProductBurned(from, productId, amount);
    }

    /**
     * @dev See {IERC165-supportsInterface}
     * @param interfaceId The interface identifier to check support for
     * @return bool True if the contract supports the interface
     * @notice This implementation supports both ERC1155 and AccessControl interfaces
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Override the ERC1155 _burn function to update product supply tracking
     * @param from Address which owns the tokens to be burned
     * @param id ID of the token type to burn
     * @param amount Amount of tokens to burn
     * @notice This ensures product supply tracking is maintained even when tokens are burned through other methods
     * @notice Only updates _productSupply for product IDs that exist in our tracking system
     */
    // Custom burn implementation - not overriding ERC1155 _burn
    function _burnProduct(
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        // Only update _productSupply if this is a tracked product
        if (_productIdExists[id]) {
            _productSupply[id] -= amount;
        }
        
        // Call the parent implementation
        super._burn(from, id, amount);
    }
} 