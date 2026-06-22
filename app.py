from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import random, time, os, json

app = Flask(__name__, static_folder='.')
CORS(app)

RESPONSES = {
    'chat': [
        "Hey! I'm smol-lm 1.7B running on AW A100 80GB GPU. I can help with coding, cloud architecture, server builds, or anything tech. What would you like to explore?",
        "Great question! In cloud architecture, balance cost, performance, and reliability. For production, use multi-region redundancy with auto-scaling groups.",
        "Good thinking! Kubernetes pairs perfectly with your server build for managing containerized microservices at scale.",
        "Design for failure from the start. Use circuit breakers, retry with exponential backoff, and always have a fallback plan.",
        "The most successful cloud migrations follow a 'strangler fig' pattern - gradually replacing legacy components rather than big-bang rewrites."
    ],
    'code': [
        "```python\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint(list(fibonacci(10)))\n# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55]\n```",
        "```python\nimport asyncio\nimport aiohttp\n\nasync def fetch_all(urls):\n    async with aiohttp.ClientSession() as session:\n        tasks = [session.get(u) for u in urls]\n        return await asyncio.gather(*tasks)\n```",
        "```bash\nhealth_check() {\n  local host=$1 port=$2\n  if nc -zv $host $port 2>/dev/null; then\n    echo \"OK - $host:$port reachable\"\n  else\n    echo \"FAIL - $host:$port unreachable\"\n  fi\n  return $?\n}\n```",
        "```python\nimport torch.nn as nn\n\nclass SimpleNet(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.net = nn.Sequential(\n            nn.Linear(784, 256), nn.ReLU(),\n            nn.Linear(256, 128), nn.ReLU(),\n            nn.Linear(128, 10)\n        )\n    def forward(self, x): return self.net(x)\n```"
    ],
    'generate': [
        "Cloud computing evolved from simple VMs to sophisticated AI-optimized infrastructure. GPU acceleration now powers large language models like smol-lm 1.7B, making advanced AI accessible without specialized hardware. The future is multi-cloud, edge-enabled, and AI-native.",
        "The A100 GPU delivers 312 TFLOPS FP16 with 80GB HBM2e memory. This enables efficient inference of 1.7B parameter models like smol-lm. Parallel matrix operations across thousands of CUDA cores make this possible.",
        "Modern data centers are engineering marvels consuming megawatts with advanced cooling. Cloud providers offer instances with 8x A100 GPUs via NVLink, providing 640GB unified GPU memory for the most demanding AI workloads."
    ],
    'analyze': [
        "Build Analysis:\n\nCPU: Excellent for compute workloads, strong single & multi-threaded perf.\nGPU: Exceptional AI inference, ample VRAM for large models.\nMemory: Handles modern workloads. For AI training, consider 64GB+.\nStorage: NVMe ensures fast I/O.\n\nScore: 94/100 - Premium workstation build for AI/ML development.",
        "Performance Projections:\n- AI Inference: ~128 samples/sec\n- Code Compilation: ~45s (large projects)\n- Data Throughput: ~2.5GB/s\n- Multi-tasking: Excellent with 16+ cores\n\nRecommendations:\n1. Add secondary SSD for storage\n2. 64GB RAM for virtualization\n3. 1000W PSU for headroom"
    ]
}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/ai', methods=['POST'])
def ai_endpoint():
    data = request.json
    model = data.get('model', 'chat')
    prompt = data.get('prompt', '')
    temperature = float(data.get('temperature', 0.7))
    max_tokens = int(data.get('max_tokens', 512))

    # Simulate GPU inference latency
    time.sleep(0.3 + random.random() * 0.5)

    responses = RESPONSES.get(model, RESPONSES['chat'])
    response = random.choice(responses)

    return jsonify({
        'model': 'smol-lm-1.7b-' + model,
        'response': response,
        'usage': {
            'prompt_tokens': len(prompt.split()),
            'completion_tokens': len(response.split()),
            'total_tokens': len(prompt.split()) + len(response.split())
        },
        'gpu': {
            'model': 'NVIDIA A100 80GB',
            'memory_used_gb': round(12.4 + random.random() * 4, 1),
            'memory_total_gb': 80,
            'temperature_c': round(55 + random.random() * 10, 1),
            'power_w': round(180 + random.random() * 40, 1),
            'utilization_pct': round(45 + random.random() * 30, 1)
        }
    })

@app.route('/api/gpu-status', methods=['GET'])
def gpu_status():
    return jsonify({
        'model': 'NVIDIA A100 80GB',
        'memory_used_gb': round(12.4 + random.random() * 3, 1),
        'memory_total_gb': 80,
        'temperature_c': round(55 + random.random() * 8, 1),
        'power_w': round(180 + random.random() * 30, 1),
        'utilization_pct': round(45 + random.random() * 25, 1),
        'processes': [
            {'pid': 1234, 'name': 'smol-lm-inference', 'memory_mb': 8456},
            {'pid': 5678, 'name': 'server-backend', 'memory_mb': 234}
        ]
    })

@app.route('/api/models', methods=['GET'])
def list_models():
    return jsonify({
        'models': [
            {'id': 'chat', 'name': 'smol-lm Chat', 'params': '1.7B', 'type': 'Conversation'},
            {'id': 'code', 'name': 'smol-lm Code', 'params': '1.7B', 'type': 'Code Generation'},
            {'id': 'generate', 'name': 'smol-lm Text', 'params': '1.7B', 'type': 'Text Generation'},
            {'id': 'analyze', 'name': 'smol-lm Analyze', 'params': '1.7B', 'type': 'Data Analysis'}
        ],
        'hardware': 'NVIDIA A100 80GB GPU'
    })

if __name__ == '__main__':
    print(' Cloud Compute Server starting...')
    print(' http://127.0.0.1:5000')
    print(' AI: smol-lm 1.7B (simulated on A100 GPU)')
    app.run(host='127.0.0.1', port=5000, debug=False)
