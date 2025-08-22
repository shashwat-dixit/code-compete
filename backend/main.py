from fastapi import FastAPI

app = FastAPI(description="Code-Compete")

@app.get('/')
def get_root():
    return {"message" : "Welcome to Code Compete"}
