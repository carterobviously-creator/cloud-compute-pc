#!/usr/bin/env python
"""Deploy Cloud Compute app with a public URL via ngrok tunnel."""
import subprocess, sys, os, time, threading, webbrowser, json

HOST = '127.0.0.1'
PORT = 5000

def print_banner():
    print('')
    print('  \033[1;36m  Cloud Compute Server Builder\033[0m')
    print('  \033[90m  =============================\033[0m')
    print('')

def start_flask():
    """Start the Flask server."""
    from app import app
    print(f'  \033[32m  Flask server starting on http://{HOST}:{PORT}\033[0m')
    app.run(host=HOST, port=PORT, debug=False, use_reloader=False)

def start_ngrok():
    """Start ngrok tunnel and return public URL."""
    try:
        from pyngrok import ngrok, conf
        conf.get_default().monitor_thread = False
        
        # Open tunnel
        tunnel = ngrok.connect(PORT, 'http')
        public_url = tunnel.public_url
        print(f'  \033[36m  Public URL: {public_url}\033[0m')
        print(f'  \033[90m  Share this link with anyone\033[0m')
        print('')
        print(f'  \033[33m  Dashboard: http://127.0.0.1:4040\033[0m')
        print('')
        
        # Try to open browser
        try:
            webbrowser.open(public_url)
        except:
            pass
        
        # Keep running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print('\n  Shutting down...')
            ngrok.kill()
        
        return public_url
    except ImportError:
        return None
    except Exception as e:
        print(f'  \033[31m  ngrok error: {e}\033[0m')
        print(f'  \033[33m  Falling back to local server...\033[0m')
        return None

def main():
    print_banner()
    
    # Start Flask in a thread
    flask_thread = threading.Thread(target=start_flask, daemon=True)
    flask_thread.start()
    time.sleep(1.5)
    
    # Try ngrok tunnel
    url = None
    ngrok_token = os.environ.get('NGROK_AUTH_TOKEN', '')
    try:
        from pyngrok import ngrok, conf
        conf.get_default().monitor_thread = False
        if ngrok_token:
            ngrok.set_auth_token(ngrok_token)
        tunnel = ngrok.connect(PORT, 'http')
        url = tunnel.public_url
    except Exception as e:
        print(f'  \033[33m  ngrok not available: {e}\033[0m')
    
    if url:
        print(f'  \033[36m  Public URL: {url}\033[0m')
        print(f'  \033[90m  Share this link with anyone\033[0m')
        print(f'  \033[33m  Dashboard: http://127.0.0.1:4040\033[0m')
        try: webbrowser.open(url)
        except: pass
        try:
            while True: time.sleep(1)
        except KeyboardInterrupt:
            ngrok.kill()
    else:
        print(f'  \033[33m  Local server at http://{HOST}:{PORT}\033[0m')
        print(f'  \033[33m  To get a public URL:\033[0m')
        print(f'  \033[33m  1. Sign up at https://ngrok.com (free)\033[0m')
        print(f'  \033[33m  2. Get your auth token from dashboard\033[0m')
        print(f'  \033[33m  3. Run: set NGROK_AUTH_TOKEN=your_token\033[0m')
        print(f'  \033[33m  4. Run: py deploy.py\033[0m')
        print(f'  \033[33m  Or use SSH: ssh -R 80:localhost:{PORT} serveo.net\033[0m')
        try: webbrowser.open(f'http://{HOST}:{PORT}')
        except: pass
        flask_thread.join()

if __name__ == '__main__':
    import sys
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    sys.path.insert(0, script_dir)
    main()
