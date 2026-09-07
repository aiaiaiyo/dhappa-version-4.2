import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
	error: Error | null;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
	declare readonly props: { children: ReactNode };
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('Application startup failed:', error, info.componentStack);
	}

	render() {
		if (this.state.error) {
			return (
				<main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
					<section className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl">
						<h1 className="text-xl font-bold text-red-300">Application could not start</h1>
						<p className="mt-3 text-sm text-slate-300">Refresh the page after closing other tabs using this application.</p>
						<pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-red-200">{this.state.error.message}</pre>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
						>
							Reload application
						</button>
					</section>
				</main>
			);
		}

		return this.props.children;
	}
}

const root = document.getElementById('root');
if (!root) throw new Error('Application root element is missing.');

createRoot(root).render(
	<AppErrorBoundary>
		<App />
	</AppErrorBoundary>
);
