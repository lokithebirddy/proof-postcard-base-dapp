// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofPostcard {
    uint256 public nextPostcardId = 1;

    struct PostcardEntry {
        address sender;
        string title;
        string place;
        string stamp;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => PostcardEntry) private postcards;

    event PostcardSent(
        uint256 indexed postcardId,
        address indexed sender,
        string title,
        string place,
        string stamp,
        string note
    );

    function sendPostcard(
        string calldata title,
        string calldata place,
        string calldata stamp,
        string calldata note
    ) external returns (uint256 postcardId) {
        require(bytes(title).length > 0 && bytes(title).length <= 36, "Invalid title");
        require(bytes(place).length > 0 && bytes(place).length <= 40, "Invalid place");
        require(bytes(stamp).length > 0 && bytes(stamp).length <= 16, "Invalid stamp");
        require(bytes(note).length > 0 && bytes(note).length <= 180, "Invalid note");

        postcardId = nextPostcardId++;
        postcards[postcardId] = PostcardEntry({
            sender: msg.sender,
            title: title,
            place: place,
            stamp: stamp,
            note: note,
            createdAt: block.timestamp
        });

        emit PostcardSent(postcardId, msg.sender, title, place, stamp, note);
    }

    function getPostcard(
        uint256 postcardId
    )
        external
        view
        returns (
            address sender,
            string memory title,
            string memory place,
            string memory stamp,
            string memory note,
            uint256 createdAt
        )
    {
        PostcardEntry storage entry = postcards[postcardId];
        return (
            entry.sender,
            entry.title,
            entry.place,
            entry.stamp,
            entry.note,
            entry.createdAt
        );
    }
}
