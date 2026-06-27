# Learn FastAPI Step by Step

This guide is for a fresher engineer learning FastAPI by typing code. Each step
explains:

- **What** you are writing
- **Why** the code is written in that shape
- **How** to run or test it

The example builds a small in-memory task API. It intentionally avoids a
database at first so you can understand FastAPI routes, request data, response
data, and validation before adding persistence.

## Prerequisites

Use Python 3.12 or newer if possible.

```bash
mkdir fastapi-learning
cd fastapi-learning
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]"
```

**What:** Create a project folder, a virtual environment, and install FastAPI.

**Why write commands like this:**

- `python -m venv .venv` creates an isolated Python environment for this
  project.
- `.venv` is a common local folder name for that environment.
- `source .venv/bin/activate` makes your shell use the project environment.
- `pip install "fastapi[standard]"` installs FastAPI plus common development
  dependencies, including the development server command.

**How to confirm it worked:**

```bash
fastapi --help
```

## Step 1: Create the App Object

Create `main.py`:

```python
from fastapi import FastAPI

app = FastAPI()
```

**What:** Create a FastAPI application object.

**Why write code like this:**

- `FastAPI` is the class that creates your web application.
- `app` is the object the server imports and runs.
- Routes are attached to this `app` object.
- Without `app = FastAPI()`, there is no FastAPI application for the server to
  execute.

**How to think about it:**

```text
FastAPI() creates the API program.
app stores that API program.
Route decorators attach endpoints to app.
```

## Step 2: Add the First Route

Update `main.py`:

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello FastAPI"}
```

**What:** Create an endpoint for `GET /`.

**Why write code like this:**

- `@app.get("/")` tells FastAPI: when a client sends `GET /`, run the function
  immediately below the decorator.
- `def read_root():` is a normal Python function. The name can be anything, but
  it should describe the endpoint.
- Returning a dictionary is useful because FastAPI automatically serializes it
  as JSON.
- JSON is the normal data format for HTTP APIs.

**How to run it:**

```bash
fastapi dev main.py
```

Open:

```text
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
```

**How it works:**

```text
Client requests GET /
FastAPI finds @app.get("/")
FastAPI runs read_root()
FastAPI converts {"message": "..."} to JSON
```

## Step 3: Add a Path Parameter

Add this route:

```python
@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    return {"task_id": task_id}
```

**What:** Read `task_id` from the URL.

**Why write code like this:**

- `"/tasks/{task_id}"` means that part of the URL is dynamic.
- The name inside `{task_id}` must match the function argument `task_id`.
- `task_id: int` tells FastAPI to convert the URL value to an integer.
- If a client sends `/tasks/abc`, FastAPI rejects the request automatically
  because `abc` cannot become an integer.

**How to test it:**

```text
http://127.0.0.1:8000/tasks/123
```

**How it works:**

```text
GET /tasks/123
task_id becomes 123
get_task(task_id=123) runs
```

## Step 4: Add Query Parameters

Add this route:

```python
@app.get("/tasks")
def list_tasks(done: bool | None = None):
    return {"filter_done": done}
```

**What:** Read an optional filter from the query string.

**Why write code like this:**

- `done` is not in the route path, so FastAPI treats it as a query parameter.
- `bool | None` means the value can be `True`, `False`, or missing.
- `= None` makes the parameter optional.
- Query parameters are a good fit for filtering, searching, and pagination
  because they modify a collection request without changing the resource path.

**How to test it:**

```text
/tasks
/tasks?done=true
/tasks?done=false
```

**Path vs query rule:**

```text
/tasks/{task_id}    path parameter because it is part of the path
/tasks?done=true    query parameter because it appears after ?
```

## Step 5: Add a Request Body Model

Add this import and model:

```python
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    done: bool = False
```

**What:** Define the JSON body accepted when creating a task.

**Why write code like this:**

- `BaseModel` tells Pydantic that this class describes validated data.
- `title: str` means the client must send a `title`, and it must be text.
- `done: bool = False` means `done` is optional; if missing, it defaults to
  `False`.
- This removes the need to manually parse and validate raw JSON in every route.
- The model also appears automatically in `/docs`, which helps API users know
  what to send.

**Valid request body:**

```json
{
  "title": "Learn FastAPI"
}
```

FastAPI turns it into:

```python
TaskCreate(title="Learn FastAPI", done=False)
```

## Step 6: Use the Model in a POST Route

Add this route:

```python
@app.post("/tasks")
def create_task(task: TaskCreate):
    return {
        "title": task.title,
        "done": task.done,
    }
