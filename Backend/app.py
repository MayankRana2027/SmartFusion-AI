import tensorflow as tf
import numpy as np
from PIL import Image, UnidentifiedImageError
import requests
from io import BytesIO

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool

app = FastAPI()

origins = [
    "http://localhost:5173",  # for local development
    "https://smart-fusion-ai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Image Utilities ──────────────────────────────────────────────
def fetch_image(path) -> Image.Image:
    if path.startswith(('http://', 'https://')):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': path,
        }
        response = requests.get(path, headers=headers, timeout=10)
        if response.status_code != 200:
            raise ValueError(f"HTTP {response.status_code} — URL blocked or not found")
        if 'image' not in response.headers.get('Content-Type', ''):
            raise ValueError(
                f"URL returned non-image content: {response.headers.get('Content-Type')}."
            )
        return Image.open(BytesIO(response.content)).convert('RGB')

    return Image.open(path).convert('RGB')


def preprocess(img: Image.Image, max_dim=1024):
    img = img.convert('RGB')
    w, h = img.size

    scale = max_dim / max(h, w)
    if scale < 1.0:  # only downscale, never upscale during processing
        new_w, new_h = int(w * scale), int(h * scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)

    arr = np.array(img, dtype=np.float32) / 255.0
    return tf.constant(arr[np.newaxis, ...])  # [1, H, W, 3]


def load_image(path, max_dim=1024):
    return preprocess(fetch_image(path), max_dim=max_dim)


def deprocess(img):
    img = tf.squeeze(img)
    img = img * 255
    img = tf.clip_by_value(img, 0, 255)
    return np.array(img, dtype=np.uint8)


# ── Build VGG-19 Feature Extractor (once, at startup) ─────────────
content_layers = ['block5_conv2']
style_layers = ['block1_conv1', 'block2_conv1',
                 'block3_conv1', 'block4_conv1', 'block5_conv1']

vgg = tf.keras.applications.VGG19(include_top=False, weights='imagenet')
vgg.trainable = False

_vgg_outputs = [vgg.get_layer(l).output for l in style_layers + content_layers]
feature_extractor = tf.keras.Model([vgg.input], _vgg_outputs)
print("VGG-19 ready")


def gram_matrix(tensor):
    result = tf.einsum('bijc,bijd->bcd', tensor, tensor)
    n = tf.cast(tf.shape(tensor)[1] * tf.shape(tensor)[2], tf.float32)
    return result / n


def get_features(image):
    x = tf.keras.applications.vgg19.preprocess_input(image * 255)
    outs = feature_extractor(x)  # feature maps
    n = len(style_layers)
    return (
        {name: gram_matrix(out) for name, out in zip(style_layers, outs[:n])},
        {name: out for name, out in zip(content_layers, outs[n:])},
    )


# Loss weights (NST standard values, same as the original script)
style_weight = 1e-2
content_weight = 1e4
tv_weight = 30  # total variation weight — reduces noise/artifacts


def run_style_transfer(content_image, style_image, epochs=10, steps_per_epoch=100):
    style_targets, _ = get_features(style_image)
    _, content_targets = get_features(content_image)

    def total_loss(image):
        sf, cf = get_features(image)

        sl = tf.add_n([tf.reduce_mean((sf[n] - style_targets[n]) ** 2)
                       for n in style_layers])
        cl = tf.add_n([tf.reduce_mean((cf[n] - content_targets[n]) ** 2)
                       for n in content_layers])
        tv = tf.image.total_variation(image)

        return style_weight * sl + content_weight * cl + tv_weight * tv

    opt = tf.optimizers.Adam(learning_rate=0.02, beta_1=0.99, epsilon=1e-1)
    generated = tf.Variable(content_image)

    @tf.function
    def train_step(image):
        with tf.GradientTape() as tape:
            loss = total_loss(image)
        grad = tape.gradient(loss, image)
        opt.apply_gradients([(grad, image)])
        image.assign(tf.clip_by_value(image, 0.0, 1.0))
        return loss

    for epoch in range(epochs):
        for _ in range(steps_per_epoch):
            loss = train_step(generated)
        print(f"Epoch {epoch + 1}/{epochs} — Loss: {float(loss):.4f}")

    return generated


# ── API Endpoint ────────────────────────────────────────────────────
@app.post("/style_transfer")
async def style_transfer(
    content_img: UploadFile = File(...),
    style_img: UploadFile = File(...),
    epochs: int = Form(10),
    steps_per_epoch: int = Form(100),
):
    for f in (content_img, style_img):
        if not f.content_type or not f.content_type.startswith("image/"):
            raise HTTPException(400, f"'{f.filename}' is not an image file")

    try:
        content_pil = Image.open(BytesIO(await content_img.read())).convert("RGB")
        style_pil = Image.open(BytesIO(await style_img.read())).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(400, "One of the uploaded files could not be read as an image")

    original_W, original_H = content_pil.size
    print(f"Original content size: {original_H} x {original_W}")

    content_tensor = preprocess(content_pil, max_dim=1024)
    style_tensor = preprocess(style_pil, max_dim=1024)

    print(f"Processing content shape: {content_tensor.shape}")
    print(f"Processing style shape:   {style_tensor.shape}")

    try:
        generated = await run_in_threadpool(
            run_style_transfer, content_tensor, style_tensor, epochs, steps_per_epoch
        )
    except Exception as exc:
        raise HTTPException(500, f"Style transfer failed: {exc}")

    # ── Restore original resolution ─────────────────────────────────
    result_fullres = tf.image.resize(
        generated[0],
        [original_H, original_W],
        method=tf.image.ResizeMethod.BICUBIC  # BICUBIC gives sharper upscale
    )
    result_fullres = deprocess(result_fullres)
    print(f"Output size: {result_fullres.shape[0]} x {result_fullres.shape[1]}")

    try:
        tf.keras.utils.save_img('output.jpg', result_fullres)  # debug copy on disk
    except Exception as exc:
        print(f"Warning: could not save debug output.jpg ({exc})")

    buf = BytesIO()
    Image.fromarray(result_fullres).save(buf, format="JPEG", quality=90)
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/jpeg")