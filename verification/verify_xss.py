import sys
import time
import re
from playwright.sync_api import sync_playwright

def get_server_ip():
    try:
        with open("server.log", "r") as f:
            content = f.read()
            # Look for "Servidor Cript-Chat rodando em ws://<IP>:8080"
            match = re.search(r"ws://([\d\.]+):8080", content)
            if match:
                return match.group(1)
    except FileNotFoundError:
        pass
    return "127.0.0.1" # Fallback

SERVER_IP = get_server_ip()
print(f"Using Server IP: {SERVER_IP}")

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Define dialog handler
    def handle_dialog(dialog):
        #print(f"Dialog message: {dialog.message}")
        if "IP" in dialog.message:
            dialog.accept(SERVER_IP)
        elif "nome" in dialog.message:
            dialog.accept("Attacker")
        elif "chave" in dialog.message:
            dialog.accept("secret")
        else:
            dialog.dismiss()

    # Handle the prompt dialogs
    page.on("dialog", handle_dialog)

    # Navigate to the app
    # Use 127.0.0.1 or localhost
    page.goto("http://localhost:8000/client/index.html")

    # Wait for connection (check for "Bem-vindo")
    try:
        page.wait_for_selector("text=Bem-vindo ao Cript-Chat!", timeout=5000)
    except Exception as e:
        print(f"Failed to connect or find welcome message: {e}")
        page.screenshot(path="verification/failed_connection.png")
        # Check if any errors in console
        msgs = []
        page.on("console", lambda msg: msgs.append(msg.text))
        # Wait a bit
        time.sleep(1)
        print("Console logs:", msgs)
        browser.close()
        return

    # Type malicious message
    xss_payload = "<img src=x onerror=document.body.style.backgroundColor='red'>"
    # Find textarea by ID
    page.fill("#mensagem", xss_payload)
    # Click Send button
    page.click("#enviar")

    # Wait a bit for the message to be received and processed
    time.sleep(2)

    # Take screenshot
    page.screenshot(path="verification/xss_check.png")

    # Check if background is red
    bgcolor = page.evaluate("document.body.style.backgroundColor")
    print(f"Background color: {bgcolor}")

    if bgcolor == "red":
        print("VULNERABILITY CONFIRMED: Background changed to red.")
    else:
        print("VULNERABILITY NOT FOUND: Background did not change.")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
