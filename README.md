# Staking Contract Using Jetton Wallet for Record Keeping

This staking system uses the **Jetton principle**, where users stake TON by sending it to the master contract. The master contract mints staked Jettons and sends them to the user's **Jetton wallet**, which tracks the staking date. Users can withdraw their staked TON by burning staked Jettons from their wallet.

## Features

1. **Decentralized Record Keeping**:
   - The **Jetton wallet** records the date of staking when it receives staked Jettons, not the master contract.
   - This approach eliminates the need to store all staking data in one main contract, reducing on-chain storage costs and improving scalability. Each user's Jetton wallet independently handles their staking records, creating a decentralized and efficient solution.

2. **Stake TON**:
   - Users send TON to the master contract.
   - The master contract mints staked Jettons and sends them to the user's Jetton wallet.

3. **Withdraw Staked TON**:
   - Users send their staked Jettons back to the master contract.
   - The contract calculates the equivalent TON based on the Jetton amount and sends it to the user.

4. **Send Restriction for Staked Jettons**:
   - Staked Jettons can only be sent to the master contract. Any attempt to transfer staked Jettons to another address will fail, ensuring that the staking mechanism remains secure and prevents misuse.

5. **Flexible Reward System**:
   - Rewards can be calculated based on the staking duration stored in the Jetton wallet.

---

## Contract Workflow

### 1. Staking TON
- Users send TON to the master contract.
- The master contract:
  - Mints staked Jettons equivalent to the TON amount sent, based on the **1 TON = 10 staked TON** ratio for testing purposes.
  - Transfers the staked Jettons to the user's **Jetton wallet**.
- The **Jetton wallet**:
  - Records the date of receiving the staked Jettons, which serves as the staking start time.
  - Ensures staked Jettons can only be sent back to the master contract.

#### **Example Staking Transaction**:
- **Transaction Hash**: [tonviewer](https://tonviewer.com/transaction/5f3e6323943d5ff5d28caab4650208a6eabefb3cea73efa84b10ee92c930c761)
- **Description**: 
  - A user sent 0.07 TON to the master contract.
  - The master contract minted 0.7 staked Jettons and transferred them to the user's Jetton wallet. I did a 1-10 ration to have more in hand for tests.
  - The Jetton wallet recorded the staking start date.

---

### 2. Withdrawing Staked TON
- Users send their staked Jettons back to the master contract.
- The master contract:
  - Queries the staking start date from the user's Jetton wallet.
  - Calculates the TON equivalent based on the **1 TON = 1 staked TON** ratio for testing purposes.
  - Sends the calculated TON to the user.

#### **Example Withdrawal Transaction**:
- **Transaction Hash**: [TonViewer Link](https://tonviewer.com/transaction/f535ce00409ff63b4b8b0ec20b17a196d39e7d777efb8125efd2df108401a25f) (Add a valid link here)
- **Description**: 
  - The user sent 0.8 staked Jettons back to the master contract.
  - The master contract calculated the equivalent 0.8 TON and sent it to the user's wallet wiith message of how much time he staked.

---

## Testing Supply Adjustment
- During testing, the following temporary ratios are used:
  - **1 TON = 10 staked TON** for staking.
  - **1 TON = 1 staked TON** for withdrawals.
- These adjustments are solely for testing purposes to create a larger supply of staked Jettons during initial trials. In the final deployment, a **1 TON = 1 staked TON** ratio will be used consistently for both staking and withdrawals.

---

## Restrictions on Staked Jettons
- Staked Jettons are restricted and can **only** be sent back to the master contract.
- Any attempt to send staked Jettons to an address other than the master contract will fail.
- This restriction ensures the integrity of the staking system and prevents misuse or unauthorized transfers.

---

## Contract Functions

### Master Contract

#### **stake**
- **Description**: Users send TON to the master contract to mint staked Jettons.
- **Inputs**:
  - `amount`: The amount of TON to stake.
- **Outputs**:
  - Staked Jettons are minted and sent to the user's Jetton wallet.

#### **withdraw**
- **Description**: Users send their staked Jettons back to the master contract to withdraw their TON.
- **Process**:
  - The contract queries the staking start date from the user's Jetton wallet.
  - Calculates the TON equivalent (and rewards, if any) based on the testing ratio or final ratio.
  - Sends the TON (and rewards, if any) to the user.

---

## Advantages of this Approach

1. **Reduced On-Chain Storage Costs**:
   - By delegating staking record-keeping to individual Jetton wallets, the master contract avoids storing large amounts of user-specific data.

2. **Improved Scalability**:
   - Each user's Jetton wallet independently tracks staking information, allowing the system to scale without overloading the master contract.

3. **Transparency and Decentralization**:
   - Users can verify their staking records directly from their Jetton wallets, ensuring trustless and transparent operations.

4. **Restricted Transfers for Security**:
   - Staked Jettons can only be transferred to the master contract, reducing the risk of misuse and ensuring a secure staking process.

---

This approach is ideal for scalable and decentralized staking mechanisms on blockchain networks like TON.
