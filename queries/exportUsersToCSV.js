const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const exportUsersToCSV = async () => {
    try {
        // Fetch all users with id and bolts
        const users = await prisma.user.findMany({
            where: {
                bolts: {
                    gt: 100, // Only include users with more than 100 bolts
                },
            },
            select: {
                id: true,
                bolts: true,
            },
            orderBy: {
                bolts: 'desc', // Sort by descending bolts
            },
        });

        // Convert users to CSV format
        const csvHeader = "id,bolts\n";
        const csvRows = users.map(user => `${user.id},${user.bolts}`).join("\n");
        const csvData = csvHeader + csvRows;

        // Define the output file path
        const outputPath = path.join(__dirname, `export_${new Date().toISOString().split('T')[0]}.csv`);

        // Write CSV data to file
        fs.writeFileSync(outputPath, csvData);
        console.log(`CSV file has been saved to ${outputPath}`);
    } catch (error) {
        console.error("Error exporting users to CSV:", error);
    } finally {
        await prisma.$disconnect();
    }
};

exportUsersToCSV();