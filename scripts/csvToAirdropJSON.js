const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const { parseEther } = require("@ethersproject/units")

const inputCsvPath = path.join(__dirname, "export_2024-12-01 - FInal ODG Allocations.csv");
const outputJsonPath = path.join(__dirname, "merkl-airdrop-dec-2024.json");

const convertCsvToAirdropJSON = () => {
    const airdropData = {
        rewardToken: "0x000D636bD52BFc1B3a699165Ef5aa340BEA8939c",
        rewards: {},
    };

    fs.createReadStream(inputCsvPath)
        .pipe(csvParser())
        .on("data", (row) => {
            const recipient = row.id;
            const amount = row["Total ODG"];
            const bolts = row["bolts"]

            // Add the recipient and their rewards in wei
            if (!airdropData.rewards[recipient]) {
                airdropData.rewards[recipient] = {};
            }
            airdropData.rewards[recipient][`Bolts earned: ${Number(bolts).toLocaleString()}`] = parseEther(amount).toString();
        })
        .on("end", () => {
            fs.writeFileSync(outputJsonPath, JSON.stringify(airdropData, null, 2));
            console.log(`Airdrop JSON file has been saved to ${outputJsonPath}`);
        })
        .on("error", (error) => {
            console.error("Error reading CSV file:", error);
        });
};

convertCsvToAirdropJSON(); 