```

**What:** Create a task from a JSON request body.

**Why write code like this:**

- `@app.post("/tasks")` is used because `POST` means create a new resource.
- `task: TaskCreate` tells FastAPI the request body must match the
  `TaskCreate` model.
- `task.title` and `task.done` are safe to use because FastAPI already validated
  them before calling your function.
- Returning a dictionary sends a JSON response.

**How it works:**

```text
Client sends POST /tasks with JSON
FastAPI validates JSON using TaskCreate
FastAPI gives your function a task object
Your function returns JSON
```

## Step 7: Store Tasks in Memory

Near the top of `main.py`, after `app = FastAPI()`, add:

```python
tasks: list[dict] = []
next_id = 1
```

**What:** Create temporary storage for tasks.

**Why write code like this:**

- `tasks` is a list because the API needs to store multiple tasks.
- `list[dict]` documents that the list contains dictionaries.
- `next_id` gives every new task a unique identifier.
- This is not production storage. It is useful for learning CRUD before adding a
  database.

Then replace the `create_task` route with:

```python
@app.post("/tasks")
def create_task(task: TaskCreate):
    global next_id

    new_task = {
        "id": next_id,
        "title": task.title,
        "done": task.done,
    }

    tasks.append(new_task)
    next_id += 1

    return new_task
```

**Why write code like this:**

- `global next_id` is needed because the function changes the outer `next_id`
  variable.
- `new_task = {...}` creates the object the server stores.
- `"id": next_id` gives the task a stable ID for future lookup.
- `tasks.append(new_task)` saves the task in memory.
- `next_id += 1` prepares the next unique ID.
- `return new_task` tells the client exactly what was created.

**Important idea:**

```text
Input model: what the client sends
Stored object: what the server saves
Response: what the server sends back
```

These are related, but they are not always identical.

## Step 8: Read All Tasks

Replace the earlier `list_tasks` route with:

```python
@app.get("/tasks")
def list_tasks():
    return tasks
```

**What:** Return all stored tasks.

**Why write code like this:**

- `GET` is used because this endpoint reads data without changing it.
- `/tasks` represents the collection of task resources.
- Returning a Python list is fine because FastAPI serializes lists and
  dictionaries to JSON.

**How to test it:**

1. Create one or two tasks in `/docs`.
2. Run `GET /tasks`.
3. Confirm the response is a JSON array.

## Step 9: Read One Task and Return 404

Update the imports:

```python
from fastapi import FastAPI, HTTPException
```

Replace the earlier `get_task` route with:

```python
@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    for task in tasks:
        if task["id"] == task_id:
            return task

    raise HTTPException(status_code=404, detail="Task not found")
```

**What:** Find one task by ID or return an API error.

**Why write code like this:**

- The loop checks each stored task.
- `task["id"] == task_id` finds the matching task.
- `return task` exits immediately when a match is found.
- `HTTPException` is the FastAPI way to intentionally return an HTTP error.
- `404` means the requested resource does not exist.
- Returning a proper `404` is better than returning `None`, because API clients
  can reliably handle status codes.

**How to test it:**

```text
GET /tasks/1       should return a task if it exists
GET /tasks/9999    should return 404
```

## Step 10: Add Partial Update

Add this model:

```python
class TaskUpdate(BaseModel):
    title: str | None = None
    done: bool | None = None
