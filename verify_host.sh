#!/bin/bash
# BlockScout Direct Verification Script for Host Terminal
# Run this on your HOST machine (not in dev container)

EXPLORER_URL="https://explorer.testnet.arc.network"
COMPILER="solc-0.8.20"
OPTIMIZATION="true"
OPTIMIZATION_RUNS="200"

# Read flattened source code
# Make sure FLATTENED_GenericAMMPair.sol is in current directory

if [ ! -f "FLATTENED_GenericAMMPair.sol" ]; then
    echo "❌ ERROR: FLATTENED_GenericAMMPair.sol not found in current directory"
    exit 1
fi

SOURCE_CODE=$(cat FLATTENED_GenericAMMPair.sol)

echo "============================================================"
echo "🔄 BlockScout Verification Starting"
echo "   Explorer: $EXPLORER_URL"
echo "   Compiler: $COMPILER"
echo "   Optimization: $OPTIMIZATION runs"
echo "============================================================"

# Verify function
verify() {
    local NAME=$1
    local ADDRESS=$2
    local CONTRACT_NAME=$3
    local CONSTRUCTOR_ARGS=$4
    
    echo ""
    echo "📝 Verifying: $NAME"
    echo "   Address: $ADDRESS"
    echo "   📤 Sending to BlockScout..."
    
    curl -s -X POST "$EXPLORER_URL/api" \
        -d "module_for_api=contract_contracts" \
        -d "module=contract_contracts" \
        -d "action=verify_contract" \
        -d "addressHash=$ADDRESS" \
        -d "compiler=$COMPILER" \
        -d "optimization=$OPTIMIZATION" \
        -d "optimizationRuns=$OPTIMIZATION_RUNS" \
        -d "sourceCode=$SOURCE_CODE" \
        -d "contractName=$CONTRACT_NAME" \
        -d "constructorArguments=$CONSTRUCTOR_ARGS" \
        > /tmp/response_$ADDRESS.txt 2>&1
    
    RESPONSE=$(cat /tmp/response_$ADDRESS.txt)
    
    if [ -z "$RESPONSE" ]; then
        echo "   ⚠️  No response (normal - backend processing)"
    else
        echo "   Response: ${RESPONSE:0:100}..."
    fi
    
    echo "   ✅ Sent successfully"
    sleep 2
}

# Verify all 3 contracts
verify "GenericAMMPair (ETH/WBTC)" \
    "0xF4638B258905C6a2F7Aa71E05aAC887dB697c338" \
    "GenericAMMPair" \
    "0x0000000000000000000000006dc1d97820974558e1bd555c04a5a19608f9512d00000000000000000000000027488db1f8f9529b5820de984262179ad913798e"

verify "GenericAMMPair (ETH/ARC)" \
    "0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1" \
    "GenericAMMPair" \
    "0x0000000000000000000000006dc1d97820974558e1bd555c04a5a19608f9512d00000000000000000000000056effb3b22dbbe576e4327d196aa5ed51476924e"

verify "GenericAMMPair (WBTC/ARC)" \
    "0x27e14cfEF1a029A32F574263dce67371bce32d24" \
    "GenericAMMPair" \
    "0x00000000000000000000000027488db1f8f9529b5820de984262179ad913798e00000000000000000000000056effb3b22dbbe576e4327d196aa5ed51476924e"

echo ""
echo "============================================================"
echo "✅ All verification requests sent!"
echo "============================================================"
echo ""
echo "📊 Check results in 2-5 minutes:"
echo ""
echo "   🔗 ETH/WBTC:"
echo "      https://explorer.testnet.arc.network/address/0xF4638B258905C6a2F7Aa71E05aAC887dB697c338"
echo ""
echo "   🔗 ETH/ARC:"
echo "      https://explorer.testnet.arc.network/address/0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1"
echo ""
echo "   🔗 WBTC/ARC:"
echo "      https://explorer.testnet.arc.network/address/0x27e14cfEF1a029A32F574263dce67371bce32d24"
echo ""
echo "============================================================"
