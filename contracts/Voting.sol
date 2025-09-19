// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

contract Voting {
    // Represents a candidate
    struct Candidate {
        string name;
        uint voteCount;
    }

    // A mapping to track if a voter has already cast a vote
    mapping(address => bool) public voters;

    // A mapping to track if a voter is eligible (pre-registered)
    mapping(address => bool) public eligibleVoters;

    // An array to store all candidates
    Candidate[] public candidates;

    // The admin of the contract
    address public admin;

    // A state variable to track if voting is active
    bool public votingActive;

    // Event emitted when a vote is cast
    event Voted(uint indexed candidateId);

    // Event emitted when voting starts or ends
    event VotingStatusChanged(bool newStatus);

    // The constructor now takes both candidate names and a list of eligible voters
    constructor(string[] memory candidateNames, address[] memory eligibleVotersAddresses) {
        admin = msg.sender;
        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({
                name: candidateNames[i],
                voteCount: 0
            }));
        }
        for (uint i = 0; i < eligibleVotersAddresses.length; i++) {
            eligibleVoters[eligibleVotersAddresses[i]] = true;
        }
        // Voting is initially inactive
        votingActive = false;
    }

    // A modifier to restrict a function to the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the admin can call this function.");
        _;
    }

    // Function to start the voting process
    function startVoting() public onlyAdmin {
        require(!votingActive, "Voting is already active.");
        votingActive = true;
        emit VotingStatusChanged(true);
    }

    // Function to end the voting process
    function endVoting() public onlyAdmin {
        require(votingActive, "Voting is not active.");
        votingActive = false;
        emit VotingStatusChanged(false);
    }

    // Function to get the total number of candidates
    function getCandidatesCount() public view returns (uint) {
        return candidates.length;
    }

    // Function to get all candidates at once
    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    // The vote function now checks for eligibility
    function vote(uint candidateId) public {
        require(eligibleVoters[msg.sender], "You are not an eligible voter.");
        require(votingActive, "Voting is not currently active.");
        require(!voters[msg.sender], "You have already voted.");
        require(candidateId >= 0 && candidateId < candidates.length, "Invalid candidate ID.");

        voters[msg.sender] = true;
        candidates[candidateId].voteCount++;
        emit Voted(candidateId);
    }
}