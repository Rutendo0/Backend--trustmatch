"""WSGI entry point for production deployment of the face verification AI service."""
from app import app, _model_loaded

if not _model_loaded:
    import sys
    print("FATAL: Model failed to load at startup. Exiting.", file=sys.stderr)
    sys.exit(1)

application = app

if __name__ == "__main__":
    from waitress import serve
    from app import load_model, _model_loaded

    # Ensure model is loaded
    if not _model_loaded:
        load_model()

    if not _model_loaded:
        print("FATAL: Cannot start server - model not loaded.")
        exit(1)

    port = int(__import__('os').environ.get('PORT', 5001))
    print(f"Starting production server on port {port}...")
    serve(app, host="0.0.0.0", port=port)