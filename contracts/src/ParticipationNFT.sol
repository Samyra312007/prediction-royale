// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ParticipationNFT is ERC721, Ownable {
    struct GameResult {
        uint256 gameId;
        uint256 finalRank;
        uint256 roundsSurvived;
        uint256 prizeWon;
    }

    uint256 public nextTokenId;
    address public factory;
    mapping(uint256 => GameResult) public gameResults;
    mapping(address => uint256[]) public playerTokens;

    event BadgeMinted(address indexed player, uint256 indexed tokenId, uint256 gameId);

    constructor(address _factory) ERC721("PMBR Badge", "PMBR") Ownable(msg.sender) {
        factory = _factory;
    }

    function mintBadge(address player, GameResult calldata result) external {
        require(msg.sender == factory, "Only factory");
        nextTokenId++;
        uint256 tokenId = nextTokenId;
        _safeMint(player, tokenId);
        gameResults[tokenId] = result;
        playerTokens[player].push(tokenId);
        emit BadgeMinted(player, tokenId, result.gameId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        GameResult memory r = gameResults[tokenId];
        string memory color = r.finalRank == 1 ? "gold" : r.finalRank == 2 ? "silver" : r.finalRank == 3 ? "bronze" : "grey";
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(
                abi.encodePacked(
                    '{"name":"PMBR #', toString(tokenId),
                    '","description":"Prediction Market Battle Royale Badge',
                    '","attributes":[',
                    '{"trait_type":"Game ID","value":"', toString(r.gameId), '"},',
                    '{"trait_type":"Rank","value":"', toString(r.finalRank), '"},',
                    '{"trait_type":"Rounds Survived","value":"', toString(r.roundsSurvived), '"},',
                    '{"trait_type":"Prize","value":"', toString(r.prizeWon), '"}',
                    '],"image":"data:image/svg+xml;base64,',
                    _base64Encode(_generateSVG(color, r.gameId, r.finalRank)),
                    '"}'
                )
            )
        ));
    }

    function _generateSVG(string memory color, uint256 gameId, uint256 rank) internal pure returns (bytes memory) {
        bytes32 colorHash = keccak256(bytes(color));
        string memory fillColor;
        if (colorHash == keccak256(bytes("gold"))) {
            fillColor = "FFD700";
        } else if (colorHash == keccak256(bytes("silver"))) {
            fillColor = "C0C0C0";
        } else if (colorHash == keccak256(bytes("bronze"))) {
            fillColor = "CD7F32";
        } else {
            fillColor = "808080";
        }
        return abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">',
            '<rect width="300" height="300" fill="#', fillColor, '"/>',
            '<text x="150" y="150" text-anchor="middle" fill="white" font-size="48" font-weight="bold">PMBR</text>',
            '<text x="150" y="200" text-anchor="middle" fill="white" font-size="24">Game #', toString(gameId), '</text>',
            '<text x="150" y="240" text-anchor="middle" fill="white" font-size="20">Rank #', toString(rank), '</text>',
            '</svg>'
        );
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) { digits--; buffer[digits] = bytes1(uint8(48 + uint256(value % 10))); value /= 10; }
        return string(buffer);
    }

    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        bytes memory result = new bytes(encodedLen + 32);
        assembly {
            let tablePtr := add(table, 1)
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            let resultPtr := add(result, 32)
            for {} lt(dataPtr, endPtr) {} {
                let input := mload(dataPtr)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                mstore8(add(resultPtr, 1), mload(add(tablePtr, and(shr(12, input), 0x3F))))
                mstore8(add(resultPtr, 2), mload(add(tablePtr, and(shr(6, input), 0x3F))))
                mstore8(add(resultPtr, 3), mload(add(tablePtr, and(input, 0x3F))))
                dataPtr := add(dataPtr, 3)
                resultPtr := add(resultPtr, 4)
            }
            let rem := mod(mload(data), 3)
            if eq(rem, 1) { mstore(sub(resultPtr, 2), shl(8, 0x3D3D)) }
            if eq(rem, 2) { mstore(sub(resultPtr, 1), shl(8, 0x3D)) }
        }
        return string(result);
    }

    function getPlayerTokens(address player) external view returns (uint256[] memory) {
        return playerTokens[player];
    }
}
