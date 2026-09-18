"""
Endpoint serverless (Vercel, runtime Python) para o módulo de processamento de
imagens do projeto: detecção de PESSOA EM ZONA DE RISCO sob carga suspensa.

IMPORTANTE — limitação honesta sobre detecção de EPI (capacete):
O modelo YOLOv8 pré-treinado (pesos "yolov8n.pt") é treinado no dataset COCO,
que possui a classe "person" mas NÃO possui uma classe "capacete"/"hard hat".
Portanto, esta primeira versão entrega de forma funcional a detecção de PESSOAS
e o cruzamento com uma "zona de risco" (polígono desenhado pelo gestor, ex.:
área sob o gancho/carga), o que já atende ao pedido de "presença de pessoa em
zona de risco sob carga suspensa".

Para detecção real de uso/ausência de capacete, é necessário treinar (ou usar)
um modelo com classes específicas de EPI — ex.: dataset público "Hard Hat
Workers Dataset" (Roboflow) — e trocar MODEL_PATH abaixo pelos pesos
resultantes (.pt). A interface deste endpoint já foi desenhada para suportar
essa troca sem alterar o restante do app (mesmo formato de resposta).

Requisitos (requirements.txt): ultralytics, pillow, numpy.

Uso esperado: chamado pelo painel do gestor quando HOUVER conexão (o módulo de
imagem é o único ponto do sistema que não precisa funcionar offline — o quiz
em si continua 100% offline via PWA).
"""

import base64
import io
import json
import os

from http.server import BaseHTTPRequestHandler

import numpy as np
from PIL import Image

# Caminho do modelo. Troque para um modelo customizado de EPI quando disponível.
MODEL_PATH = os.environ.get("TRLL_YOLO_MODEL_PATH", "yolov8n.pt")

_model = None


def _get_model():
    """Carrega o modelo YOLOv8 sob demanda (cold start único por instância)."""
    global _model
    if _model is None:
        from ultralytics import YOLO

        _model = YOLO(MODEL_PATH)
    return _model


def _point_in_polygon(x, y, polygon):
    """Ray casting simples — polygon: lista de [x, y] em pixels da imagem."""
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        intersect = ((yi > y) != (yj > y)) and (
            x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi
        )
        if intersect:
            inside = not inside
        j = i
    return inside


def analyze_image(image_bytes: bytes, danger_zone_polygon):
    """
    Executa a detecção e retorna:
      {
        "persons_detected": int,
        "persons_in_danger_zone": int,
        "risk": bool,
        "detections": [{"bbox": [x1,y1,x2,y2], "confidence": float, "in_danger_zone": bool}]
      }
    """
    model = _get_model()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model.predict(source=np.array(image), classes=[0], verbose=False)  # classe 0 = "person" no COCO

    detections = []
    persons_in_zone = 0

    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
            conf = float(box.conf[0])
            cx, cy = (x1 + x2) / 2, y2  # ponto de referência: base central da caixa (pés da pessoa)

            in_zone = False
            if danger_zone_polygon and len(danger_zone_polygon) >= 3:
                in_zone = _point_in_polygon(cx, cy, danger_zone_polygon)
                if in_zone:
                    persons_in_zone += 1

            detections.append(
                {"bbox": [x1, y1, x2, y2], "confidence": round(conf, 3), "in_danger_zone": in_zone}
            )

    return {
        "persons_detected": len(detections),
        "persons_in_danger_zone": persons_in_zone,
        "risk": persons_in_zone > 0,
        "detections": detections,
        "model": MODEL_PATH,
        "note": (
            "Deteccao de EPI (capacete) requer modelo customizado — ver docstring deste arquivo."
        ),
    }


class handler(BaseHTTPRequestHandler):
    """Formato de handler exigido pelo runtime Python da Vercel."""

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            payload = json.loads(body.decode("utf-8"))

            image_b64 = payload["image_base64"]
            danger_zone = payload.get("danger_zone_polygon", [])

            image_bytes = base64.b64decode(image_b64)
            result = analyze_image(image_bytes, danger_zone)

            self._send_json(200, result)
        except Exception as exc:  # noqa: BLE001 — resposta de erro controlada para o cliente
            self._send_json(500, {"error": str(exc)})

    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
