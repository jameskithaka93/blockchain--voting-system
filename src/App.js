import React, { Component } from "react";
import Web3 from "web3";
import VotingContract from "./Voting.json";
import "./App.css";

class App extends Component {
    state = {
        web3: null,
        accounts: null,
        contract: null,
        candidates: [],
        candidateCount: 0,
        voterStatus: false,
        isEligible: false,
        loading: false,
        showResults: false,
        isAdmin: false,
        votingActive: false,
    };

    componentDidMount = async () => {
        try {
            const web3 = new Web3("http://localhost:8545");
            const accounts = await web3.eth.getAccounts();
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = VotingContract.networks[networkId];
            const instance = new web3.eth.Contract(
                VotingContract.abi,
                deployedNetwork && deployedNetwork.address
            );

            const adminAddress = await instance.methods.admin().call();
            const isAdmin = accounts[0] === adminAddress;

            this.setState({ web3, accounts, contract: instance, isAdmin }, this.loadCandidates);
        } catch (error) {
            alert(`Failed to load web3, accounts, or contract. Check console for details.`);
            console.error(error);
        }
    };

    loadCandidates = async () => {
        const { contract, accounts } = this.state;
        const fetchedCandidates = await contract.methods.getAllCandidates().call();
        const votingActive = await contract.methods.votingActive().call();
        
        let voterStatus = false;
        let isEligible = false;
        if (accounts && accounts[0]) {
            voterStatus = await contract.methods.voters(accounts[0]).call();
            isEligible = await contract.methods.eligibleVoters(accounts[0]).call();
        }

        this.setState({ 
            candidates: fetchedCandidates,
            candidateCount: fetchedCandidates.length,
            voterStatus,
            isEligible,
            votingActive
        });
    };

    handleVote = async (candidateId) => {
        const { accounts, contract } = this.state;
        this.setState({ loading: true });
        try {
            const gasPrice = await this.state.web3.eth.getGasPrice();
            await contract.methods.vote(candidateId).send({ 
                from: accounts[0],
                gasPrice: gasPrice
            });
            await this.loadCandidates();
            alert("Vote cast successfully!");
        } catch (error) {
            alert("Error casting vote. You may have already voted, are not an eligible voter, or voting is not active.");
            console.error(error);
        }
        this.setState({ loading: false });
    };

    handleAdminAction = async (action) => {
        const { accounts, contract } = this.state;
        this.setState({ loading: true });
        try {
            const gasPrice = await this.state.web3.eth.getGasPrice();
            if (action === "start") {
                await contract.methods.startVoting().send({ from: accounts[0], gasPrice: gasPrice });
            } else if (action === "end") {
                await contract.methods.endVoting().send({ from: accounts[0], gasPrice: gasPrice });
            }
            await this.loadCandidates();
            alert(`Voting ${action === "start" ? "started" : "ended"} successfully!`);
        } catch (error) {
            alert(`Error performing action. Only the admin can do this.`);
            console.error(error);
        }
        this.setState({ loading: false });
    };

    toggleView = () => {
        this.setState(prevState => ({ showResults: !prevState.showResults }));
    };

    render() {
        if (!this.state.web3) {
            return <div className="loader-container"><div className="loader"></div><div>Loading Web3, accounts, and contract...</div></div>;
        }

        const { showResults, candidates, candidateCount, voterStatus, isEligible, accounts, loading, isAdmin, votingActive } = this.state;

        if (showResults) {
            // Find the total number of votes to calculate percentages
            const totalVotes = candidates.reduce((total, candidate) => total + parseInt(candidate.voteCount), 0);

            return (
                <div className="app-advanced">
                    <div className="header">
                        <h1>📊 Voting Results</h1>
                    </div>
                    <hr />
                    <div className="results-container">
                        {candidates.map((candidate, index) => {
                            const voteCount = parseInt(candidate.voteCount);
                            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                            return (
                                <div key={index} className="result-item">
                                    <div className="candidate-info">
                                        <span className="candidate-name">{candidate.name}</span>
                                        <span className="vote-count">{voteCount} votes</span>
                                    </div>
                                    <div className="bar-container">
                                        <div className="bar" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <span className="percentage-label">{percentage.toFixed(1)}%</span>
                                </div>
                            );
                        })}
                    </div>
                    <button className="vote-btn" onClick={this.toggleView} style={{ marginTop: '20px' }}>
                        Back to Voting
                    </button>
                </div>
            );
        }

        return (
            <div className="app-advanced">
                <div className="header">
                    <h1>🗳️ Decentralized Voting System</h1>
                    <div className="account-info">
                        <span><strong>Account:</strong> {accounts[0]}</span>
                        <span className={voterStatus ? "status-voted" : "status-can-vote"}>
                            {voterStatus ? "Already voted" : "Can vote"}
                        </span>
                        <span><strong>Candidates:</strong> {candidateCount}</span>
                        <span className={isEligible ? "status-can-vote" : "status-voted"}>
                            {isEligible ? "Eligible" : "Not Eligible"}
                        </span>
                    </div>
                </div>
                {isAdmin && (
                    <div className="admin-controls">
                        <h3>Admin Controls</h3>
                        <p className={votingActive ? "status-can-vote" : "status-voted"}>
                            Voting is currently {votingActive ? "Active" : "Inactive"}.
                        </p>
                        <button className="vote-btn" onClick={() => this.handleAdminAction("start")} disabled={votingActive || loading}>
                            Start Voting
                        </button>
                        <button className="vote-btn" onClick={() => this.handleAdminAction("end")} disabled={!votingActive || loading}>
                            End Voting
                        </button>
                    </div>
                )}
                <hr />
                <h2 className="candidate-title">Candidates</h2>
                {!votingActive && !isAdmin && (
                    <p className="status-voted">Voting is currently inactive. Please check back later.</p>
                )}
                {!isEligible && !isAdmin && (
                    <p className="status-voted">You are not an eligible voter. Please contact the admin.</p>
                )}
                <ul className="candidate-list">
                    {candidates.map((candidate, index) => (
                        <li key={index} className="candidate-item">
                            <span className="candidate-name">{candidate.name}</span>
                            <span className="candidate-votes">{candidate.voteCount} votes</span>
                            <button
                                className="vote-btn"
                                onClick={() => this.handleVote(index)}
                                disabled={voterStatus || loading || !votingActive || !isEligible}
                            >
                                {loading ? "Voting..." : "Vote"}
                            </button>
                        </li>
                    ))}
                </ul>
                <button className="vote-btn" onClick={this.toggleView} style={{ marginTop: '20px' }}>
                    View Results
                </button>
                {loading && (
                    <div className="loader-container"><div className="loader"></div><div>Processing your vote...</div></div>
                )}
            </div>
        );
    }
}

export default App;