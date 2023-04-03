let web3;
let account;

let maxAmountCanBuy = 1;
let mintIndex = 0;
let mintLimitPerBlock = 0;
let mintLimitPerSale = 0;
let mintStartBlock = 0;
let maxAmount = 0;
let mintPrice = 0;

let blockNumber = 0;
let isBlockCount = false;

let amountCount = document.querySelector(".amount");
let connectWallet = document.querySelector(".connect_wallet");
let btnPlus = document.querySelector(".btn_plus");
let btnMinus = document.querySelector(".btn_minus");
let totalPrice = document.querySelector(".price_count");

window.onload = async function () {
  web3 = new Web3(window.ethereum);
  await check_status();
};

btnPlus.addEventListener("click", function () {
  if(maxAmountCanBuy == 1){
    return;
  }

  amountCount.value++;

  totalPrice.innerHTML =
    (
      web3.utils.fromWei(String(mintPrice), "ether") * amountCount.value
    ).toFixed(4) + " ETHER";
  btnMinus.classList.remove("untouchable");

  if (amountCount.value >= maxAmountCanBuy) {
    amountCount.value = maxAmountCanBuy;
    totalPrice.innerHTML =
      (
        web3.utils.fromWei(String(mintPrice), "ether") * amountCount.value
      ).toFixed(4) + " ETHER";
    btnPlus.classList.add("untouchable");
  }
});

btnMinus.addEventListener("click", function () {
  if(maxAmountCanBuy == 1){
    return;
  }

  amountCount.value--;

  totalPrice.innerHTML =
    (
      web3.utils.fromWei(String(mintPrice), "ether") * amountCount.value
    ).toFixed(4) + " ETHER";
  btnPlus.classList.remove("untouchable");

  if (amountCount.value <= 1) {
    amountCount.value = 1;
    totalPrice.innerHTML =
      (
        web3.utils.fromWei(String(mintPrice), "ether") * amountCount.value
      ).toFixed(4) + " ETHER";
    btnMinus.classList.add("untouchable");
  }
});

async function connect() {
  if (window.ethereum) {
    let isContinue = false;

    await window.ethereum.request({ method: "net_version" }).then((res) => {
      if((res != 1) && (res != 5)){
        alert("Please switch network in MetaMask!");
      }else{
        isContinue = true;
      }
    });

    if(!isContinue){
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    account = accounts[0];
    document.querySelector(".wallet_addr").innerHTML =
      account.substr(0, 8) + "...";
    document.querySelector(".balance_title").innerHTML =
      "Balance(" + account.substr(0, 8) + "...)";

    let balance = await window.ethereum
      .request({ method: "eth_getBalance", params: [account, "latest"] })
      .catch((err) => {
        console.log(err);
      });

    balance = web3.utils.fromWei(String(balance), "ether");

    document.querySelector(".balance_count").innerHTML =
      BigNumber(balance).toFixed(4) + " ETHER";

    await check_status();
  } else {
    alert("Please install and activate MetaMask!");
    return;
  }
}

async function check_status() {
  const contract = new web3.eth.Contract(ABI, CONTRACTADDRESS);

  await window.ethereum.request({ method: "eth_blockNumber" }).then((res) => {
    blockNumber = parseInt(res);
  });

  document.querySelector(".currentblock_desc").innerHTML = "#" + blockNumber;
  calcBlockNumber();

  mintIndex = await contract.methods.totalSupply().call();

  await contract.methods
    .mintingInformation()
    .call()
    .then(function (res) {
      mintLimitPerBlock = parseInt(res[0]);
      mintLimitPerSale = parseInt(res[1]);
      mintStartBlock = parseInt(res[2]);
      maxAmount = parseInt(res[3]);
      mintPrice = parseInt(res[4]);

      maxAmountCanBuy = mintLimitPerBlock;

      document.querySelector(".mintingstart_desc").innerHTML =
        '<span class="highlight">' + "#" + mintStartBlock + "</span>";
      document.querySelector(".pertransaction_desc").innerHTML =
        '<span class="small">Max </span>' + mintLimitPerBlock;
      document.querySelector(".perwallet_desc").innerHTML =
        '<span class="small">Max </span>' + mintLimitPerSale;
      document.querySelector(".remaining_desc").innerHTML =
        '<span class="highlight">' +
        (maxAmount - mintIndex) +
        '</span><span class="small"> / ' +
        maxAmount +
        "</span>";

      if (amountCount.value <= 1) {
        amountCount.value = 1;
      } else if (amountCount.value >= mintLimitPerBlock) {
        amountCount.value = mintLimitPerBlock;
      }
      document.querySelector(".price_count").innerHTML =
        (
          web3.utils.fromWei(String(mintPrice), "ether") * amountCount.value
        ).toFixed(4) + " ETHER";
    })
    .catch(function (err) {
      console.log(err);
    });
}

function calcBlockNumber() {
  if (!isBlockCount) {
    setInterval(function () {
      blockNumber += 1;
      document.querySelector(".currentblock_desc").innerHTML =
        "#" + blockNumber;
    }, 12100);
    isBlockCount = true;
  }
}

async function customMint() {
  const contract = new web3.eth.Contract(ABI, CONTRACTADDRESS);

  await contract.methods
    .getMintingStage()
    .call()
    .then(function (res) {
      if (res[0]) {
        publicMint();
      } else if (res[1]) {
        whitelistMint();
      } else {
        alert("Minting hasn't started yet.");
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

async function publicMint() {
  if (window.ethereum) {
    await window.ethereum.request({ method: "net_version" }).then((res) => {
      console.log(res);
    });
  } else {
    alert("Please install and activate MetaMask!");
    return;
  }

  const contract = new web3.eth.Contract(ABI, CONTRACTADDRESS);
  const amount = amountCount.value;

  await check_status();

  mintIndex = await contract.methods.totalSupply().call();

  if (maxAmount <= mintIndex) {
    alert("All NFTs are minted.");
    return;
  } else if (blockNumber <= mintStartBlock) {
    alert("Minting hasn't started yet.");
    return;
  }

  const total_value = BigNumber(amount * mintPrice);

  try {
    const result = await contract.methods.publicMint(amount).send({
      from: account,
      value: total_value,
    });

    if (result != null) {
      alert("Congratulations! Your NFT has been minted successfully.");
      connect();
    }
  } catch (err) {
    console.log(err);
    alert("Mint failed. Please retry or contact the team in discord.");
    connect();
  }
}

async function whitelistMint() {
  if (window.ethereum) {
    await window.ethereum.request({ method: "net_version" }).then((res) => {
      console.log(res);
    });
  } else {
    alert("Please install and activate MetaMask!");
    return;
  }

  const contract = new web3.eth.Contract(ABI, CONTRACTADDRESS);
  const amount = amountCount.value;

  const leafNodes = whitelist.map((addr) => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  const addr = keccak256(account);
  const hexProof = merkleTree.getHexProof(addr);

  await check_status();

  mintIndex = await contract.methods.totalSupply().call();

  if (maxAmount <= mintIndex) {
    alert("All NFTs are minted.");
    return;
  } else if (blockNumber <= mintStartBlock) {
    alert("Minting hasn't started yet.");
    return;
  }

  const total_value = BigNumber(amount * mintPrice);

  try {
    const result = await contract.methods.whitelistMint(amount, hexProof).send({
      from: account,
      value: total_value,
    });

    if (result != null) {
      alert("Congratulations! Your NFT has been minted successfully.");
      connect();
    }
  } catch (err) {
    console.log(err);
    alert("Mint failed. Please retry or contact the team in discord.");
    connect();
  }
}
