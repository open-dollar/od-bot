const { postQuery } = require('./index');

const url = 'https://graphigo.prd.galaxy.eco/query'

const query = `
query campaignParticipants($id: ID!, $pfirst: Int!) {
    campaign(id: $id) {
      id
      numberID
      participants() {
        participants(first: $pfirst) {
          list {
            address {
              id
              address
              twitterUserName
              discordUserName
            }
            points
          }
        }
        participantsCount
      }
    }
  }
`;

const headers = {
    // 'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
};

const variables = {
    "id": "GCHpqttjuU",
    "pfirst": 1000
}

postQuery(url, query, variables, headers)
    .then(data => {
        const users = data.data.campaign.participants.participants.list
        users.forEach(user => {
            console.log(`User: ${user.address.address}, Points: ${user.points}`);
        });
    })
    .catch(error => {
        console.error(error);
    });