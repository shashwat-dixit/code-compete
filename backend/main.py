from fastapi import FastAPI
import uvicorn

items = []

app = FastAPI(title="FastAPI", description="Trying out FastAPI")

@app.get('/')
def read_root():
    return {'message': 'Welcome to FastAPI'}

# Run with uvicorn
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)