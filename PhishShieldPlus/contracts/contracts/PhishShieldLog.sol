// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PhishShieldLog {
  struct ThreatRecord {
    bytes32 inputHash;
    uint8   riskScore;
    string  threatType;
    uint256 timestamp;
    string  ipfsCID;
    address reporter;
  }

  ThreatRecord[] public records;
  mapping(bytes32 => bool) public seen;

  event ThreatLogged(
    bytes32 indexed inputHash,
    uint8 riskScore,
    string threatType,
    uint256 timestamp,
    address reporter
  );

  function storeThreat(
    bytes32 _hash, uint8 _score,
    string memory _type, string memory _cid
  ) external {
    require(!seen[_hash], "Already logged");
    seen[_hash] = true;
    records.push(ThreatRecord(_hash, _score, _type, block.timestamp, _cid, msg.sender));
    emit ThreatLogged(_hash, _score, _type, block.timestamp, msg.sender);
  }

  function getRecord(uint256 i) external view returns (ThreatRecord memory) {
    return records[i];
  }
  function total() external view returns (uint256) { return records.length; }
}
