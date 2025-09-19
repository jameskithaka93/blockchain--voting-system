const Voting = artifacts.require("Voting");

contract("Voting", (accounts) => {
    // accounts[0] will be the admin, others are voters
    const admin = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];

    let votingInstance;

    beforeEach(async () => {
        // Re-deploy the contract before each test to ensure a clean state
        const candidateNames = ["Alice", "Bob", "Charlie"];
        votingInstance = await Voting.new(candidateNames, { from: admin });
    });

    it("should deploy with the correct number of candidates", async () => {
        const candidateCount = await votingInstance.getCandidatesCount();
        assert.equal(candidateCount.toNumber(), 3, "Candidate count should be 3");
    });

    it("should allow a user to vote and increment the vote count", async () => {
        const candidateId = 0; // Vote for Alice
        
        // Voter 1 casts a vote
        await votingInstance.vote(candidateId, { from: voter1 });

        const candidate = await votingInstance.candidates(candidateId);
        assert.equal(candidate.voteCount.toNumber(), 1, "Vote count for candidate should be 1");
    });

    it("should not allow a voter to vote more than once", async () => {
        const candidateId = 0;
        
        // Voter 1 casts their first vote
        await votingInstance.vote(candidateId, { from: voter1 });

        // Try to vote a second time from the same account and expect an error
        try {
            await votingInstance.vote(candidateId, { from: voter1 });
            assert.fail("Voter was allowed to vote more than once");
        } catch (error) {
            assert.include(error.message, "You have already voted.", "The expected error message was not received");
        }
    });

    it("should not allow voting for an invalid candidate ID", async () => {
        const invalidCandidateId = 99; // A non-existent candidate ID
        
        // Try to vote for an invalid ID and expect an error
        try {
            await votingInstance.vote(invalidCandidateId, { from: voter1 });
            assert.fail("Voter was allowed to vote for an invalid candidate");
        } catch (error) {
            assert.include(error.message, "Invalid candidate ID.", "The expected error message was not received");
        }
    });

    it("should correctly return all candidates", async () => {
        const allCandidates = await votingInstance.getAllCandidates();
        assert.equal(allCandidates.length, 3, "getAllCandidates should return all candidates");
        assert.equal(allCandidates[0].name, "Alice", "First candidate name should be Alice");
    });
});