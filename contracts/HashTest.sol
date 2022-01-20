// (c) 2021, Flare Networks Limited. All rights reserved.
// Please see the file LICENSE for licensing terms.

// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

// Should use open zepplin version 3.4.0
// Newer versions require Solidity ^0.8.0
import {MerkleProof} from "@openzeppelin/contracts/cryptography/MerkleProof.sol";

// import "hardhat/console.sol";

contract HashTest {
  using MerkleProof for bytes32[];

  function testFassetProof(
    uint32 typ,
    uint64 chainId,
    uint64 blockNumber,
    bytes32 txId,
    uint16 inUtxo,
    bytes32 sourceAddress,
    bytes32 destinationAddress,
    uint256 destinationTag,
    uint256 spent,
    uint256 received,
    uint256 fee,
    uint8 status,
    bytes32 hashToProve
  ) external pure returns (bool _match) {
    bytes32 hash = keccak256(
      abi.encode(typ, chainId, blockNumber, txId, inUtxo, sourceAddress, destinationAddress, destinationTag, spent, received, fee, status)
    );
    return hash == hashToProve;
  }

  function testDecreaseBalanceProof(
    uint32 typ,
    uint64 chainId,
    uint64 blockNumber,
    bytes32 txId,
    bytes32 sourceAddress,
    uint256 spent,
    bytes32 hashToProve
  ) external pure returns (bool _match) {
    bytes32 hash = keccak256(abi.encode(typ, chainId, blockNumber, txId, sourceAddress, spent));
    return hash == hashToProve;
  }

  function verifyMerkleProof(
    bytes32[] calldata proof,
    bytes32 merkleRoot,
    bytes32 leaf
  ) external pure returns (bool) {
    return proof.verify(merkleRoot, leaf);
  }

}
