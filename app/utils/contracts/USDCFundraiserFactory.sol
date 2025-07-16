// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./USDCFundraiser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract USDCFundraiserFactory is Ownable {
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    address public usdcAddress;
    address public productTokenAddress;
    // address public linkToken;
    // address public chainlinkRegistrar;
    // address public chainlinkRegistry;
    // bytes4 public chainlinkRegistrarSelector;
    uint256 public defaultFeePercentage;
    address public feeWallet;
    event FundraiserCreated(address indexed fundraiser, address indexed creator);
    //event Debug(string message);

    constructor(
        address _usdcAddress,
        address _productTokenAddress,
        // address _linkToken,
        // address _chainlinkRegistrar,
        // address _chainlinkRegistry,
        // bytes4 _chainlinkRegistrarSelector,
        uint256 _defaultFeePercentage,
        address _feeWallet
    ) Ownable(msg.sender) {
        usdcAddress = _usdcAddress;
        productTokenAddress = _productTokenAddress;
        // linkToken = _linkToken;
        // chainlinkRegistrar = _chainlinkRegistrar;
        // chainlinkRegistry = _chainlinkRegistry;
        // chainlinkRegistrarSelector = _chainlinkRegistrarSelector;
        defaultFeePercentage = _defaultFeePercentage;
        feeWallet = _feeWallet;
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

        USDCFundraiser fundraiser = new USDCFundraiser(
            usdcAddress,
            beneficiaryWallet,
            feeWallet,
            defaultFeePercentage,
            fundingType,
            minimumTarget,
            deadline,
            productTokenAddress,
            products,
            // linkToken,
            // chainlinkRegistrar,
            // chainlinkRegistry,
            // chainlinkRegistrarSelector,
            campaignAdmin
        );

        // if (fundingType == 0) {
        //     // Transfer LINK to fundraiser first
        //     bool success = IERC20(linkToken).transfer(address(fundraiser), 1 ether);
        //     require(success, "LINK transfer failed");
        // }

        // if (fundingType != 1) {
        //     // Create registration params
        //     bytes memory registrationParams = abi.encode(
        //         "USDCFundraiser Automation",
        //         bytes(""),
        //         address(fundraiser),
        //         uint32(300000),
        //         msg.sender,
        //         uint256(0),
        //         bytes(""),
        //         bytes(""),
        //         bytes(""),
        //         uint96(1 ether)
        //     );

        //     // Approve LINK spending first
        //     require(IERC20(linkToken).approve(chainlinkRegistrar, 1 ether), "LINK approval failed");
        //     emit Debug("LINK approved for Chainlink Registrar");

        //     try fundraiser.initializeChainlink(registrationParams) {
        //         emit Debug("Chainlink initialization successful");
        //     } catch Error(string memory reason) {
        //         emit Debug(string.concat("Chainlink initialization failed: ", reason));
        //         revert(string.concat("Chainlink init failed: ", reason));
        //     } catch {
        //         emit Debug("Chainlink initialization failed: low level error");
        //         revert("Chainlink initialization failed");
        //     }
        // }

        // Transfer ownership to the factory owner
        fundraiser.transferOwnership(owner());

        emit FundraiserCreated(address(fundraiser), msg.sender);
        return address(fundraiser);
    }

    function changeDefaultFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage < BASIS_POINTS, "Fee percentage must be less than 100%");
        defaultFeePercentage = newFeePercentage;
    }

    function changeFeeWallet(address newFeeWallet) external onlyOwner {
        require(newFeeWallet != address(0), "Invalid fee wallet");
        feeWallet = newFeeWallet; // Changes Hexbox Fee Wallet
    }

    function getFeeWallet() external view returns (address) {
        return feeWallet;
    }
}