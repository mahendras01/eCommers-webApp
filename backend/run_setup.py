#!/usr/bin/env python3
"""
Setup runner script - Initializes admin user and seeds categories/subcategories.
Safe to run multiple times (idempotent).

Usage:
    python run_setup.py
"""
import sys
import subprocess
from pathlib import Path


def print_header(text: str) -> None:
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_success(text: str) -> None:
    """Print success message."""
    print(f"✅ {text}")


def print_error(text: str) -> None:
    """Print error message."""
    print(f"❌ {text}")


def run_command(script_name: str, description: str) -> bool:
    """
    Run a Python script and return True if successful.
    
    Args:
        script_name: Name of the script file
        description: Human-readable description of what the script does
    
    Returns:
        True if successful, False if failed
    """
    script_path = Path(__file__).parent / script_name
    
    if not script_path.exists():
        print_error(f"Script not found: {script_path}")
        return False
    
    print_header(f"Running {description}")
    
    try:
        # Run the script in the current process (same Python interpreter)
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=script_path.parent,
            check=False,
            capture_output=False,
        )
        
        if result.returncode != 0:
            print_error(f"{description} failed with exit code {result.returncode}")
            return False
        
        return True
    
    except Exception as exc:
        print_error(f"Error running {description}: {exc}")
        return False


def main() -> int:
    """
    Main runner function.
    
    Returns:
        0 if all scripts succeed, 1 if any fails
    """
    print("\n🚀 E-Commerce Backend Setup Runner")
    print("   This script initializes your database with admin user and seed data.")
    print("   Safe to run multiple times.\n")
    
    scripts = [
        ("create_admin.py", "Admin User Creation"),
        ("seed_data.py", "Category & SubCategory Seeding"),
    ]
    
    results = []
    for script_name, description in scripts:
        success = run_command(script_name, description)
        results.append((description, success))
        
        if not success:
            print_error(f"Setup halted: {description} failed")
            print("\n📋 Summary:")
            for name, succeeded in results:
                status = "✅ Passed" if succeeded else "❌ Failed"
                print(f"  {status}: {name}")
            return 1
    
    # All scripts succeeded
    print("\n" + "=" * 60)
    print_success("All setup scripts completed successfully!")
    print("=" * 60)
    
    print("\n📋 Setup Summary:")
    for name, succeeded in results:
        status = "✅" if succeeded else "❌"
        print(f"  {status} {name}")
    
    print("\n🎉 Your backend is ready!")
    print("   Start the server with:")
    print("   ./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print()
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
