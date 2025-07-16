// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./USDCFundraiserUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract USDCFundraiserFactoryUpgradeableV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using Clones for address;

    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    address public usdcAddress;
    address public productTokenAddress;
    uint256 public defaultFeePercentage;
    address public feeWallet;
    
    // Implementation contract address for USDCFundraiser
    address public fundraiserImplementation;
    
    // Array to track all deployed fundraisers
    address[] public deployedFundraisers;
    mapping(address => bool) public isFundraiser;
    
    event FundraiserCreated(address indexed fundraiser, address indexed creator);
    event ImplementationUpdated(address indexed newImplementation);
    event ProductTokenUpdated(address indexed newProductToken);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdcAddress,
        address _productTokenAddress,
        uint256 _defaultFeePercentage,
        address _feeWallet,
        address _fundraiserImplementation,
        address _initialOwner
    ) public initializer {
        __Ownable_init(_initialOwner);
        __UUPSUpgradeable_init();
        
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_productTokenAddress != address(0), "Invalid product token address");
        require(_feeWallet != address(0), "Invalid fee wallet");
        require(_fundraiserImplementation != address(0), "Invalid implementation");
        require(_initialOwner != address(0), "Invalid owner");
        
        usdcAddress = _usdcAddress;
        productTokenAddress = _productTokenAddress;
        defaultFeePercentage = _defaultFeePercentage;
        feeWallet = _feeWallet;
        fundraiserImplementation = _fundraiserImplementation;
    }

    function createFundraiser(
        address beneficiaryWallet,
        uint256 fundingType,
        uint256 minimumTarget,
        uint256 deadline,
        ProductConfig[] memory products
    ) external returns (address) {
        require(beneficiaryWallet != address(0), "Invalid beneficiary");
        require(deadline > block.timestamp, "Invalid deadline");
        require(products.length > 0, "No products");

        address campaignAdmin = msg.sender;

        // Deploy minimal proxy clone of the implementation
        address fundraiserClone = fundraiserImplementation.clone();
        
        // Initialize the clone
        USDCFundraiserUpgradeable(fundraiserClone).initialize(
            usdcAddress,
            beneficiaryWallet,
            feeWallet,
            defaultFeePercentage,
            fundingType,
            minimumTarget,
            deadline,
            productTokenAddress,
            products,
            campaignAdmin,
            owner() // Factory owner becomes the fundraiser owner
        );

        // Track the deployed fundraiser
        deployedFundraisers.push(fundraiserClone);
        isFundraiser[fundraiserClone] = true;

        emit FundraiserCreated(fundraiserClone, msg.sender);
        return fundraiserClone;
    }

    function changeDefaultFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage < BASIS_POINTS, "Fee percentage must be less than 100%");
        defaultFeePercentage = newFeePercentage;
    }

    function changeFeeWallet(address newFeeWallet) external onlyOwner {
        require(newFeeWallet != address(0), "Invalid fee wallet");
        feeWallet = newFeeWallet;
    }

    function updateFundraiserImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        fundraiserImplementation = newImplementation;
        emit ImplementationUpdated(newImplementation);
    }
    
    /**
     * @dev Updates the product token address
     * @param newProductToken The address of the new product token contract
     * @notice Only the owner can update the product token address
     * @notice This only affects new fundraiser deployments, not existing ones
     */
    function updateProductTokenAddress(address newProductToken) external onlyOwner {
        require(newProductToken != address(0), "Invalid product token address");
        productTokenAddress = newProductToken;
        emit ProductTokenUpdated(newProductToken);
    }

    function getFeeWallet() external view returns (address) {
        return feeWallet;
    }
    
    function getDeployedFundraisersCount() external view returns (uint256) {
        return deployedFundraisers.length;
    }
    
    function getDeployedFundraiser(uint256 index) external view returns (address) {
        require(index < deployedFundraisers.length, "Index out of bounds");
        return deployedFundraisers[index];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
