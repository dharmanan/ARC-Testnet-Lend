#!/usr/bin/env python3
"""
Arc Testnet Contract Verification Script
Tüm kontratları ve fonksiyonlarını test eder
"""

import subprocess
import json
from typing import Dict, List

# Contract addresses from constants.ts
CONTRACTS = {
    'USDC (native)': '0x3600000000000000000000000000000000000000',
    'EURC': '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    'ETH (mock)': '0x6dC1d97820974558e1bD555C04a5A19608F9512d',
    'WBTC (mock)': '0x27488Db1F8F9529B5820De984262179Ad913798E',
    'ARC (mock)': '0x56EFFB3b22DBBE576E4327D196aa5ed51476924e',
    'tUSD (old)': '0x78b8d44732a7e3601328B016d0bc0D30471685B7',
    'LendingPool': '0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9',
    'ScheduledPayoutManager': '0x2A094018d03E9F8f6321e55513aA0EaC89DFdEEf',
    'GenericAMMPair ETH/WBTC': '0xF4638B258905C6a2F7Aa71E05aAC887dB697c338',
    'GenericAMMPair ETH/ARC': '0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1',
    'GenericAMMPair WBTC/ARC': '0x27e14cfEF1a029A32F574263dce67371bce32d24',
}

# RPC endpoint
RPC_URL = 'https://rpc.blockdaemon.testnet.arc.network'

def check_contract_code(contract_address: str) -> bool:
    """Check if contract has bytecode at address"""
    try:
        cmd = [
            'curl',
            '-s',
            '-X', 'POST',
            RPC_URL,
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                'jsonrpc': '2.0',
                'method': 'eth_getCode',
                'params': [contract_address, 'latest'],
                'id': 1,
            })
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        response = json.loads(result.stdout)
        
        if 'result' in response:
            code = response['result']
            has_code = code != '0x'
            return has_code
        return False
    except Exception as e:
        print(f"Error checking {contract_address}: {e}")
        return False

def main():
    print("=" * 80)
    print("ARC TESTNET CONTRACT VERIFICATION")
    print("=" * 80)
    print(f"\nRPC Endpoint: {RPC_URL}\n")
    
    results = {
        'active': [],
        'inactive': [],
        'error': []
    }
    
    for name, address in CONTRACTS.items():
        print(f"Checking {name:.<40} {address}")
        try:
            has_code = check_contract_code(address)
            if has_code:
                print(f"  ✅ ACTIVE - Contract found\n")
                results['active'].append((name, address))
            else:
                print(f"  ❌ INACTIVE - No contract at address\n")
                results['inactive'].append((name, address))
        except Exception as e:
            print(f"  ⚠️  ERROR - {e}\n")
            results['error'].append((name, address, str(e)))
    
    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    print(f"\n✅ ACTIVE CONTRACTS ({len(results['active'])}):")
    for name, addr in results['active']:
        print(f"  • {name:.<40} {addr}")
    
    print(f"\n❌ INACTIVE CONTRACTS ({len(results['inactive'])}):")
    for name, addr in results['inactive']:
        print(f"  • {name:.<40} {addr}")
    
    if results['error']:
        print(f"\n⚠️  ERRORS ({len(results['error'])}):")
        for name, addr, error in results['error']:
            print(f"  • {name:.<40} {error}")
    
    print("\n" + "=" * 80)
    print("NEXT STEPS:")
    print("=" * 80)
    print("""
1. Inactive contracts can be removed from constants.ts
2. Focused testing on active contracts
3. Update README with only active contracts
    """)

if __name__ == '__main__':
    main()