```

**What:** Define the body accepted when updating a task.

**Why write code like this:**

- Create data and update data have different rules.
- When creating, `title` is required.
- When updating, the client might only want to change `done`.
- `str | None = None` makes `title` optional.
- `bool | None = None` makes `done` optional.
- Separate models keep API behavior clear and prevent accidental validation
  rules.

Add the route:

```python
@app.patch("/tasks/{task_id}")
def update_task(task_id: int, update: TaskUpdate):
    for task in tasks:
        if task["id"] == task_id:
            if update.title is not None:
                task["title"] = update.title
            if update.done is not None:
                task["done"] = update.done
            return task

    raise HTTPException(status_code=404, detail="Task not found")
```

**Why write code like this:**

- `PATCH` means partial update.
- The route includes `{task_id}` because you update one specific task.
- `update: TaskUpdate` validates the request body.
- `if update.title is not None` changes the title only when the client sent one.
- `if update.done is not None` matters because `False` is a valid value.
- Do not write `if update.done:` because that would ignore a real update to
  `False`.

**How to test it:**

```json
{
  "done": true
}
```

Then:

```json
{
  "done": false
}
```

Both updates should work.

## Step 11: Add Delete

Add this route:

```python
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for index, task in enumerate(tasks):
        if task["id"] == task_id:
            deleted = tasks.pop(index)
            return deleted

    raise HTTPException(status_code=404, detail="Task not found")
```

**What:** Remove one task by ID.

**Why write code like this:**

- `DELETE` is the HTTP method for removing a resource.
- `enumerate(tasks)` gives both the list index and the task object.
- `tasks.pop(index)` removes the matching task from the list.
- Returning the deleted task is useful feedback for the client.
- The final `HTTPException` handles the case where the task does not exist.

**How to test it:**

```text
DELETE /tasks/1
GET /tasks/1 should now return 404
```

## Complete `main.py`

After all steps, your file should look like this:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

tasks: list[dict] = []
next_id = 1


class TaskCreate(BaseModel):
    title: str
    done: bool = False


class TaskUpdate(BaseModel):
    title: str | None = None
    done: bool | None = None


@app.get("/")
def read_root():
    return {"message": "Hello FastAPI"}


@app.post("/tasks")
def create_task(task: TaskCreate):
    global next_id

    new_task = {
        "id": next_id,
        "title": task.title,
        "done": task.done,
    }

    tasks.append(new_task)
    next_id += 1

    return new_task


@app.get("/tasks")
def list_tasks():
    return tasks


@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    for task in tasks:
        if task["id"] == task_id:
            return task

    raise HTTPException(status_code=404, detail="Task not found")


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, update: TaskUpdate):
    for task in tasks:
        if task["id"] == task_id:
            if update.title is not None:
                task["title"] = update.title
            if update.done is not None:
                task["done"] = update.done
            return task

    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for index, task in enumerate(tasks):
        if task["id"] == task_id:
            deleted = tasks.pop(index)
            return deleted

    raise HTTPException(status_code=404, detail="Task not found")
```

## Practice Tasks

Do these after the base API works:

1. Add `description: str | None = None` to tasks.
2. Add `priority: int = 1`.
3. Add validation so priority must be from `1` to `5`.
4. Add query filtering: `/tasks?done=true`.
5. Add `GET /health` that returns `{"status": "ok"}`.
6. Split the app into `models.py`, `routes.py`, and `main.py`.
7. Replace the in-memory list with SQLite or Postgres.

## Mental Model

FastAPI code is written this way because each part has one job:

```text
@app.get/post/patch/delete -> tells FastAPI the HTTP route
function parameters       -> tell FastAPI where data comes from
type hints                -> tell FastAPI how to validate data
Pydantic models           -> describe JSON request bodies
return dict/list          -> FastAPI converts it to JSON
HTTPException             -> sends proper API error responses
```

When writing a route, ask:

```text
Is this data coming from the path, query string, request body, or server storage?
```

That answer usually tells you how to write the FastAPI code.
