import "@stdlib/ownable";

message Mint {
    amount: Int;
    receiver: Address;
}
 

contract SampleJetton with Jetton {
    totalSupply: Int as coins;
    owner: Address;
    content: Cell;
    mintable: Bool;

    max_supply: Int as coins; 

    init(owner: Address, content: Cell, max_supply: Int) {
        self.totalSupply = 0;
        self.owner = owner;
        self.mintable = true;
        self.content = content;

        self.max_supply = max_supply; // Initial Setting for max_supply
    }
   receive(msg: TokenTransferInternal) { // receiving TokenTransferInternal of Staked Ton from any wallet to the master contract is a widrawl security need to be added here to verify if the real token received
    let ctx: Context = context();
    
    let sinit: StateInit = initOf JettonDefaultWallet(myAddress(), msg.from);// verifying that it's valid sender for security mesures
    require(contractAddress(sinit) == ctx.sender, "Invalid sender!");
    
    
    let recipient: Address = msg.from;
    let period: Int = now() - msg.currentTime;
    let fizz: StringBuilder = beginString();
    fizz.append("you have staked for");
    fizz.append(period.toString());
    fizz.append("seconds");

    send(SendParameters{
        to: recipient,
        value: msg.amount,
        mode: SendIgnoreErrors, // Ensures the message is sent even if there are errors
        body: fizz.toString().asComment(),
    });
}
    

    receive(msg: Mint) { //minting not needed at all
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        require(self.mintable, "Can't Mint Anymore");
      
    }

    receive() { // Mint stake ton when It receives ton
        let ctx: Context = context();
        
        self.stake(ctx.sender, ctx.value, self.owner);
    }
     

    receive("Owner: MintClose") {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        self.mintable = false;
    }
} 

struct JettonData {
    totalSupply: Int;
    mintable: Bool;
    owner: Address;
    content: Cell;
    walletCode: Cell;
}

// ============================================================================================================ //
@interface("org.ton.jetton.master")
trait Jetton with Ownable {

    totalSupply: Int; // Already set initially 
    mintable: Bool;
    owner: Address;
    content: Cell;

    max_supply: Int; // This is not in the TEP-74 interface

    receive(msg: TokenUpdateContent) {
        self.requireOwner();                // Allow changing content only by owner
        self.content = msg.content;         // Update content
    }

  
    // @to The Address receive the Jetton token after minting
    // @amount The amount of Jetton token being minted
    // @response_destination The previous owner address
    fun mint(to: Address, amount: Int, response_destination: Address) {
        require(self.totalSupply + amount <= self.max_supply, "The total supply will be overlapping.");
        self.totalSupply = self.totalSupply + amount; // Update total supply

        let winit: StateInit = self.getJettonWalletInit(to); // Create message
        
  
        send(SendParameters{
            to: contractAddress(winit), 
            value: 0, 
            bounce: false,
            mode: SendRemainingValue,
            body: TokenTransferInternal{ 
                queryId: 0,
                amount: amount,
                from: myAddress(),
                response_destination: response_destination,
                forward_ton_amount: 0,
                forward_payload: emptySlice(),
                currentTime:0,
              }.toCell(),
            code: winit.code,
            data: winit.data
        });
    }
    fun stake(to: Address, amount: Int, response_destination: Address) {
        require(self.totalSupply + amount <= self.max_supply, "The total supply will be overlapping.");
        self.totalSupply = self.totalSupply + amount; // Update total supply

        let winit: StateInit = self.getJettonWalletInit(to); // Create message
     
        send(SendParameters{
            to: contractAddress(winit), 
            value: ton("0.04"), 
            bounce: false,
            mode: SendIgnoreErrors,
            body: TokenTransferInternal{ 
                queryId: 0,
                amount: amount *10,
                from: myAddress(),
                response_destination: response_destination,
                forward_ton_amount: 0,
                forward_payload: emptySlice(),
                currentTime:0
            }.toCell(),
            code: winit.code,
            data: winit.data
        });
    }


    fun requireWallet(owner: Address) {
        let ctx: Context = context();
        let winit: StateInit = self.getJettonWalletInit(owner);
        require(contractAddress(winit) == ctx.sender, "Invalid sender");
    }

    virtual fun getJettonWalletInit(address: Address): StateInit {
        return initOf JettonDefaultWallet(myAddress(), address);
    }

