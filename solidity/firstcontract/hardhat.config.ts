// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.28",
// };
import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-ethers"

//type Config=import{'hardhat/config'}.HardhatUserConfig;
import { HardhatUserConfig } from "hardhat/config";

const config:HardhatUserConfig={
    solidity:"0.8.24",
};

export default config;