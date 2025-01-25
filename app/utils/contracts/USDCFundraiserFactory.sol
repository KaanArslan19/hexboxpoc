// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./USDCFundraiser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract USDCFundraiserFactory is Ownable {
    address public immutable usdcAddress;
    address public immutable productTokenAddress;
    address public immutable linkToken;
    address public immutable chainlinkRegistrar;
    address public immutable chainlinkRegistry;
    bytes4 public immutable chainlinkRegistrarSelector;

    event FundraiserCreated(address indexed fundraiser, address indexed creator);
    event Debug(string message);

    constructor(
        address _usdcAddress,
        address _productTokenAddress,
        address _linkToken,
        address _chainlinkRegistrar,
        address _chainlinkRegistry,
        bytes4 _chainlinkRegistrarSelector
    ) Ownable(msg.sender) {
        usdcAddress = _usdcAddress;
        productTokenAddress = _productTokenAddress;
        linkToken = _linkToken;
        chainlinkRegistrar = _chainlinkRegistrar;
        chainlinkRegistry = _chainlinkRegistry;
        chainlinkRegistrarSelector = _chainlinkRegistrarSelector;
    }

    function createFundraiser(
        address beneficiaryWallet,
        address feeWallet,
        uint256 fundingType,
        uint256 minimumTarget,
        uint256 deadline,
        ProductConfig[] memory products
    ) external returns (address) {
        require(beneficiaryWallet != address(0), "Invalid beneficiary");
        require(feeWallet != address(0), "Invalid fee wallet");
        require(deadline > block.timestamp, "Invalid deadline");
        require(products.length > 0, "No products");

        USDCFundraiser fundraiser = new USDCFundraiser(
            usdcAddress,
            beneficiaryWallet,
            feeWallet,
            fundingType,
            minimumTarget,
            deadline,
            productTokenAddress,
            products,
            linkToken,
            chainlinkRegistrar,
            chainlinkRegistry,
            chainlinkRegistrarSelector
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
} 