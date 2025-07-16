// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./ProductToken.sol";
import {IAutomationRegistryConsumer} from
    "@chainlink/contracts/src/v0.8/automation/interfaces/IAutomationRegistryConsumer.sol";
import {IAutomationForwarder} from "@chainlink/contracts/src/v0.8/automation/interfaces/IAutomationForwarder.sol";

struct ProductConfig {
    uint256 productId;
    uint256 price;
    uint256 supplyLimit;  // 0 means unlimited supply
}

contract USDCFundraiser is Ownable, Pausable, ReentrancyGuard, AutomationCompatibleInterface {
    IERC20 public usdc;
    ProductToken public productToken;
    address public beneficiaryWallet;
    address public feeWallet;
    uint256 public minimumTarget;
    uint256 public deadline;
    uint256 public feePercentage; // Stored as basis points (e.g., 250 = 2.5%)
    
    mapping(address => uint256) public deposits;
    uint256 public totalRaised;
    bool public finalized;
    uint256 private currentTokenId;
    mapping(uint256 => uint256) public tokenDeposits; // tokenId => deposit amount
    uint256[] public productIds;
    mapping(uint256 => uint256) public productSoldCount;    // productId => current sold count

    address CHAINLINK_REGISTRAR;
    address CHAINLINK_REGISTRY;
    address LINK_TOKEN;
    bytes4 CHAINLINK_REGISTRAR_SELECTOR;
    bool isRegisteredWithChainlink;

    uint256 s_stationUpkeepID;
    IAutomationForwarder s_forwarder;
    bytes4 s_registerUpkeepSelector;

    uint256 public fundingType; // 0 = all or nothing, 1 = limitless, 2 = flexible

    mapping(uint256 => ProductConfig) public products;

    address public campaignAdmin;

    modifier onlyAdminOrOwner() {
        require(msg.sender == owner() || msg.sender == campaignAdmin, "Not authorized");
        _;
    }

    function getStationUpkeepID() public view returns (uint256) {
        return s_stationUpkeepID;
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
    event ForwarderChanged(address indexed forwarder);
    event UpkeepPerformed();
    event UpkeepRegistered(uint256 upkeepID);
    event Finalized();
    event ProductAdded(uint256 productId, uint256 price, uint256 supplyLimit);
    event ProductRemoved(uint256 productId);
    event ProductUpdated(uint256 productId, uint256 price, uint256 supplyLimit);
    
    constructor(
        address _usdcAddress,
        address _beneficiaryWallet,
        address _feeWallet,
        uint256 _fundingType,
        uint256 _minimumTarget,
        uint256 _deadline,
        address _productTokenAddress,
        ProductConfig[] memory _products,
        address _linkToken,
        address _chainlinkRegistrar,
        address _chainlinkRegistry,
        bytes4 _chainlinkRegistrarSelector,
        address _campaignAdmin
    ) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_beneficiaryWallet != address(0), "Invalid beneficiary wallet");
        require(_feeWallet != address(0), "Invalid fee wallet");
        require(_products.length > 0, "No products provided");
        require(_campaignAdmin != address(0), "Invalid campaign admin");
        
        usdc = IERC20(_usdcAddress);
        beneficiaryWallet = _beneficiaryWallet;
        feeWallet = _feeWallet;
        minimumTarget = _minimumTarget;
        deadline = _deadline;
        feePercentage = 250; // 2.5% default fee
        productToken = ProductToken(_productTokenAddress);
        
        // Store product configurations
        for(uint256 i = 0; i < _products.length; i++) {
            require(_products[i].price > 0, "Invalid product price");
            require(_products[i].productId > 0, "Invalid product ID");
            
            productIds.push(_products[i].productId);
            products[_products[i].productId] = _products[i];
            
            emit ProductPriceSet(_products[i].productId, _products[i].price);
        }

        LINK_TOKEN = _linkToken;
        CHAINLINK_REGISTRAR = _chainlinkRegistrar;
        CHAINLINK_REGISTRY = _chainlinkRegistry;
        CHAINLINK_REGISTRAR_SELECTOR = _chainlinkRegistrarSelector;

        require(_fundingType <= 2, "Invalid funding type");
        fundingType = _fundingType;

        campaignAdmin = _campaignAdmin;
    }

    function deposit(uint256 productId, uint256 quantity) external nonReentrant whenNotPaused {
        ProductConfig memory product = products[productId];
        require(product.price > 0, "Product not available");
        
        if(product.supplyLimit > 0) {
            require(productSoldCount[productId] + quantity <= product.supplyLimit, "Exceeds supply limit");
        }
        
        uint256 totalAmount = product.price * quantity;
        uint256 fee = (totalAmount * feePercentage) / 10000;
        uint256 netAmount = totalAmount - fee;

        // Transfer USDC first
        require(usdc.transferFrom(msg.sender, address(this), totalAmount), "Transfer failed");
        
        // Handle fee transfer
        if (fee > 0) {
            require(usdc.transfer(feeWallet, fee), "Fee transfer failed");
        }

        // Try to mint NFT before updating state
        try productToken.mint(msg.sender, productId, quantity) {
            // Only update state after successful mint
            totalRaised += netAmount;
            tokenDeposits[productId] += netAmount;
            productSoldCount[productId] += quantity;
            
            emit Deposit(msg.sender, totalAmount, fee);
        } catch Error(string memory reason) {
            // Revert the USDC transfer if mint fails
            require(usdc.transfer(msg.sender, totalAmount), "Refund failed after mint error");
            revert(string.concat("NFT mint failed: ", reason));
        } catch (bytes memory /*lowLevelData*/) {
            // Handle low-level errors
            require(usdc.transfer(msg.sender, totalAmount), "Refund failed after mint error");
            revert("NFT mint failed with low-level error");
        }
    }

    function finalize() public nonReentrant whenNotPaused {
        require(!finalized, "Already finalized");
        
        if (fundingType == 0) {
            require(block.timestamp > deadline, "Deadline not reached");
            if (totalRaised >= minimumTarget) {
                _releaseFunds();
            }
        } else if (fundingType == 1) {
            require(msg.sender == owner(), "Only owner can finalize limitless funding");
            _releaseFunds();
        } else if (fundingType == 2) {
            require(block.timestamp > deadline, "Deadline not reached");
            _releaseFunds();
        }
        
        finalized = true;
        emit Finalized();
    }

    function _releaseFunds() private {
        uint256 contractBalance = usdc.balanceOf(address(this));
        require(contractBalance > 0, "No funds to release");
        require(usdc.transfer(beneficiaryWallet, contractBalance), "Transfer failed");
        emit FundsReleased(beneficiaryWallet, contractBalance);
    }

    // Admin functions
    function updateFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        feePercentage = newFeePercentage;
        emit FeeUpdated(newFeePercentage);
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
        require(usdc.transfer(to, amount), "Transfer failed");
        emit EmergencyWithdraw(to, amount);
    }

    // Only for testing
    function updateDeadline(uint256 newDeadline) external onlyOwner {
        require(!finalized, "Fundraiser is finalized");
        require(fundingType != 1, "Limitless funding doesn't support finalization");
        require(newDeadline > block.timestamp, "Deadline must be in the future");
        deadline = newDeadline;
    }

    function getProductIds() public view returns (uint256[] memory) {
        return productIds;
    }

    function setProductPrice(uint256 productId, uint256 price) external onlyOwner {
        require(productSoldCount[productId] == 0, "Product has active sales");

        products[productId].price = price;
        emit ProductPriceSet(productId, price);
    }

    function claimRefund(uint256 productId, uint256 quantity) external {
        ProductConfig memory product = products[productId];
        require(product.price > 0, "Invalid product");
        
        if (fundingType == 0) {
            require(!(finalized && totalRaised >= minimumTarget), "Target was met, refunds not available.");
        } else {
            require(!finalized, "Campaign is finalized, refunds not available.");
        }
        
        uint256 balance = productToken.balanceOf(msg.sender, productId);
        require(balance > 0, "No tokens to refund");
        require(balance >= quantity, "Insufficient tokens to refund");
        uint256 fee = (product.price * feePercentage) / 10000;
        uint256 refundAmount = (product.price - fee) * quantity;
        
        // Burn the NFTs first
        productToken.burn(msg.sender, productId, quantity);

        // Update supply count
        productSoldCount[productId] -= quantity;
        
        totalRaised -= refundAmount;
        
        // Then send the refund
        require(usdc.transfer(msg.sender, refundAmount), "Refund failed");
        emit Refund(msg.sender, refundAmount, productId, quantity);
    }

    function _getStationUpkeepRegistry() internal view returns (IAutomationRegistryConsumer registry) {
        return s_forwarder.getRegistry();
    }

    // function _withdrawLink() internal {
    //     IAutomationRegistryConsumer registry = _getStationUpkeepRegistry();
    //     registry.withdrawFunds(s_stationUpkeepID, owner());
    // }

    // Add checkUpkeep function
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory /* performData */) 
    {
        upkeepNeeded = !finalized && block.timestamp > deadline;
        return (upkeepNeeded, "");
    }

    // Add performUpkeep function
    function performUpkeep(bytes calldata /* performData */) external override {
        if (!finalized && block.timestamp > deadline) {
            finalize();
            emit UpkeepPerformed();
        }
    }

    function initializeChainlink(bytes calldata registrationParams)
        external
        onlyOwner
        returns (uint256 stationUpkeepID)
    {
        bool approveSuccess = IERC20(LINK_TOKEN).approve(CHAINLINK_REGISTRAR, 1 ether);
        require(approveSuccess, "LINK approval failed");

        stationUpkeepID = _registerUpkeep(CHAINLINK_REGISTRAR, CHAINLINK_REGISTRAR_SELECTOR, registrationParams);
        s_stationUpkeepID = stationUpkeepID;
        isRegisteredWithChainlink = true;
        emit UpkeepRegistered(stationUpkeepID);

        if (CHAINLINK_REGISTRY != address(0)) {
            (bool success, bytes memory returnData) =
                CHAINLINK_REGISTRY.staticcall(abi.encodeWithSignature("getForwarder(uint256)", stationUpkeepID));
            if (success) {
                address forwarder = abi.decode(returnData, (address));
                s_forwarder = IAutomationForwarder(forwarder);
                emit ForwarderChanged(forwarder);
            }
        }
    }

    function _registerUpkeep(address registrar, bytes4 selector, bytes calldata registrationParams) internal returns (uint256 upkeepID) {
        (bool success, bytes memory returnData) =
            registrar.call(bytes.concat(selector, registrationParams));
        if (!success) {
            emit Debug("Registration failed", returnData.length);
            if (returnData.length > 0) {    
                emit DebugBytes("Registration data", returnData);
            }
        }
        return abi.decode(returnData, (uint256));
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

    function updateProductPrice(uint256 productId, uint256 price) external onlyAdminOrOwner {
        require(price > 0, "Invalid price");
        require(products[productId].price > 0, "Product does not exist");

        products[productId].price = price;
        emit ProductUpdated(productId, price, products[productId].supplyLimit);
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
} 