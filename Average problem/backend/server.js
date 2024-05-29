const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken'); 
const app = express();
const windowSize = 10;

let windowNumbers = new Set(); 

const secretKey = "PdeDGR";

function verifyAuthorization(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('Unauthorized: Missing authorization header');
  }

  const token = authHeader.split(' ')[1]; 

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).send('Forbidden: Invalid authorization token');
  }
}

async function getNumbers(numberType, numberId) {
  let url;
  switch (numberType) {
    case 'primes':
      url = `http://20.244.56.144/test/primes/${numberId}`;
      break;
    case 'fibo':
      url = `http://20.244.56.144/test/fibo/${numberId}`;
      break;
    case 'even': 
      url = `http://20.244.56.144/test/even/${numberId}`;
      break;
    case 'rand':
      url = `http://20.244.56.144/test/rand/${numberId}`;
      break;
    default:
      throw new Error('Invalid number type');
  }

  const response = await axios.get(url);
  return response.data;
}

function storeNumbers(newNumbers) {
  for (const number of newNumbers) {
    if (windowNumbers.size < windowSize) {
      windowNumbers.add(number);
    } else {
      windowNumbers.delete([...windowNumbers][0]); 
      windowNumbers.add(number);
    }
  }
}

function calculateAverage() {
  const sum = [...windowNumbers].reduce((acc, num) => acc + num, 0);
  return sum / windowSize;
}

app.get('/numbers/:numberType/:numberId', verifyAuthorization, async (req, res) => {
  const numberType = req.params.numberType;
  const numberId = req.params.numberId;

  const windowBefore = [...windowNumbers]; 

  try {
    const newNumbers = await getNumbers(numberType, numberId);
    storeNumbers(newNumbers);

    const avg = calculateAverage();
    const windowAfter = [...windowNumbers]; 

    const response = {
      windowPrevState: windowBefore,
      windowCurrState: windowAfter,
      numbers: newNumbers,
      avg,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

const port = process.env.PORT || 9876;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
