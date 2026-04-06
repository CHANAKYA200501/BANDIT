import { useEffect } from 'react';
import { ethers } from 'ethers';
import { useThreatStore } from '../store/threatStore';

const RPC_URL = import.meta.env.VITE_POLYGON_RPC || 'http://localhost:8545';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const ABI = [
  "event ThreatLogged(bytes32 indexed inputHash, uint8 riskScore, string threatType, uint256 timestamp, address reporter)"
];

export function useBlockchain() {
  const addChainEvent = useThreatStore((state) => state.addChainEvent);

  useEffect(() => {
    // Polling muted to preserve console cleanliness while local Ganache node is entirely absent.
  }, [addChainEvent]);
}
