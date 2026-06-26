import React, { useState } from 'react'
import '../styles/buttons.css'
import axios from 'axios'

const api =  axios.create({
  baseURL: import.meta.env.VITE_API_URL, // your FastAPI server
});

export default function Buttons() {
    // Actual files (needed for upload) — separate from the blob URLs used for <img> previews
    const [contentFile, setContentFile] = useState(null);
    const [styleFile, setStyleFile] = useState(null);
    const [contentPreview, setContentPreview] = useState(null);
    const [stylePreview, setStylePreview] = useState(null);

    const [resultImage, setResultImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function handleContentImage(e) {
        const file = e.target.files[0];
        if (file) {
            if (contentPreview) URL.revokeObjectURL(contentPreview);
            setContentFile(file);
            setContentPreview(URL.createObjectURL(file));
        }
    }

    function handleStyleImage(e) {
        const file = e.target.files[0];
        if (file) {
            if (stylePreview) URL.revokeObjectURL(stylePreview);
            setStyleFile(file);
            setStylePreview(URL.createObjectURL(file));
        }
    }

    async function start() {
        if (!contentFile || !styleFile) {
            setError("Please upload both images.");
            return;
        }

        setError("");
        setLoading(true);

        // Free the previous result's blob URL before requesting a new one
        if (resultImage) {
            URL.revokeObjectURL(resultImage);
            setResultImage(null);
        }

        const formData = new FormData();
        formData.append("content_img", contentFile);
        formData.append("style_img", styleFile);

        try {
            const response = await api.post("/style_transfer", formData, {
                responseType: "blob", // we're expecting raw JPEG bytes back, not JSON
            });

            setResultImage(URL.createObjectURL(response.data));
        } catch (err) {
            console.error(err);

            // On success we ask axios for a Blob — but that means error responses
            // (FastAPI's {"detail": "..."} JSON) arrive as a Blob too, not parsed JSON.
            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    setError(JSON.parse(text).detail || "Style transfer failed.");
                } catch {
                    setError("Style transfer failed.");
                }
            } else if (err.code === "ECONNABORTED") {
                setError("Request timed out — the server may be taking longer than expected.");
            } else {
                setError("Could not reach the server. Is the backend running?");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="upload-row">
                {/* Content column */}
                <div className="upload-column">
                    {contentPreview && (
                        <div className="image-preview">
                            <p>Content Image</p>
                            <img src={contentPreview} alt="Content" />
                        </div>
                    )}
                    <label htmlFor="content-image" className="upload-btn">
                        Upload Content Image
                    </label>
                    <input
                        id="content-image"
                        type="file"
                        accept="image/*"
                        onChange={handleContentImage}
                        hidden
                    />
                </div>

                {/* Style column */}
                <div className="upload-column">
                    {stylePreview && (
                        <div className="image-preview">
                            <p>Style Image</p>
                            <img src={stylePreview} alt="Style" />
                        </div>
                    )}
                    <label htmlFor="style-image" className="upload-btn">
                        Upload Style Image
                    </label>
                    <input
                        id="style-image"
                        type="file"
                        accept="image/*"
                        onChange={handleStyleImage}
                        hidden
                    />
                </div>
            </div>

            {/* Button for blending the images */}
            <button id="start-btn" onClick={start} disabled={loading}>
                {loading ? "Generating..." : "Generate"}
            </button>

            {/* Error message */}
            {error && <p className="error-text">{error}</p>}

            {/* Generated result */}
            {resultImage && (
                <div className="image-preview">
                    <p>Generated Image</p>
                    <img src={resultImage} alt="Generated result" />
                    <a
                        href={resultImage}
                        download="styled-output.jpg"
                        className="upload-btn"
                    >
                        Download
                    </a>
                </div>
            )}
        </>
    );
}