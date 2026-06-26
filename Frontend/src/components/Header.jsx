import React from 'react';
import logo from '../../logo.png';
import '../styles/header.css';

export default function Header({ theme, onSelectTheme }) {
    const isDark = theme === 'dark';
    const actionLabel = isDark ? 'Apply light mode' : 'Apply dark mode';

    return (
        <header className="app-header">
            <label className="theme-toggle">
                <span className="theme-toggle__label">{actionLabel}</span>
                <input
                    type="checkbox"
                    className="theme-toggle__input"
                    checked={isDark}
                    onChange={() => onSelectTheme(isDark ? 'light' : 'dark')}
                    aria-label={actionLabel}
                />
                <span className={`theme-toggle__track ${isDark ? 'is-checked' : ''}`}>
                    <span className="theme-toggle__thumb" />
                </span>
            </label>

            <h1 className="app-header__brand">
                <span className="sr-only">SmartFusion AI</span>
                <img
                    src={logo}
                    alt=""
                    className="app-header__brand-mark"
                    aria-hidden="true"
                />
                <span className="app-header__brand-word" aria-hidden="true">
                    martFusion<span className="app-header__brand-ai">AI</span>
                </span>
            </h1>
            <p className="app-header__tagline">From Pixels to Masterpieces</p>
        </header>
    );
}