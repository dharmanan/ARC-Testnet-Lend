#!/usr/bin/env python3
"""
Check which functions from contractService.ts are actually imported and used
"""

import os
import re
from pathlib import Path
from collections import defaultdict

def find_imports_and_usage():
    """Find all imports from contractService and where they're used"""
    
    frontend_dir = Path('/workspaces/ARC-Testnet-Lend/frontend')
    
    # Find all contractService imports
    imports_by_file = defaultdict(set)
    
    # Regex patterns
    import_pattern = re.compile(r'import\s+\{([^}]+)\}\s+from[\'"].*contractService', re.MULTILINE)
    usage_pattern = re.compile(r'\b(\w+)\s*\(')
    
    print("=" * 80)
    print("CONTRACTSERVICE USAGE ANALYSIS")
    print("=" * 80 + "\n")
    
    # Find all TypeScript/TSX files
    for filepath in frontend_dir.rglob('*.ts*'):
        if 'node_modules' in str(filepath) or 'dist' in str(filepath):
            continue
        
        try:
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Find imports
            matches = import_pattern.findall(content)
            if matches:
                import_text = matches[0]
                functions = [f.strip() for f in import_text.split(',')]
                
                relative_path = filepath.relative_to(frontend_dir)
                print(f"📄 {relative_path}")
                
                for func in functions:
                    imports_by_file[func].add(str(relative_path))
                    print(f"   • {func}")
                print()
        except:
            pass
    
    print("=" * 80)
    print("USAGE SUMMARY")
    print("=" * 80 + "\n")
    
    # Sort by frequency of usage (number of files that import it)
    sorted_functions = sorted(imports_by_file.items(), key=lambda x: len(x[1]), reverse=True)
    
    print(f"Total imported functions: {len(sorted_functions)}\n")
    
    print("Most Used Functions:")
    for func, files in sorted_functions[:15]:
        print(f"  {func:.<40} used in {len(files)} file(s)")
        
    print("\nLeast Used Functions (potential candidates for removal):")
    for func, files in sorted_functions[-5:]:
        print(f"  {func:.<40} used in {len(files)} file(s)")
        for file in files:
            print(f"      └─ {file}")

if __name__ == '__main__':
    find_imports_and_usage()
