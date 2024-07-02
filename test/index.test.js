const fetch = require("cross-fetch");
const dotenv = require("dotenv");
dotenv.config();

const execute = async (url) => {
  try {
    const response = await fetch(url);
    // console.log(response);
    const json = await response.json()
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    error = err;
  }
}

const test = async () => {
  // Discord bot commands
  // execute(`http://localhost:3000/api/rate?secret=${process.env.RATE_SECRET}`);
  // execute(`http://localhost:3000/api/analytics?secret=${process.env.RATE_SECRET}`);
  // execute(`http://localhost:3000/api/oracle?secret=${process.env.RATE_SECRET}`);
  // execute(`http://localhost:3000/api/auction?secret=${process.env.RATE_SECRET}`);
  // execute(`http://localhost:3000/api/user?address=0xC295763Eed507d4A0f8B77241c03dd3354781a15&secret=${process.env.RATE_SECRET}`);
  // execute(`http://localhost:3000/api/claim?address=0xC295763Eed507d4A0f8B77241c03dd3354781a15&secret=${process.env.RATE_SECRET}`);
  // execute(`http://localhost:3000/api/price?secret=${process.env.RATE_SECRET}&token=MAGIC&price=100000000000000&execute=false`);
  // execute(`http://localhost:3000/api/liquidate?secret=${process.env.RATE_SECRET}&id=1`);
  // execute(`http://localhost:3000/api/accounting?secret=${process.env.RATE_SECRET}&id=1`);

  // // od-subgraph data
  // execute(`http://localhost:3000/api/uservaults?address=0x1df428833f2c9fb1ef098754e5d710432450d706`);
  // execute(`http://localhost:3000/api/vaults`);

  // // Bolts data
  // execute(`http://localhost:3000/api/bolts`);
  // execute(`http://localhost:3000/api/bolts?address=0xaEAf20615536F34d95f64FC0fAF71E91Fd8812C6`);
  // execute(`http://localhost:3000/api/camelot`); // No longer used. Fetches the users USD tvl in camelot pools

  // Update bolts for users 
  execute(`http://localhost:3000/api/points?type=MULTIPLIER`)
  // execute(`http://localhost:3000/api/points?type=PROTOCOL`);
  // execute(`http://localhost:3000/api/points?type=CAMELOT`);
  // execute(`http://localhost:3000/api/points?type=SOCIAL`);
};

test();
