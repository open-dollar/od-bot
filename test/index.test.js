const fetch = require("cross-fetch");
const dotenv = require("dotenv");
dotenv.config();

const test = async () => {
  try {
    let response;
    // Make API call
    // response = await fetch(
    //   `http://localhost:3000/api/rate?secret=${process.env.RATE_SECRET}`
    // );

    // response = await fetch
    //   `http://localhost:3000/api/analytics?secret=${process.env.RATE_SECRET}`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/oracle?secret=${process.env.RATE_SECRET}`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/auction?secret=${process.env.RATE_SECRET}`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/user?address=0xC295763Eed507d4A0f8B77241c03dd3354781a15&secret=${process.env.RATE_SECRET}`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/claim?address=0xC295763Eed507d4A0f8B77241c03dd3354781a15&secret=${process.env.RATE_SECRET}`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/price?secret=${process.env.RATE_SECRET}&token=MAGIC&price=100000000000000&execute=false`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/liquidate?secret=${process.env.RATE_SECRET}&id=1`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/accounting?secret=${process.env.RATE_SECRET}&id=1`
    // );


    // response = await fetch(
    //   `http://localhost:3000/api/uservaults?address=0x1df428833f2c9fb1ef098754e5d710432450d706`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/vaults`
    // );

    response = await fetch(
      `http://localhost:3000/api/bolts?address=0x052d62a6479E3C027AFFf55385F2ba53ffe8ba58`
    );

    // response = await fetch(
    //   `http://localhost:3000/api/bolts`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/points`
    // );

    // response = await fetch(
    //   `http://localhost:3000/api/camelot`
    // );

    console.log(response);
    const json = await response.json()
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    error = err;
  }
};

test();
