const fetch = require('cross-fetch');
const dotenv = require('dotenv')
dotenv.config()

const test = async () => {
  try {
    let response
    // Make API call
    // response = await fetch(`http://localhost:3000/api/rate?secret=${process.env.RATE_SECRET}`);

    response = await fetch(`http://localhost:3000/api/analytics?secret=${process.env.RATE_SECRET}`);

    console.log(response)
  } catch (err) {
    error = err;
  }
}

test()
