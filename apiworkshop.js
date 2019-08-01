const express = require('express');
const app = express();
const port = 3000;

const INITIAL_BALANCE = 100;
let totalAccounts = 1;

let accounts = {
    "0": {
        name: "Account 1",
        balance: 100,
        creatorId: "admin",
        transactions: []
    }
}


app.use(express.json());
app.listen(port, () => console.log(`listening on ${port}`))


app.get('/ping', (req, res) => res.status(200).send("Jordan is great."));

app.post('/accounts', (req,res) => {

    const accountName = req.body['name'];
    const callerId = req.headers['authorization'];

    const newAccount = createAccount(accountName, INITIAL_BALANCE, callerId);

    res.status(201).send(newAccount);
});



app.get('/accounts/:accountId', (req,res) => {
    const accountId = req.params['accountId'];
    const callerId = req.headers['authorization'];

    const requestedAccount = getAccountById(accountId);

    if (!requestedAccount) {
        return res.status(404).send("account doesn't exist.")
    }

    if (callerId != requestedAccount.creatorId) {
        return res.status(401).send("you can't access this!");
    }

    res.status(200).send(requestedAccount);
})

app.post('/accounts/:sourceId/transactions', (req,res) => {
    const sourceId = req.params['sourceId'];
    const amount = req.body['amount'];
    const destinationId = req.body['destinationId'];

    const callerId = req.headers['authorization'];
    const requestedAccount = getAccountById(sourceId);

    if (!requestedAccount) {
        return res.status(404).send("source account not found")
    }

    if (sourceId == destinationId) {
        return res.status(400).send("invalid target");
    }

    if (callerId != requestedAccount.creatorId) {
        return res.status(401).send('no access');
    }

    if (amount > requestedAccount.balance || amount <= 0) {
        return res.status(400).send("invalid balance")
    }

    const newTransaction = performTransaction(sourceId, destinationId, amount);

    res.status(201).send(newTransaction)

})

app.get('/accounts/:accountId/transactions', (req,res) => {
    const accountId = req.params['accountId'];
    const callerId = req.headers['authorization'];

    const requestedAccount = getAccountById(accountId);
    if (!requestedAccount) {
        return res.status(404).send("account doesn't exist.")
    }

    if (callerId != requestedAccount.creatorId) {
        return res.status(401).send('no access');
    }

   res.status(200).send(requestedAccount.transactions);
}) 


function performTransaction(sourceAccountId, destAccountId, amount) {
    const sourceAccount = getAccountById(sourceAccountId);
    const destAccount = getAccountById(destAccountId);

    const newTransaction = {
        from: sourceAccountId,
        to: destAccountId,
        amount: amount
    }
    sourceAccount.balance -= amount;
    destAccount.balance += amount;

    sourceAccount.transactions.push(newTransaction);
    destAccount.transactions.push(newTransaction);

    updateAccount(sourceAccount);
    updateAccount(destAccount);

    return newTransaction;
}


function createAccount(accountName, initialBalance, creatorId) {
    const newAccount = {
        id: totalAccounts++,
        name: accountName,
        balance: initialBalance,
        creatorId: creatorId,
        transactions: []
    }
    
    accounts[String(newAccount.id)] = newAccount;

    return accounts[String(newAccount.id)];
}

function getAccountById(accountId) {
    return accounts[String(accountId)];
}


function updateAccount(updatedAccount) {
    accounts[updatedAccount.id] = updatedAccount;
}
