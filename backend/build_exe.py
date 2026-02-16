#!/usr/bin/env python3
"""
Build script for Fart Manager backend using PyInstaller.
Usage: python build_exe.py [--clean]
"""

import os
import sys
import shutil
import subprocess

def main():
    # 切换到 backend 目录
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # 检查是否需要清理
    clean = '--clean' in sys.argv
    if clean:
        print("Cleaning previous build...")
        dirs_to_clean = ['build', 'dist', '__pycache__']
        for d in dirs_to_clean:
            if os.path.exists(d):
                shutil.rmtree(d)
                print(f"  Removed: {d}")
    
    # 运行 PyInstaller
    print("Building backend.exe with PyInstaller...")
    cmd = ['pyinstaller', 'build.spec', '--noconfirm']
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Build failed!")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)
    
    # 检查输出
    exe_path = os.path.join('dist', 'backend.exe')
    if os.path.exists(exe_path):
        size_mb = os.path.getsize(exe_path) / (1024 * 1024)
        print(f"\nBuild successful!")
        print(f"  Output: {exe_path}")
        print(f"  Size: {size_mb:.2f} MB")
    else:
        print("Build failed: backend.exe not found!")
        sys.exit(1)

if __name__ == '__main__':
    main()