    // ====== Get Methods ====== //
    get fun get_jetton_data(): JettonData {
        let code: Cell = self.getJettonWalletInit(myAddress()).code;
        return JettonData{ 
            totalSupply: self.totalSupply, 
            mintable: self.mintable, 
            owner: self.owner, 
            content: self.content, 
            walletCode: code
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        let winit: StateInit = self.getJettonWalletInit(owner);
        return contractAddress(winit);
    }
}
// ============================================================ //
@interface("org.ton.jetton.wallet")
contract JettonDefaultWallet {
    const minTonsForStorage: Int = ton("0.01");
    const gasConsumption: Int = ton("0.01");

    balance: Int;
    owner: Address;
    master: Address;
    currentTime: Int;

    init(master: Address, owner: Address ) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
        self.currentTime = now();

    }

    receive(msg: TokenTransfer) { // 0xf8a7ea5
        let ctx: Context = context(); // Check sender
        require(ctx.sender == self.owner, "Invalid sender");

        // Gas checks
        let fwdFee: Int = ctx.readForwardFee() + ctx.readForwardFee();  
        let final: Int =  2 * self.gasConsumption + self.minTonsForStorage + fwdFee;
        require(ctx.value > min(final, ton("0.01")), "Invalid value!!"); 

        // Update balance
        self.balance = self.balance - msg.amount; 
        require(self.balance >= 0, "Invalid balance");

       
        require( msg.destination == self.master,"only can send to master"); // not allowing to transfer only to master to keep data integrity
      
        send(SendParameters{
                to: msg.destination, 
                value: 0,
                mode: SendRemainingValue, 
                bounce: false,
                body: TokenTransferInternal{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    from: self.owner,
                    response_destination: msg.response_destination,
                    forward_ton_amount: msg.forward_ton_amount,
                    forward_payload: msg.forward_payload,
                    currentTime:self.currentTime, //transfer staking information to the contract like time more can be added 
                }.toCell()
            });
    }

    receive(msg: TokenTransferInternal) { // 0x178d4519
        let ctx: Context = context();

        if (ctx.sender != self.master) {
            let sinit: StateInit = initOf JettonDefaultWallet(self.master, msg.from);
            require(contractAddress(sinit) == ctx.sender, "Invalid sender!");
        }

        // Update balance
        self.balance = self.balance + msg.amount;
        require(self.balance >= 0, "Invalid balance"); 
        self.currentTime =  now(); //store data of staking
        
        // Get value for gas
        let msgValue: Int = self.msgValue(ctx.value);  
        let fwdFee: Int = ctx.readForwardFee();
        msgValue = msgValue - msg.forward_ton_amount - fwdFee;

        
         // 0x7362d09c - notify the new owner of JettonToken that the transfer is complete
        if (msg.forward_ton_amount > 0) { 
            send(SendParameters{
                to: self.owner,
                value: msg.forward_ton_amount,
                mode: SendPayGasSeparately + SendIgnoreErrors,
                bounce: false,
                body: TokenNotification {
                    queryId: msg.queryId,
                    amount: msg.amount,
                    from: msg.from,
                    forward_payload: msg.forward_payload
                }.toCell()
            });
        }

        // 0xd53276db -- Cashback to the original Sender
        if (msg.response_destination != null) { 
            send(SendParameters {
                to: msg.response_destination, 
                value: msgValue,  
                bounce: false,
                body: TokenExcesses { 
                    queryId: msg.queryId
                }.toCell(),
                mode: SendIgnoreErrors
            });
        }
    }

 
    get fun msgValue(value: Int): Int {
        let msgValue: Int = value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = self.minTonsForStorage - min(tonBalanceBeforeMsg, self.minTonsForStorage);
        msgValue = msgValue - (storageFee + self.gasConsumption);
        return msgValue;
    }

    bounced(src: bounced<TokenTransferInternal>) {
        self.balance = self.balance + src.amount;
    }

    

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            walletCode: (initOf JettonDefaultWallet(self.master, self.owner)).code
        };
    }
}

struct JettonWalletData {
    balance: Int;
    owner: Address;
    master: Address;
    walletCode: Cell;
}

message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

message(0x178d4519) TokenTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
    currentTime: Int;
    
}

message(0x7362d09c) TokenNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton 
}




message(0xd53276db) TokenExcesses {
    queryId: Int as uint64;
}

message TokenUpdateContent {
    content: Cell;
}
