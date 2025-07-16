// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./ProductToken.sol";

struct ProductConfig {
    uint256 productId;
    uint256 price;
    uint256 supplyLimit;  // 0 means unlimited supply
}

contract USDCFundraiserUpgradeable is Initializable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    IERC20 public usdc;
    ProductToken public productToken;
    address public beneficiaryWallet;
    address public feeWallet;
    uint256 public minimumTarget;
    uint256 public deadline;
    uint256 public feePercentage; // Stored as basis points (e.g., 250 = 2.5%)
    
    uint256 public totalRaised;
    bool public finalized;
    mapping(uint256 => uint256) public tokenDeposits; // tokenId => deposit amount
    uint256[] public productIds;
    mapping(uint256 => uint256) public productSoldCount;    // productId => current sold count

    uint256 public fundingType; // 0 = all or nothing, 1 = limitless, 2 = flexible
    mapping(uint256 => ProductConfig) public products;
    address public campaignAdmin;

    modifier onlyAdminOrOwner() {
        require(msg.sender == owner() || msg.sender == campaignAdmin, "Not authorized");
        _;
    }

    struct RegistrationParams {
        string name;
        bytes encryptedEmail;
        address upkeepContract;
        uint32 gasLimit;
        address adminAddress;
        uint8 triggerType;
        bytes checkData;
        bytes triggerConfig;
        bytes offchainConfig;
        uint96 amount;
    }

    event Deposit(address indexed depositor, uint256 amount, uint256 fee);
    event Refund(address indexed depositor, uint256 amount, uint256 productId, uint256 quantity);
    event FundsReleased(address indexed beneficiary, uint256 amount);
    event FeeUpdated(uint256 newFeePercentage);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    event ProductPriceSet(uint256 productId, uint256 price);
    event Debug(string message, uint256 value);
    event DebugBytes(string message, bytes value);
    event Finalized();
    event ProductAdded(uint256 productId, uint256 price, uint256 supplyLimit);
    event ProductRemoved(uint256 productId);
    event ProductUpdated(uint256 productId, uint256 price, uint256 supplyLimit);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdcAddress,
        address _beneficiaryWallet,
        address _feeWallet,
        uint256 _feePercentage,
        uint256 _fundingType,
        uint256 _minimumTarget,
        uint256 _deadline,
        address _productTokenAddress,
        ProductConfig[] memory _products,
        address _campaignAdmin,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();
        
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_beneficiaryWallet != address(0), "Invalid beneficiary wallet");
        require(_feeWallet != address(0), "Invalid fee wallet");
        require(_productTokenAddress != address(0), "Invalid product token address");
        require(_deadline > block.timestamp, "Invalid deadline");
        require(_products.length > 0, "No products provided");
        require(_campaignAdmin != address(0), "Invalid campaign admin");
        require(_owner != address(0), "Invalid owner");
        require(_feePercentage < BASIS_POINTS, "Fee percentage must be less than 100%");

        usdc = IERC20(_usdcAddress);
        beneficiaryWallet = _beneficiaryWallet;
        feeWallet = _feeWallet;
        feePercentage = _feePercentage;
        minimumTarget = _minimumTarget;
        deadline = _deadline;
        productToken = ProductToken(_productTokenAddress);
        campaignAdmin = _campaignAdmin;

        // Initialize products
        for (uint256 i = 0; i < _products.length; i++) {
            ProductConfig memory product = _products[i];
            require(product.price > 0, "Invalid product price");
            require(product.productId > 0, "Invalid product ID");
            
            products[product.productId] = product;
            productIds.push(product.productId);
        }

        require(_fundingType <= 2, "Invalid funding type");
        fundingType = _fundingType;
    }

    function deposit(uint256 productId, uint256 quantity) external nonReentrant whenNotPaused {
        ProductConfig memory product = products[productId];
        require(finalized == false, "Campaign is finalized");
        require(block.timestamp < deadline, "Campaign has ended");
        require(product.price > 0, "Invalid product");
        require(quantity > 0, "Invalid quantity");
        
        // Check supply limit
        if (product.supplyLimit > 0) {
            require(productSoldCount[productId] + quantity <= product.supplyLimit, "Exceeds supply limit");
        }

        uint256 totalAmount = product.price * quantity;
        uint256 feeAmount = (totalAmount * feePercentage) / BASIS_POINTS;
        uint256 netAmount = totalAmount - feeAmount;

        // Transfer USDC from user to contract
        usdc.safeTransferFrom(msg.sender, address(this), totalAmount);

        // Update counts and totals
        productSoldCount[productId] += quantity;
        totalRaised += netAmount; // Only count net amount toward target

        // Try to mint NFT - if it fails, revert the entire transaction
        try productToken.mint(msg.sender, productId, quantity) {
            // Mint successful - continue
        } catch Error(string memory reason) {
            // Revert the USDC transfer if mint fails
            usdc.safeTransfer(msg.sender, totalAmount);
            revert(string.concat("NFT mint failed: ", reason));
        } catch (bytes memory /*lowLevelData*/) {
            // Handle low-level errors
            usdc.safeTransfer(msg.sender, totalAmount);
            revert("NFT mint failed with low-level error");
        }

        emit Deposit(msg.sender, netAmount, feeAmount);
    }

    function finalize() public nonReentrant whenNotPaused {
        require(!finalized, "Already finalized");
        
        if (fundingType == 0) {
            require(block.timestamp > deadline, "Deadline not reached");
            require(totalRaised >= minimumTarget, "Minimum target not met");
        } else if (fundingType == 1) {
            require(msg.sender == owner() || msg.sender == campaignAdmin, "Not authorized");
        } else if (fundingType == 2) {
            require(block.timestamp > deadline || msg.sender == owner() || msg.sender == campaignAdmin, "Cannot finalize yet");
        }
        
        finalized = true;
        
        uint256 contractBalance = usdc.balanceOf(address(this));
        if (contractBalance > 0) {
            usdc.safeTransfer(beneficiaryWallet, contractBalance);
        }
        
        emit Finalized();
        emit FundsReleased(beneficiaryWallet, contractBalance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount <= usdc.balanceOf(address(this)), "Insufficient balance");
        usdc.safeTransfer(to, amount);
        emit EmergencyWithdraw(to, amount);
    }

    function updateFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage < BASIS_POINTS, "Fee percentage must be less than 100%");
        feePercentage = newFeePercentage;
        emit FeeUpdated(newFeePercentage);
    }

    function setProductPrice(uint256 productId, uint256 price) external onlyAdminOrOwner {
        require(price > 0, "Invalid price");
        require(products[productId].price > 0, "Product does not exist");
        require(productSoldCount[productId] == 0, "Product has active sales");

        products[productId].price = price;
        emit ProductPriceSet(productId, price);
    }

    function claimRefund(uint256 productId, uint256 quantity) external nonReentrant whenNotPaused {
        ProductConfig memory product = products[productId];
        require(product.price > 0, "Invalid product");
        
        if (fundingType == 0) {
            require(finalized == false, "Campaign is finalized");
            require(block.timestamp > deadline && totalRaised < minimumTarget, "Refund not available");
        } else {
            revert("Refunds not available for this funding type");
        }

        // Burn the NFTs to get refund
        uint256 balance = productToken.balanceOf(msg.sender, productId);
        require(balance >= quantity, "Insufficient NFT balance");
        
        productToken.burn(msg.sender, productId, quantity);
        
        uint256 refundAmount = product.price * quantity;
        usdc.safeTransfer(msg.sender, refundAmount);
        
        productSoldCount[productId] -= quantity;
        totalRaised -= (refundAmount * (BASIS_POINTS - feePercentage)) / BASIS_POINTS;

        emit Refund(msg.sender, refundAmount, productId, quantity);
    }

    function addProduct(ProductConfig memory product) external onlyAdminOrOwner {
        require(product.price > 0, "Invalid price");
        require(product.productId > 0, "Invalid product ID");
        require(products[product.productId].price == 0, "Product already exists");

        products[product.productId] = product;
        productIds.push(product.productId);
        
        emit ProductAdded(product.productId, product.price, product.supplyLimit);
    }

    function removeProduct(uint256 productId) external onlyAdminOrOwner {
        require(products[productId].price > 0, "Product does not exist");
        require(productSoldCount[productId] == 0, "Product has active sales");

        // Remove from productIds array
        for (uint i = 0; i < productIds.length; i++) {
            if (productIds[i] == productId) {
                productIds[i] = productIds[productIds.length - 1];
                productIds.pop();
                break;
            }
        }

        delete products[productId];
        emit ProductRemoved(productId);
    }

    function updateProductSupply(uint256 productId, uint256 supplyLimit) external onlyAdminOrOwner {
        require(products[productId].price > 0, "Product does not exist");
        
        // If reducing supply limit, check if it's still above sold count
        if (supplyLimit > 0) {
            require(supplyLimit >= productSoldCount[productId], 
                "New supply limit below sold count");
        }

        products[productId].supplyLimit = supplyLimit;
        emit ProductUpdated(productId, products[productId].price, supplyLimit);
    }

    function updateCampaignAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Invalid admin address");
        campaignAdmin = newAdmin;
    }

    // View functions
    function getProductIds() external view returns (uint256[] memory) {
        return productIds;
    }

    function getProduct(uint256 productId) external view returns (ProductConfig memory) {
        return products[productId];
    }

    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
