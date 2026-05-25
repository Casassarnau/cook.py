import json
from pathlib import Path

def autofix_recipe_folder(folder_path):
    target_dir = Path(folder_path)
    
    if not target_dir.exists() or not target_dir.is_dir():
        print(f"❌ Error: The directory '{folder_path}' does not exist.")
        return

    # Find all .json files in the directory
    json_files = list(target_dir.glob("*.json"))
    
    if not json_files:
        print(f"🤷 No .json files found in '{folder_path}'.")
        return

    print(f"🔍 Found {len(json_files)} JSON files in '{folder_path}'. Starting autofix...\n")
    
    success_count = 0
    fail_count = 0

    for file_path in json_files:
        try:
            # 1. Read and parse the JSON file
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 2. Overwrite it with beautiful, standardized formatting
            with open(file_path, 'w', encoding='utf-8') as f:
                # indent=4 formats it neatly, ensure_ascii=False keeps special characters intact
                json.dump(data, f, indent=4, ensure_ascii=False)
            
            print(f"✨ Fixed & Formatted: {file_path.name}")
            success_count += 1
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to fix: {file_path.name}")
            print(f"   ↳ Syntax Error on Line {e.lineno}, Col {e.colno}: {e.msg}")
            fail_count += 1
        except Exception as e:
            print(f"❌ Unexpected error with {file_path.name}: {e}")
            fail_count += 1

    print("\n--- Summary ---")
    print(f"✅ Successfully formatted: {success_count} files")
    if fail_count > 0:
        print(f"⚠️ Failed due to critical syntax errors: {fail_count} files")

if __name__ == "__main__":
    # Target your specific recipes folder
    autofix_recipe_folder("docs/recipes")