export const litUpAbi = [
  {
    inputs: [],
    name: "PostIsHidden",
    type: "error"
  },
  {
    inputs: [],
    name: "nextPostId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "previewUri", type: "string" },
      { internalType: "string", name: "encryptedUri", type: "string" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" }
    ],
    name: "createPost",
    outputs: [{ internalType: "uint256", name: "postId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "postId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "purchase",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "postId", type: "uint256" },
      { internalType: "uint256", name: "price", type: "uint256" }
    ],
    name: "updatePrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "postId", type: "uint256" },
      { internalType: "bool", name: "hidden", type: "bool" }
    ],
    name: "hidePost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "postId", type: "uint256" }],
    name: "getPost",
    outputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "maxSupply", type: "uint256" },
      { internalType: "uint256", name: "minted", type: "uint256" },
      { internalType: "string", name: "previewUri", type: "string" },
      { internalType: "string", name: "encryptedUri", type: "string" },
      { internalType: "bool", name: "hidden", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bool", name: "pause", type: "bool" }],
    name: "emergencyShutdown",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }, { internalType: "uint256", name: "id", type: "uint256" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }, { internalType: "uint256", name: "postId", type: "uint256" }],
    name: "hasAccess",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
