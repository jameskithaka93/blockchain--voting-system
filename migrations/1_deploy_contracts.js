const Voting = artifacts.require("Voting");

module.exports = function (deployer, network, accounts) {
    // These are the addresses from your ganache-cli instance
    const candidateNames = ["Alice", "Bob", "Charlie"];
    const eligibleVoters = [accounts[0], accounts[1], accounts[2]]; // Add the addresses you want to be eligible
    
    deployer.deploy(Voting, candidateNames, eligibleVoters);
};