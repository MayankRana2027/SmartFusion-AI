import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/instructions.css'

export default function Instructions() {
  return (
    <>
      <section className="instructions">
        <p className="instructions__greeting">
          Hello everyone! 👋
        </p>
        <p className="instructions__greeting">
          Welcome to SmartFusion AI
        </p>

        <h2 className="instructions__heading">
          Turn Your Photos into Stunning Artwork
        </h2>

        <p className="instructions__intro">
        Ever wondered how your photo would look as a painting, sketch, or digital masterpiece? 
        </p>
        <p className="instructions__intro">
          SmartFusion AI makes it easy by applying the style of your chosen artwork to your image.
        </p>

        <p className="instructions__step-label">
          Follow these instructions:
        </p>

        <ul className="instructions__list">
          <li>
            <strong>Choose a Content Image</strong> — the photo you want to
            transform.
          </li>

          <li>
            <strong>Choose a Style Image</strong> — an artwork or image whose
            style you want to apply.
          </li>
          <li>
            Click <strong>Start Styling</strong> to use our AI styling tool.
          </li>
          <li>
            Upload both your content image and style image, then click
            <strong> Generate</strong> to create your AI-powered artwork.
          </li>
        </ul>

        <p>
          Processing may take a few minutes. Once the generation is complete, you can preview and download your final image.
        </p>

        <p className="instructions__closing">
          Experiment with different styles and discover endless creative
          possibilities. 🎨
        </p>
      </section>

      <Link id="btn" to="/generate">
        Start Styling
      </Link>
    </>
  )
}
