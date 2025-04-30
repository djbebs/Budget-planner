# Kill any existing node processes
taskkill /F /IM node.exe 2>$null

# Get the project directory
$projectDir = "C:\Users\djbeb\Documents\Cursor\Program 01"

# Navigate to the project directory
Set-Location -Path $projectDir

# Start the development server
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"npm run dev`""

# Wait for the server to start (adjust sleep time if needed)
Start-Sleep -Seconds 10

# Open the browser
Start-Process "http://localhost:3000" 